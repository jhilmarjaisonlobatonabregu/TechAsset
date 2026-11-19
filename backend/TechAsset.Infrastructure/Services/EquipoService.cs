using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Entities;
using TechAsset.Domain.Exceptions;
using TechAsset.Infrastructure.Persistence;

namespace TechAsset.Infrastructure.Services;

public class EquipoService : IEquipoService
{
    private const string MensajeEquipoNoExiste = "El equipo tecnológico solicitado no existe.";

    private readonly TechAssetDbContext _db;

    public EquipoService(TechAssetDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<EquipoDto>> ListarAsync(
        string? busqueda = null,
        string? estado = null,
        string? categoria = null,
        string? marca = null,
        CancellationToken ct = default)
    {
        var query = _db.Equipos
            .AsNoTracking()
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLowerInvariant();
            query = query.Where(e =>
                e.CodigoPatrimonial.ToLower().Contains(term) ||
                e.Nombre.ToLower().Contains(term) ||
                e.Categoria.ToLower().Contains(term) ||
                e.Marca.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            var estNorm = estado.Trim().ToLowerInvariant();
            query = query.Where(e => e.Estado.ToLower() == estNorm);
        }

        if (!string.IsNullOrWhiteSpace(categoria))
        {
            var catNorm = categoria.Trim().ToLowerInvariant();
            query = query.Where(e => e.Categoria.ToLower() == catNorm);
        }

        if (!string.IsNullOrWhiteSpace(marca))
        {
            var marcaNorm = marca.Trim().ToLowerInvariant();
            query = query.Where(e => e.Marca.ToLower() == marcaNorm);
        }

        var equipos = await query
            .OrderBy(e => e.CodigoPatrimonial)
            .ToListAsync(ct);

        return equipos.Select(MapearDto).ToList();
    }

    public async Task<EquipoDto> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var equipo = await _db.Equipos
            .AsNoTracking()
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", MensajeEquipoNoExiste, 404);
        }

