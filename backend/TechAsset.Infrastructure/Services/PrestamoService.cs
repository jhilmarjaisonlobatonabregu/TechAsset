using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Entities;
using TechAsset.Domain.Exceptions;
using TechAsset.Infrastructure.Persistence;

namespace TechAsset.Infrastructure.Services;

public class PrestamoService : IPrestamoService
{
    private readonly TechAssetDbContext _db;

    public PrestamoService(TechAssetDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PrestamoDto>> ListarAsync(
        string? busqueda = null,
        string? estadoPrestamo = null,
        string? area = null,
        Guid? usuarioId = null,
        Guid? equipoId = null,
        DateOnly? fechaDesde = null,
        DateOnly? fechaHasta = null,
        CancellationToken ct = default)
    {
        var query = _db.Prestamos
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Include(p => p.Equipo)
            .Include(p => p.Responsable)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLowerInvariant();
            query = query.Where(p =>
                (p.Equipo != null && (p.Equipo.CodigoPatrimonial.ToLower().Contains(term) || p.Equipo.Nombre.ToLower().Contains(term))) ||
                (p.Usuario != null && ((p.Usuario.Nombres + " " + p.Usuario.Apellidos).ToLower().Contains(term) || p.Usuario.Area.ToLower().Contains(term))) ||
                p.Observacion.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(estadoPrestamo))
        {
            var estNorm = estadoPrestamo.Trim().ToLowerInvariant();
            query = query.Where(p => p.EstadoPrestamo.ToLower() == estNorm);
        }

        if (!string.IsNullOrWhiteSpace(area))
        {
            var areaNorm = area.Trim().ToLowerInvariant();
            query = query.Where(p => p.Usuario != null && p.Usuario.Area.ToLower() == areaNorm);
        }

        if (usuarioId.HasValue && usuarioId.Value != Guid.Empty)
        {
            query = query.Where(p => p.UsuarioId == usuarioId.Value);
        }

        if (equipoId.HasValue && equipoId.Value != Guid.Empty)
        {
            query = query.Where(p => p.EquipoId == equipoId.Value);
        }

        if (fechaDesde.HasValue)
        {
            query = query.Where(p => p.FechaPrestamo >= fechaDesde.Value);
        }

        if (fechaHasta.HasValue)
        {
            query = query.Where(p => p.FechaPrestamo <= fechaHasta.Value);
        }

        var prestamos = await query
            .OrderByDescending(p => p.FechaPrestamo)
            .ThenByDescending(p => p.FechaRegistro)
            .ToListAsync(ct);

        return prestamos.Select(MapearDto).ToList();
    }

    public async Task<IReadOnlyList<PrestamoDto>> ListarActivosAsync(CancellationToken ct = default)
    {
        return await ListarAsync(estadoPrestamo: EstadosPrestamo.Activo, ct: ct);
    }

    public async Task<PrestamoDto> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var prestamo = await _db.Prestamos
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Include(p => p.Equipo)
            .Include(p => p.Responsable)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (prestamo is null)
        {
            throw new ReglaNegocioException("PRE-404", "El registro de préstamo solicitado no existe.", 404);
        }

        return MapearDto(prestamo);
    }

    public async Task<PrestamoDto> RegistrarPrestamoAsync(
        CrearPrestamoDto dto,
        string? rolActor = null,
        CancellationToken ct = default)
    {
        var esSolicitudColaborador = string.Equals(rolActor, Roles.Colaborador, StringComparison.OrdinalIgnoreCase);

        Usuario? responsable = null;
        if (!esSolicitudColaborador)
        {
            // RN-05: Todo préstamo debe tener un usuario responsable registrado
            if (!dto.ResponsableId.HasValue || dto.ResponsableId.Value == Guid.Empty)
            {
                throw new ReglaNegocioException(
                    "RN-05",
                    "RN-05: Todo préstamo debe tener un usuario responsable registrado.",
                    400);
            }

            responsable = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.ResponsableId.Value, ct);
            if (responsable is null || !responsable.Estado)
            {
                throw new ReglaNegocioException(
                    "RN-05",
                    "RN-05: Todo préstamo debe tener un usuario responsable válido y activo registrado.",
                    400);
            }
        }

        // RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo
        if (dto.FechaDevolucion <= dto.FechaPrestamo)
        {
            throw new ReglaNegocioException(
                "RN-04",
                "RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo.",
                400);
        }

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.UsuarioId, ct);
        if (usuario is null)
        {
            throw new ReglaNegocioException("USR-404", "El colaborador receptor seleccionado no existe.", 404);
        }

        if (!usuario.Estado)
        {
            throw new ReglaNegocioException(
                "USR-INACTIVO",
                "El colaborador seleccionado se encuentra deshabilitado y no puede recibir equipos en préstamo.",
                422);
        }

        var equipo = await _db.Equipos.FirstOrDefaultAsync(e => e.Id == dto.EquipoId, ct);
        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico seleccionado no existe.", 404);
        }

        // RN-02, RN-03, RN-01 sobre el estado del equipo
        equipo.ValidarDisponibleParaPrestamo();

        // Verificación adicional RN-01 en tabla de préstamos activos
        var tienePrestamoActivo = await _db.Prestamos.AnyAsync(
            p => p.EquipoId == dto.EquipoId && p.EstadoPrestamo == EstadosPrestamo.Activo,
            ct);

        if (tienePrestamoActivo)
        {
            throw new ReglaNegocioException(
                "RN-01",
                "RN-01: Un equipo solo puede estar asociado a un préstamo activo.",
                409);
        }

        if (esSolicitudColaborador)
        {
            var solicitud = Prestamo.CrearSolicitud(
                dto.EquipoId,
                dto.UsuarioId,
                dto.FechaPrestamo,
                dto.FechaDevolucion,
                dto.Observacion);

            _db.Prestamos.Add(solicitud);
            await _db.SaveChangesAsync(ct);

            solicitud.Usuario = usuario;
            solicitud.Equipo = equipo;

            return MapearDto(solicitud);
        }

        var estadoAnteriorEquipo = equipo.Estado;
        equipo.MarcarComoPrestado();

        var prestamo = Prestamo.Crear(
            dto.EquipoId,
            dto.UsuarioId,
            responsable!.Id,
            dto.FechaPrestamo,
            dto.FechaDevolucion,
            dto.Observacion);

        _db.Prestamos.Add(prestamo);

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = TiposMovimiento.Prestamo,
            EquipoId = equipo.Id,
            EstadoAnterior = estadoAnteriorEquipo,
            EstadoNuevo = EstadosEquipo.Prestado,
            UsuarioId = usuario.Id,
            ResponsableId = responsable.Id,
            Area = usuario.Area,
            Observacion = $"Préstamo asignado a {usuario.NombreCompleto} ({usuario.Area}). {prestamo.Observacion}"
        });

        await _db.SaveChangesAsync(ct);

        prestamo.Usuario = usuario;
        prestamo.Equipo = equipo;
        prestamo.Responsable = responsable;

        return MapearDto(prestamo);
    }

    public async Task<PrestamoDto> AprobarPrestamoAsync(
        Guid prestamoId,
        Guid responsableId,
        string? rolActor = null,
        CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(rolActor) &&
            !string.Equals(rolActor, Roles.Administrador, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(rolActor, Roles.ResponsableTecnologia, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "AUTH-403",
                "Solo el Administrador o el Responsable de Tecnología pueden aprobar préstamos.",
                403);
        }

        if (responsableId == Guid.Empty)
        {
            throw new ReglaNegocioException(
                "RN-05",
                "RN-05: Todo préstamo debe tener un usuario responsable registrado.",
                400);
        }

        var responsable = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == responsableId, ct);
        if (responsable is null || !responsable.Estado)
        {
            throw new ReglaNegocioException(
                "RN-05",
                "RN-05: Todo préstamo debe tener un usuario responsable válido y activo registrado.",
                400);
        }

        if (string.Equals(responsable.Rol, Roles.Colaborador, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "AUTH-403",
                "Un colaborador no tiene permisos para aprobar solicitudes de préstamo.",
                403);
        }

        var prestamo = await _db.Prestamos
            .Include(p => p.Equipo)
            .Include(p => p.Usuario)
            .Include(p => p.Responsable)
            .FirstOrDefaultAsync(p => p.Id == prestamoId, ct);

        if (prestamo is null)
        {
            throw new ReglaNegocioException("PRE-404", "El préstamo indicado no existe.", 404);
        }

        if (!string.Equals(prestamo.EstadoPrestamo, EstadosPrestamo.Pendiente, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "VAL-APROBACION",
                "Solo se puede aprobar un préstamo que se encuentre en estado 'Pendiente'.",
                409);
        }

        var equipo = prestamo.Equipo ?? await _db.Equipos.FirstOrDefaultAsync(e => e.Id == prestamo.EquipoId, ct);
        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico asociado no existe.", 404);
        }

        // Revalidar RN-01, RN-02 y RN-03 antes de aprobar
        equipo.ValidarDisponibleParaPrestamo();

        var tienePrestamoActivo = await _db.Prestamos.AnyAsync(
            p => p.EquipoId == equipo.Id && p.EstadoPrestamo == EstadosPrestamo.Activo && p.Id != prestamo.Id,
            ct);

        if (tienePrestamoActivo)
        {
            throw new ReglaNegocioException(
                "RN-01",
                "RN-01: Un equipo solo puede estar asociado a un préstamo activo.",
                409);
        }

        var estadoAnteriorEquipo = equipo.Estado;
        equipo.MarcarComoPrestado();
        prestamo.Aprobar(responsable.Id);
        prestamo.Responsable = responsable;

        var nombreUsuario = prestamo.Usuario?.NombreCompleto ?? "Colaborador";
        var areaUsuario = prestamo.Usuario?.Area ?? "Infraestructura y Soporte";

        _db.MovimientosInventario.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = DateTime.UtcNow,
            TipoMovimiento = TiposMovimiento.Prestamo,
            EquipoId = equipo.Id,
            EstadoAnterior = estadoAnteriorEquipo,
            EstadoNuevo = EstadosEquipo.Prestado,
            UsuarioId = prestamo.UsuarioId,
            ResponsableId = responsable.Id,
            Area = areaUsuario,
            Observacion = $"Préstamo aprobado y asignado a {nombreUsuario} ({areaUsuario}). {prestamo.Observacion}"
        });

        await _db.SaveChangesAsync(ct);
        return MapearDto(prestamo);
    }

    public async Task<PrestamoDto> RegistrarDevolucionAsync(
        Guid prestamoId,
        RegistrarDevolucionDto dto,
        Guid? responsableId = null,
        CancellationToken ct = default)
    {
        // RN-10: Toda devolución deberá registrar observaciones
        if (string.IsNullOrWhiteSpace(dto.Observacion))
        {
            throw new ReglaNegocioException(
                "RN-10",
                "RN-10: Toda devolución deberá registrar observaciones.",
                400);
        }

        var prestamo = await _db.Prestamos
            .Include(p => p.Equipo)
            .Include(p => p.Usuario)
            .Include(p => p.Responsable)
            .FirstOrDefaultAsync(p => p.Id == prestamoId, ct);

        if (prestamo is null)
        {
            throw new ReglaNegocioException("PRE-404", "El préstamo indicado no existe.", 404);
        }

        prestamo.RegistrarDevolucion(dto.Observacion, dto.FechaDevolucionReal);

        if (prestamo.Equipo is not null)
        {
            var estadoAnterior = prestamo.Equipo.Estado;
            prestamo.Equipo.MarcarComoDevuelto(dto.EstadoEquipoDestino);

            _db.MovimientosInventario.Add(new MovimientoInventario
            {
                Id = Guid.NewGuid(),
                Fecha = DateTime.UtcNow,
                TipoMovimiento = TiposMovimiento.Devolucion,
                EquipoId = prestamo.Equipo.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = prestamo.Equipo.Estado,
                UsuarioId = prestamo.UsuarioId,
                ResponsableId = responsableId ?? prestamo.ResponsableId,
                Area = prestamo.Usuario?.Area ?? "Infraestructura y Soporte",
                Observacion = $"Devolución registrada: {prestamo.ObservacionDevolucion}"
            });
        }

        await _db.SaveChangesAsync(ct);
        return MapearDto(prestamo);
    }

    private static PrestamoDto MapearDto(Prestamo p) => new()
    {
        Id = p.Id,
        FechaPrestamo = p.FechaPrestamo,
        FechaDevolucion = p.FechaDevolucion,
        FechaDevolucionReal = p.FechaDevolucionReal,
        Observacion = p.Observacion,
        ObservacionDevolucion = p.ObservacionDevolucion,
        EstadoPrestamo = p.EstadoPrestamo,
        UsuarioId = p.UsuarioId,
        UsuarioNombre = p.Usuario?.NombreCompleto ?? string.Empty,
        UsuarioCorreo = p.Usuario?.Correo ?? string.Empty,
        UsuarioArea = p.Usuario?.Area ?? string.Empty,
        EquipoId = p.EquipoId,
        EquipoCodigo = p.Equipo?.CodigoPatrimonial ?? string.Empty,
        EquipoNombre = p.Equipo?.Nombre ?? string.Empty,
        EquipoCategoria = p.Equipo?.Categoria ?? string.Empty,
        EquipoMarca = p.Equipo?.Marca ?? string.Empty,
        ResponsableId = p.ResponsableId,
        ResponsableNombre = p.Responsable?.NombreCompleto ?? string.Empty,
        FechaRegistro = p.FechaRegistro
    };
}
