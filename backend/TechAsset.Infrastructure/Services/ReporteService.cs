using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Entities;
using TechAsset.Infrastructure.Persistence;

namespace TechAsset.Infrastructure.Services;

public class ReporteService : IReporteService
{
    private readonly TechAssetDbContext _db;

    public ReporteService(TechAssetDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardDto> ObtenerDashboardAsync(CancellationToken ct = default)
    {
        var equipos = await _db.Equipos
            .AsNoTracking()
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .ToListAsync(ct);

        var prestamos = await _db.Prestamos
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Include(p => p.Equipo)
            .ToListAsync(ct);

        var totalEquipos = equipos.Count;
        var disponibles = equipos.Count(e => e.Estado == EstadosEquipo.Disponible);
        var prestados = equipos.Count(e => e.Estado == EstadosEquipo.Prestado);
        var mantenimiento = equipos.Count(e => e.Estado == EstadosEquipo.Mantenimiento);
        var baja = equipos.Count(e => e.Estado == EstadosEquipo.Baja);

        var totalPrestamos = prestamos.Count;
        var prestamosActivos = prestamos.Count(p => p.EstadoPrestamo == EstadosPrestamo.Activo);
        var prestamosDevueltos = prestamos.Count(p => p.EstadoPrestamo == EstadosPrestamo.Devuelto);

        var equiposPorEstado = EstadosEquipo.Todos.Select(est =>
        {
            var cant = equipos.Count(e => e.Estado == est);
            return new EquiposPorEstadoItemDto
            {
                Estado = est,
                Cantidad = cant,
                Porcentaje = totalEquipos > 0 ? Math.Round(cant * 100.0 / totalEquipos, 1) : 0
            };
        }).ToList();

        var prestamosPorArea = await ObtenerPrestamosPorAreaAsync(ct);
        var areaMayor = prestamosPorArea.FirstOrDefault();

        var equiposMasUtilizados = await ObtenerEquiposMasUtilizadosAsync(6, ct);
        var ultimosMovimientos = await ObtenerMovimientosAsync(ct: ct);

        return new DashboardDto
        {
            TotalEquipos = totalEquipos,
            EquiposDisponibles = disponibles,
            EquiposPrestados = prestados,
            EquiposEnMantenimiento = mantenimiento,
            EquiposDeBaja = baja,
            TotalPrestamos = totalPrestamos,
            PrestamosActivos = prestamosActivos,
            PrestamosDevueltos = prestamosDevueltos,
            AreaConMayorUso = areaMayor?.Area ?? "Sin registros",
            PrestamosAreaMayorUso = areaMayor?.TotalPrestamos ?? 0,
            EquiposPorEstado = equiposPorEstado,
            PrestamosPorArea = prestamosPorArea,
            EquiposMasUtilizados = equiposMasUtilizados,
            UltimosMovimientos = ultimosMovimientos.Take(8).ToList()
        };
    }

    public async Task<ReporteEquiposPorEstadoDto> ObtenerEquiposPorEstadoAsync(string? estado = null, CancellationToken ct = default)
    {
        var todosEquipos = await _db.Equipos
            .AsNoTracking()
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .OrderBy(e => e.CodigoPatrimonial)
            .ToListAsync(ct);

        var total = todosEquipos.Count;
        var resumen = EstadosEquipo.Todos.Select(est =>
        {
            var cant = todosEquipos.Count(e => e.Estado == est);
            return new EquiposPorEstadoItemDto
            {
                Estado = est,
                Cantidad = cant,
                Porcentaje = total > 0 ? Math.Round(cant * 100.0 / total, 1) : 0
            };
        }).ToList();

        var filtrados = string.IsNullOrWhiteSpace(estado)
            ? todosEquipos
            : todosEquipos.Where(e => string.Equals(e.Estado, estado.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();

        return new ReporteEquiposPorEstadoDto
        {
            Resumen = resumen,
            Equipos = filtrados.Select(EquipoService.MapearDto).ToList()
        };
    }

    public async Task<IReadOnlyList<EquipoMasUtilizadoDto>> ObtenerEquiposMasUtilizadosAsync(int top = 10, CancellationToken ct = default)
    {
        var equipos = await _db.Equipos
            .AsNoTracking()
            .Include(e => e.Prestamos)
                .ThenInclude(p => p.Usuario)
            .ToListAsync(ct);

        return equipos
            .Select(e =>
            {
                var ultimoPrestamo = e.Prestamos
                    .OrderByDescending(p => p.FechaPrestamo)
                    .ThenByDescending(p => p.FechaRegistro)
                    .FirstOrDefault();

                return new EquipoMasUtilizadoDto
                {
                    EquipoId = e.Id,
                    CodigoPatrimonial = e.CodigoPatrimonial,
                    Nombre = e.Nombre,
                    Categoria = e.Categoria,
                    Marca = e.Marca,
                    EstadoActual = e.Estado,
                    TotalPrestamos = e.Prestamos.Count,
                    UltimoUsuario = ultimoPrestamo?.Usuario?.NombreCompleto,
                    UltimaArea = ultimoPrestamo?.Usuario?.Area
                };
            })
            .OrderByDescending(x => x.TotalPrestamos)
            .ThenBy(x => x.CodigoPatrimonial)
            .Take(top > 0 ? top : 10)
            .ToList();
    }

    public async Task<IReadOnlyList<PrestamosPorAreaItemDto>> ObtenerPrestamosPorAreaAsync(CancellationToken ct = default)
    {
        var prestamos = await _db.Prestamos
            .AsNoTracking()
            .Include(p => p.Usuario)
            .ToListAsync(ct);

        var usuarios = await _db.Usuarios
            .AsNoTracking()
            .Where(u => u.Estado)
            .ToListAsync(ct);

        var totalPrestamos = prestamos.Count;

        var areas = prestamos
            .Where(p => p.Usuario != null && !string.IsNullOrWhiteSpace(p.Usuario.Area))
            .GroupBy(p => p.Usuario!.Area)
            .Select(g =>
            {
                var cant = g.Count();
                return new PrestamosPorAreaItemDto
                {
                    Area = g.Key,
                    TotalPrestamos = cant,
                    PrestamosActivos = g.Count(p => p.EstadoPrestamo == EstadosPrestamo.Activo),
                    PrestamosDevueltos = g.Count(p => p.EstadoPrestamo == EstadosPrestamo.Devuelto),
                    Porcentaje = totalPrestamos > 0 ? Math.Round(cant * 100.0 / totalPrestamos, 1) : 0,
                    ColaboradoresActivos = usuarios.Count(u => string.Equals(u.Area, g.Key, StringComparison.OrdinalIgnoreCase))
                };
            })
            .OrderByDescending(x => x.TotalPrestamos)
            .ThenBy(x => x.Area)
            .ToList();

        return areas;
    }

    public async Task<IReadOnlyList<MovimientoDto>> ObtenerMovimientosAsync(
        string? tipo = null,
        string? busqueda = null,
        Guid? equipoId = null,
        DateOnly? fechaDesde = null,
        DateOnly? fechaHasta = null,
        CancellationToken ct = default)
    {
        var query = _db.MovimientosInventario
            .AsNoTracking()
            .Include(m => m.Equipo)
            .Include(m => m.Usuario)
            .Include(m => m.Responsable)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            var tipoNorm = tipo.Trim().ToLowerInvariant();
            query = query.Where(m => m.TipoMovimiento.ToLower() == tipoNorm);
        }

        if (equipoId.HasValue && equipoId.Value != Guid.Empty)
        {
            query = query.Where(m => m.EquipoId == equipoId.Value);
        }

        if (fechaDesde.HasValue)
        {
            var desdeUtc = fechaDesde.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(m => m.Fecha >= desdeUtc);
        }

        if (fechaHasta.HasValue)
        {
            var hastaUtc = fechaHasta.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(m => m.Fecha <= hastaUtc);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLowerInvariant();
            query = query.Where(m =>
                (m.Equipo != null && (m.Equipo.CodigoPatrimonial.ToLower().Contains(term) || m.Equipo.Nombre.ToLower().Contains(term))) ||
                m.Observacion.ToLower().Contains(term) ||
                m.Area.ToLower().Contains(term) ||
                m.TipoMovimiento.ToLower().Contains(term));
        }

        var movimientos = await query
            .OrderByDescending(m => m.Fecha)
            .Take(200)
            .ToListAsync(ct);

        return movimientos.Select(MapearMovimientoDto).ToList();
    }

    private static MovimientoDto MapearMovimientoDto(MovimientoInventario m) => new()
    {
        Id = m.Id,
        Fecha = m.Fecha,
        TipoMovimiento = m.TipoMovimiento,
        EquipoId = m.EquipoId,
        EquipoCodigo = m.Equipo?.CodigoPatrimonial ?? string.Empty,
        EquipoNombre = m.Equipo?.Nombre ?? string.Empty,
        EquipoCategoria = m.Equipo?.Categoria ?? string.Empty,
        EstadoAnterior = m.EstadoAnterior,
        EstadoNuevo = m.EstadoNuevo,
        UsuarioInvolucrado = m.Usuario?.NombreCompleto,
        ResponsableNombre = m.Responsable?.NombreCompleto,
        Area = m.Area,
        Observacion = m.Observacion
    };
}