        return MapearDto(equipo);
    }

    public async Task<EquipoDto> CrearAsync(CrearEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default)
    {
        var codigoNorm = dto.CodigoPatrimonial.Trim().ToUpperInvariant();
        var existeCodigo = await _db.Equipos.AnyAsync(e => e.CodigoPatrimonial.ToUpper() == codigoNorm, ct);
        if (existeCodigo)
        {
            throw new ReglaNegocioException(
                "RN-07",
                $"RN-07: El código patrimonial del equipo debe ser único. Ya existe un activo registrado con el código '{codigoNorm}'.",
                409);
        }

        var estadoInicial = string.IsNullOrWhiteSpace(dto.Estado) ? EstadosEquipo.Disponible : dto.Estado.Trim();

        var equipo = new Equipo
        {
            Id = Guid.NewGuid(),
            CodigoPatrimonial = codigoNorm,
            Nombre = dto.Nombre.Trim(),
            Categoria = dto.Categoria.Trim(),
            Marca = dto.Marca.Trim(),
            Estado = estadoInicial,
            FechaRegistro = DateTime.UtcNow
        };

        _db.Equipos.Add(equipo);

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = TiposMovimiento.AltaEquipo,
            EquipoId = equipo.Id,
            EstadoAnterior = "Nuevo",
            EstadoNuevo = equipo.Estado,
            ResponsableId = responsableId,
            Area = Areas.InfraestructuraSoporte,
            Observacion = $"Alta en inventario del equipo {equipo.CodigoPatrimonial} ({equipo.Nombre})."
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(equipo);
    }

    public async Task<EquipoDto> ActualizarAsync(Guid id, ActualizarEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default)
    {
        var equipo = await _db.Equipos
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", "El equipo que intenta actualizar no existe.", 404);
        }

        var codigoNorm = dto.CodigoPatrimonial.Trim().ToUpperInvariant();
        var existeCodigo = await _db.Equipos.AnyAsync(e => e.Id != id && e.CodigoPatrimonial.ToUpper() == codigoNorm, ct);
        if (existeCodigo)
        {
            throw new ReglaNegocioException(
                "RN-07",
                $"RN-07: El código patrimonial del equipo debe ser único. Otro equipo ya utiliza el código '{codigoNorm}'.",
                409);
        }

        var estadoAnterior = equipo.Estado;
        var estadoNuevo = string.IsNullOrWhiteSpace(dto.Estado) ? equipo.Estado : dto.Estado.Trim();

        equipo.Actualizar(codigoNorm, dto.Nombre, dto.Categoria, dto.Marca, estadoNuevo);

        var tipoMov = !string.Equals(estadoAnterior, equipo.Estado, StringComparison.OrdinalIgnoreCase)
            ? TiposMovimiento.CambioEstado
            : TiposMovimiento.ActualizacionEquipo;

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = tipoMov,
            EquipoId = equipo.Id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = equipo.Estado,
            ResponsableId = responsableId,
            Area = Areas.InfraestructuraSoporte,
            Observacion = tipoMov == TiposMovimiento.CambioEstado
                ? $"Actualización de datos y cambio de estado de '{estadoAnterior}' a '{equipo.Estado}'."
                : $"Actualización de ficha técnica del equipo {equipo.CodigoPatrimonial}."
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(equipo);
    }

    public async Task<EquipoDto> CambiarEstadoAsync(Guid id, CambiarEstadoEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default)
    {
        var equipo = await _db.Equipos
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", MensajeEquipoNoExiste, 404);
        }

        var estadoAnterior = equipo.Estado;
        equipo.CambiarEstado(dto.Estado);

        var esBaja = string.Equals(equipo.Estado, EstadosEquipo.Baja, StringComparison.OrdinalIgnoreCase);

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = esBaja ? TiposMovimiento.BajaLogica : TiposMovimiento.CambioEstado,
            EquipoId = equipo.Id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = equipo.Estado,
            ResponsableId = responsableId,
            Area = Areas.InfraestructuraSoporte,
            Observacion = string.IsNullOrWhiteSpace(dto.Observacion)
                ? $"Cambio de estado operativo de '{estadoAnterior}' a '{equipo.Estado}'."
                : dto.Observacion.Trim()
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(equipo);
    }

    public async Task<EquipoDto> EliminarOBajaLogicaAsync(Guid id, bool aplicarBajaLogica = false, Guid? responsableId = null, CancellationToken ct = default)
    {
        var equipo = await _db.Equipos
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", MensajeEquipoNoExiste, 404);
        }

        var estadoAnterior = equipo.Estado;
        equipo.DarDeBajaLogica(aplicarBajaLogica);

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = TiposMovimiento.BajaLogica,
            EquipoId = equipo.Id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = EstadosEquipo.Baja,
            ResponsableId = responsableId,
            Area = Areas.InfraestructuraSoporte,
            Observacion = "RN-06: Baja lógica aplicada al equipo conservando su trazabilidad histórica."
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(equipo);
    }

    public static EquipoDto MapearDto(Equipo e)
    {
        var prestamoActivo = e.Prestamos?.FirstOrDefault(p => p.EstadoPrestamo == EstadosPrestamo.Activo);
        return new EquipoDto
        {
            Id = e.Id,
            CodigoPatrimonial = e.CodigoPatrimonial,
            Nombre = e.Nombre,
            Categoria = e.Categoria,
            Marca = e.Marca,
            Estado = e.Estado,
            TotalPrestamos = e.Prestamos?.Count(p => p.EstadoPrestamo != EstadosPrestamo.Pendiente) ?? 0,
            UsuarioActual = prestamoActivo?.Usuario?.NombreCompleto,
            AreaActual = prestamoActivo?.Usuario?.Area,
            FechaRegistro = e.FechaRegistro
        };
    }
}
