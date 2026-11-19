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
    private const string MensajePrestamoNoExiste = "El préstamo indicado no existe.";

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
            responsable = await ObtenerResponsableDelPrestamoAsync(dto.ResponsableId, ct);
        }

        var usuario = await ObtenerUsuarioReceptorAsync(dto.UsuarioId, ct);
        var equipo = await ObtenerEquipoPrestableAsync(dto.EquipoId, ct);

        return esSolicitudColaborador
            ? await CrearSolicitudPendienteAsync(dto, usuario, equipo, ct)
            : await CrearPrestamoActivoAsync(dto, usuario, equipo, responsable!, ct);
    }

    public async Task<PrestamoDto> AprobarPrestamoAsync(
        Guid prestamoId,
        Guid responsableId,
        string? rolActor = null,
        CancellationToken ct = default)
    {
        ValidarRolAprobador(rolActor);
        var responsable = await ObtenerResponsableAprobadorAsync(responsableId, ct);
        var prestamo = await ObtenerSolicitudPendienteAsync(prestamoId, ct);
        var equipo = await ObtenerEquipoParaAprobacionAsync(prestamo, ct);

        var estadoAnteriorEquipo = equipo.Estado;
        equipo.MarcarComoPrestado();
        prestamo.Aprobar(responsable.Id);
        prestamo.Responsable = responsable;

        var nombreUsuario = prestamo.Usuario?.NombreCompleto ?? Roles.Colaborador;
        var areaUsuario = prestamo.Usuario?.Area ?? Areas.InfraestructuraSoporte;

        _db.MovimientosInventario.Add(NuevoMovimientoPrestamo(
            equipo,
            estadoAnteriorEquipo,
            prestamo.UsuarioId,
            responsable.Id,
            areaUsuario,
            $"Préstamo aprobado y asignado a {nombreUsuario} ({areaUsuario}). {prestamo.Observacion}"));

        await _db.SaveChangesAsync(ct);
        return MapearDto(prestamo);
    }

    private async Task<Usuario> ObtenerResponsableDelPrestamoAsync(Guid? responsableId, CancellationToken ct)
    {
        Prestamo.ValidarResponsableId(responsableId);
        return await BuscarResponsableActivoAsync(responsableId!.Value, ct);
    }

    private async Task<Usuario> BuscarResponsableActivoAsync(Guid responsableId, CancellationToken ct)
    {
        var responsable = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == responsableId, ct);
        if (responsable is null || !responsable.Estado)
        {
            throw new ReglaNegocioException("RN-05", MensajesRegla.Rn05ResponsableValidoYActivo, 400);
        }

        return responsable;
    }

    private async Task<Usuario> ObtenerUsuarioReceptorAsync(Guid usuarioId, CancellationToken ct)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, ct);
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

        return usuario;
    }

    private async Task<Equipo> ObtenerEquipoPrestableAsync(Guid equipoId, CancellationToken ct)
    {
        var equipo = await _db.Equipos.FirstOrDefaultAsync(e => e.Id == equipoId, ct);
        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico seleccionado no existe.", 404);
        }

        // RN-02, RN-03, RN-01 sobre el estado del equipo
        equipo.ValidarDisponibleParaPrestamo();
        await ValidarSinPrestamoActivoAsync(equipo.Id, Guid.Empty, ct);
        return equipo;
    }

    // Verificación adicional RN-01 en la tabla de préstamos activos
    private async Task ValidarSinPrestamoActivoAsync(Guid equipoId, Guid prestamoExcluidoId, CancellationToken ct)
    {
        var tienePrestamoActivo = await _db.Prestamos.AnyAsync(
            p => p.EquipoId == equipoId && p.EstadoPrestamo == EstadosPrestamo.Activo && p.Id != prestamoExcluidoId,
            ct);

        if (tienePrestamoActivo)
        {
            throw new ReglaNegocioException("RN-01", MensajesRegla.Rn01EquipoConPrestamoActivo, 409);
        }
    }

    private async Task<PrestamoDto> CrearSolicitudPendienteAsync(
        CrearPrestamoDto dto, Usuario usuario, Equipo equipo, CancellationToken ct)
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

    private async Task<PrestamoDto> CrearPrestamoActivoAsync(
        CrearPrestamoDto dto, Usuario usuario, Equipo equipo, Usuario responsable, CancellationToken ct)
    {
        var prestamo = Prestamo.Crear(
            dto.EquipoId,
            dto.UsuarioId,
            responsable.Id,
            dto.FechaPrestamo,
            dto.FechaDevolucion,
            dto.Observacion);

        var estadoAnteriorEquipo = equipo.Estado;
        equipo.MarcarComoPrestado();

        _db.Prestamos.Add(prestamo);

        _db.MovimientosInventario.Add(NuevoMovimientoPrestamo(
            equipo,
            estadoAnteriorEquipo,
            usuario.Id,
            responsable.Id,
            usuario.Area,
            $"Préstamo asignado a {usuario.NombreCompleto} ({usuario.Area}). {prestamo.Observacion}"));

        await _db.SaveChangesAsync(ct);

        prestamo.Usuario = usuario;
        prestamo.Equipo = equipo;
        prestamo.Responsable = responsable;

        return MapearDto(prestamo);
    }

    private static MovimientoInventario NuevoMovimientoPrestamo(
        Equipo equipo, string estadoAnterior, Guid usuarioId, Guid responsableId, string area, string observacion) => new()
    {
        Id = Guid.NewGuid(),
        Fecha = DateTime.UtcNow,
        TipoMovimiento = TiposMovimiento.Prestamo,
        EquipoId = equipo.Id,
        EstadoAnterior = estadoAnterior,
        EstadoNuevo = EstadosEquipo.Prestado,
        UsuarioId = usuarioId,
        ResponsableId = responsableId,
        Area = area,
        Observacion = observacion
    };

    private static void ValidarRolAprobador(string? rolActor)
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
    }

    private async Task<Usuario> ObtenerResponsableAprobadorAsync(Guid responsableId, CancellationToken ct)
    {
        Prestamo.ValidarResponsableId(responsableId);

        var responsable = await BuscarResponsableActivoAsync(responsableId, ct);
        if (string.Equals(responsable.Rol, Roles.Colaborador, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "AUTH-403",
                "Un colaborador no tiene permisos para aprobar solicitudes de préstamo.",
                403);
        }

        return responsable;
    }

    private async Task<Prestamo> ObtenerSolicitudPendienteAsync(Guid prestamoId, CancellationToken ct)
    {
        var prestamo = await _db.Prestamos
            .Include(p => p.Equipo)
            .Include(p => p.Usuario)
            .Include(p => p.Responsable)
            .FirstOrDefaultAsync(p => p.Id == prestamoId, ct);

        if (prestamo is null)
        {
            throw new ReglaNegocioException("PRE-404", MensajePrestamoNoExiste, 404);
        }

        prestamo.ValidarPendienteParaAprobacion();

        return prestamo;
    }

    private async Task<Equipo> ObtenerEquipoParaAprobacionAsync(Prestamo prestamo, CancellationToken ct)
    {
        var equipo = prestamo.Equipo ?? await _db.Equipos.FirstOrDefaultAsync(e => e.Id == prestamo.EquipoId, ct);
        if (equipo is null)
        {
            throw new ReglaNegocioException("EQP-404", "El equipo tecnológico asociado no existe.", 404);
        }

        // Revalidar RN-01, RN-02 y RN-03 antes de aprobar
        equipo.ValidarDisponibleParaPrestamo();
        await ValidarSinPrestamoActivoAsync(equipo.Id, prestamo.Id, ct);
        return equipo;
    }

    public async Task<PrestamoDto> RegistrarDevolucionAsync(
        Guid prestamoId,
        RegistrarDevolucionDto dto,
        Guid? responsableId = null,
        CancellationToken ct = default)
    {
        var prestamo = await _db.Prestamos
            .Include(p => p.Equipo)
            .Include(p => p.Usuario)
            .Include(p => p.Responsable)
            .FirstOrDefaultAsync(p => p.Id == prestamoId, ct);

        if (prestamo is null)
        {
            throw new ReglaNegocioException("PRE-404", MensajePrestamoNoExiste, 404);
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
                Area = prestamo.Usuario?.Area ?? Areas.InfraestructuraSoporte,
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