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
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico solicitado no existe.", 404);
        }

        return MapearDto(equipo);
    }

    public async Task<EquipoDto> CrearAsync(CrearEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default)
    {
        ValidarCamposEquipo(dto.CodigoPatrimonial, dto.Nombre, dto.Categoria, dto.Marca);

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
        if (!EstadosEquipo.Todos.Contains(estadoInicial))
        {
            throw new ReglaNegocioException("VAL-ESTADO", $"El estado inicial '{estadoInicial}' no es válido.", 400);
        }

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
            Area = "Infraestructura y Soporte",
            Observacion = $"Alta en inventario del equipo {equipo.CodigoPatrimonial} ({equipo.Nombre})."
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(equipo);
    }

    public async Task<EquipoDto> ActualizarAsync(Guid id, ActualizarEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default)
    {
        ValidarCamposEquipo(dto.CodigoPatrimonial, dto.Nombre, dto.Categoria, dto.Marca);

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
            Area = "Infraestructura y Soporte",
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
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico solicitado no existe.", 404);
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
            Area = "Infraestructura y Soporte",
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
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico solicitado no existe.", 404);
        }

        var tienePrestamoActivo = equipo.Prestamos.Any(p => p.EstadoPrestamo == EstadosPrestamo.Activo) ||
                                  string.Equals(equipo.Estado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase);

        if (tienePrestamoActivo)
        {
            throw new ReglaNegocioException(
                "RN-01",
                "RN-01: No se puede eliminar ni dar de baja un equipo que tiene un préstamo activo.",
                409);
        }

        var tieneHistorialPrestamos = equipo.Prestamos.Count > 0;

        // RN-06: No se permitirá eliminar equipos con historial de préstamos; se aplicará baja lógica cambiando su estado a "Baja".
        if (tieneHistorialPrestamos && !aplicarBajaLogica)
        {
            throw new ReglaNegocioException(
                "RN-06",
                "RN-06: No se puede eliminar un equipo con historial de préstamos. Utilice la baja lógica cambiando su estado a 'Baja'.",
                409);
        }

        var estadoAnterior = equipo.Estado;
        equipo.Estado = EstadosEquipo.Baja;

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = TiposMovimiento.BajaLogica,
            EquipoId = equipo.Id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = EstadosEquipo.Baja,
            ResponsableId = responsableId,
            Area = "Infraestructura y Soporte",
            Observacion = "RN-06: Baja lógica aplicada al equipo conservando su trazabilidad histórica."
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(equipo);
    }

    private static void ValidarCamposEquipo(string codigo, string nombre, string categoria, string marca)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ReglaNegocioException("VAL-CODIGO", "El código patrimonial del equipo es obligatorio.", 400);

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ReglaNegocioException("VAL-NOMBRE", "El nombre o modelo del equipo es obligatorio.", 400);

        if (string.IsNullOrWhiteSpace(categoria) || !CategoriasEquipo.Todas.Contains(categoria.Trim()))
            throw new ReglaNegocioException("VAL-CATEGORIA", $"La categoría '{categoria}' no es válida.", 400);

        if (string.IsNullOrWhiteSpace(marca))
            throw new ReglaNegocioException("VAL-MARCA", "La marca del equipo es obligatoria.", 400);
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
