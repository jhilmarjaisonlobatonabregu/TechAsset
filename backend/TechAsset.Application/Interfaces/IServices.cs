using TechAsset.Application.DTOs;

namespace TechAsset.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<UsuarioSesionDto> ObtenerPerfilActualAsync(Guid usuarioId, CancellationToken ct = default);
    Task<IReadOnlyList<DemoUserDto>> ObtenerUsuariosDemoAsync(CancellationToken ct = default);
}

public interface IUsuarioService
{
    Task<IReadOnlyList<UsuarioDto>> ListarAsync(
        string? busqueda = null,
        string? area = null,
        string? rol = null,
        bool? estado = null,
        CancellationToken ct = default);

    Task<UsuarioDto> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<UsuarioDto> CrearAsync(CrearUsuarioDto dto, CancellationToken ct = default);
    Task<UsuarioDto> ActualizarAsync(Guid id, ActualizarUsuarioDto dto, string? rolActor = null, CancellationToken ct = default);
    Task<UsuarioDto> CambiarEstadoAsync(Guid id, bool nuevoEstado, string? rolActor, string? motivo = null, CancellationToken ct = default);
}

public interface IEquipoService
{
    Task<IReadOnlyList<EquipoDto>> ListarAsync(
        string? busqueda = null,
        string? estado = null,
        string? categoria = null,
        string? marca = null,
        CancellationToken ct = default);

    Task<EquipoDto> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<EquipoDto> CrearAsync(CrearEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default);
    Task<EquipoDto> ActualizarAsync(Guid id, ActualizarEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default);
    Task<EquipoDto> CambiarEstadoAsync(Guid id, CambiarEstadoEquipoDto dto, Guid? responsableId = null, CancellationToken ct = default);
    Task<EquipoDto> EliminarOBajaLogicaAsync(Guid id, bool aplicarBajaLogica = false, Guid? responsableId = null, CancellationToken ct = default);
}

public interface IPrestamoService
{
    Task<IReadOnlyList<PrestamoDto>> ListarAsync(
        string? busqueda = null,
        string? estadoPrestamo = null,
        string? area = null,
        Guid? usuarioId = null,
        Guid? equipoId = null,
        DateOnly? fechaDesde = null,
        DateOnly? fechaHasta = null,
        CancellationToken ct = default);

    Task<IReadOnlyList<PrestamoDto>> ListarActivosAsync(CancellationToken ct = default);
    Task<PrestamoDto> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<PrestamoDto> RegistrarPrestamoAsync(CrearPrestamoDto dto, string? rolActor = null, CancellationToken ct = default);
    Task<PrestamoDto> AprobarPrestamoAsync(Guid prestamoId, Guid responsableId, string? rolActor = null, CancellationToken ct = default);
    Task<PrestamoDto> RegistrarDevolucionAsync(Guid prestamoId, RegistrarDevolucionDto dto, Guid? responsableId = null, CancellationToken ct = default);
}

public interface IReporteService
{
    Task<DashboardDto> ObtenerDashboardAsync(CancellationToken ct = default);
    Task<ReporteEquiposPorEstadoDto> ObtenerEquiposPorEstadoAsync(string? estado = null, CancellationToken ct = default);
    Task<IReadOnlyList<EquipoMasUtilizadoDto>> ObtenerEquiposMasUtilizadosAsync(int top = 10, CancellationToken ct = default);
    Task<IReadOnlyList<PrestamosPorAreaItemDto>> ObtenerPrestamosPorAreaAsync(CancellationToken ct = default);
    Task<IReadOnlyList<MovimientoDto>> ObtenerMovimientosAsync(
        string? tipo = null,
        string? busqueda = null,
        Guid? equipoId = null,
        DateOnly? fechaDesde = null,
        DateOnly? fechaHasta = null,
        CancellationToken ct = default);
}
