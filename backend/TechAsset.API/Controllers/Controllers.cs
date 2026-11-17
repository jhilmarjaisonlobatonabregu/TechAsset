using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Application.Validators;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Exceptions;

namespace TechAsset.API.Controllers;

/// <summary>Autenticación JWT.</summary>
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login"), AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request, CancellationToken ct)
        => Ok(await _auth.LoginAsync(request, ct));

    [HttpGet("me"), Authorize]
    public async Task<ActionResult<UsuarioSesionDto>> Me(CancellationToken ct)
    {
        if (ActorId is null) throw new ReglaNegocioException("AUTH-401", "Sesión no válida.", 401);
        return Ok(await _auth.ObtenerPerfilActualAsync(ActorId.Value, ct));
    }

    [HttpGet("demo-users"), AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<DemoUserDto>>> DemoUsers(CancellationToken ct)
        => Ok(await _auth.ObtenerUsuariosDemoAsync(ct));
}

/// <summary>RF-01 a RF-04: gestión de usuarios.</summary>
[Authorize]
public class UsuariosController : ApiControllerBase
{
    private readonly IUsuarioService _usuarios;
    private readonly IValidator<CrearUsuarioDto> _crearValidator;
    private readonly IValidator<ActualizarUsuarioDto> _actualizarValidator;

    public UsuariosController(IUsuarioService usuarios, IValidator<CrearUsuarioDto> crearValidator, IValidator<ActualizarUsuarioDto> actualizarValidator)
    {
        _usuarios = usuarios;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet, Authorize(Roles = $"{Roles.Administrador},{Roles.ResponsableTecnologia}")]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> Listar(
        [FromQuery] string? busqueda, [FromQuery] string? area, [FromQuery] string? rol, [FromQuery] bool? estado, CancellationToken ct)
        => Ok(await _usuarios.ListarAsync(busqueda, area, rol, estado, ct));

    /// <summary>Responsables de Tecnología activos (para el formulario de préstamo de cualquier rol).</summary>
    [HttpGet("responsables")]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> Responsables(CancellationToken ct)
        => Ok(await _usuarios.ListarAsync(null, null, Roles.ResponsableTecnologia, true, ct));

    [HttpGet("{id:guid}"), Authorize(Roles = $"{Roles.Administrador},{Roles.ResponsableTecnologia}")]
    public async Task<ActionResult<UsuarioDto>> Obtener(Guid id, CancellationToken ct)
        => Ok(await _usuarios.ObtenerPorIdAsync(id, ct));

    [HttpPost, Authorize(Roles = Roles.Administrador)]
    public async Task<ActionResult<UsuarioDto>> Crear([FromBody] CrearUsuarioDto dto, CancellationToken ct)
    {
        await ValidarAsync(_crearValidator, dto, ct);
        var creado = await _usuarios.CrearAsync(dto, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = Roles.Administrador)]
    public async Task<ActionResult<UsuarioDto>> Actualizar(Guid id, [FromBody] ActualizarUsuarioDto dto, CancellationToken ct)
    {
        await ValidarAsync(_actualizarValidator, dto, ct);
        return Ok(await _usuarios.ActualizarAsync(id, dto, ActorRol, ct));
    }

    /// <summary>RF-04 / RN-09: solo el Administrador puede deshabilitar (el servicio responde 403 para otros roles).</summary>
    [HttpPatch("{id:guid}/deshabilitar")]
    public async Task<ActionResult<UsuarioDto>> Deshabilitar(Guid id, [FromBody] CambiarEstadoUsuarioDto? dto, CancellationToken ct)
        => Ok(await _usuarios.CambiarEstadoAsync(id, dto?.Estado ?? false, ActorRol, dto?.Motivo, ct));
}

/// <summary>RF-05 a RF-08: inventario de equipos.</summary>
[Authorize]
public class EquiposController : ApiControllerBase
{
    private const string RolesGestion = $"{Roles.Administrador},{Roles.ResponsableTecnologia}";
    private readonly IEquipoService _equipos;
    private readonly IValidator<CrearEquipoDto> _crearValidator;
    private readonly IValidator<ActualizarEquipoDto> _actualizarValidator;

    public EquiposController(IEquipoService equipos, IValidator<CrearEquipoDto> crearValidator, IValidator<ActualizarEquipoDto> actualizarValidator)
    {
        _equipos = equipos;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EquipoDto>>> Listar(
        [FromQuery] string? busqueda, [FromQuery] string? estado, [FromQuery] string? categoria, [FromQuery] string? marca, CancellationToken ct)
        => Ok(await _equipos.ListarAsync(busqueda, estado, categoria, marca, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EquipoDto>> Obtener(Guid id, CancellationToken ct)
        => Ok(await _equipos.ObtenerPorIdAsync(id, ct));

    [HttpPost, Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<EquipoDto>> Crear([FromBody] CrearEquipoDto dto, CancellationToken ct)
    {
        await ValidarAsync(_crearValidator, dto, ct);
        var creado = await _equipos.CrearAsync(dto, ActorId, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<EquipoDto>> Actualizar(Guid id, [FromBody] ActualizarEquipoDto dto, CancellationToken ct)
    {
        await ValidarAsync(_actualizarValidator, dto, ct);
        return Ok(await _equipos.ActualizarAsync(id, dto, ActorId, ct));
    }

    [HttpPatch("{id:guid}/estado"), Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<EquipoDto>> CambiarEstado(Guid id, [FromBody] CambiarEstadoEquipoDto dto, CancellationToken ct)
        => Ok(await _equipos.CambiarEstadoAsync(id, dto, ActorId, ct));

    /// <summary>RN-06: no se elimina un equipo con historial; se aplica baja lógica.</summary>
    [HttpDelete("{id:guid}"), Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<EquipoDto>> Eliminar(Guid id, [FromQuery] bool aplicarBajaLogica = false, CancellationToken ct = default)
        => Ok(await _equipos.EliminarOBajaLogicaAsync(id, aplicarBajaLogica, ActorId, ct));
}

/// <summary>RF-09 a RF-12: préstamos y devoluciones.</summary>
[Authorize]
public class PrestamosController : ApiControllerBase
{
    private const string RolesGestion = $"{Roles.Administrador},{Roles.ResponsableTecnologia}";
    private readonly IPrestamoService _prestamos;
    private readonly IValidator<CrearPrestamoDto> _crearValidator;
    private readonly IValidator<RegistrarDevolucionDto> _devolucionValidator;

    public PrestamosController(IPrestamoService prestamos, IValidator<CrearPrestamoDto> crearValidator, IValidator<RegistrarDevolucionDto> devolucionValidator)
    {
        _prestamos = prestamos;
        _crearValidator = crearValidator;
        _devolucionValidator = devolucionValidator;
    }

    private bool EsColaborador => ActorRol == Roles.Colaborador;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PrestamoDto>>> Listar(
        [FromQuery] string? busqueda, [FromQuery] string? estadoPrestamo, [FromQuery] string? area,
        [FromQuery] Guid? usuarioId, [FromQuery] Guid? equipoId,
        [FromQuery] DateOnly? fechaDesde, [FromQuery] DateOnly? fechaHasta, CancellationToken ct)
    {
        // El colaborador solo consulta su propio historial
        if (EsColaborador) usuarioId = ActorId;
        return Ok(await _prestamos.ListarAsync(busqueda, estadoPrestamo, area, usuarioId, equipoId, fechaDesde, fechaHasta, ct));
    }

    [HttpGet("activos")]
    public async Task<ActionResult<IReadOnlyList<PrestamoDto>>> Activos(CancellationToken ct)
    {
        var activos = await _prestamos.ListarActivosAsync(ct);
        if (EsColaborador) activos = activos.Where(p => p.UsuarioId == ActorId).ToList();
        return Ok(activos);
    }

    [HttpPost]
    public async Task<ActionResult<PrestamoDto>> Registrar([FromBody] CrearPrestamoDto dto, CancellationToken ct)
    {
        // El colaborador solicita préstamos únicamente a su nombre
        if (EsColaborador && ActorId.HasValue) dto.UsuarioId = ActorId.Value;
        await ValidarAsync(_crearValidator, dto, ct);
        var creado = await _prestamos.RegistrarPrestamoAsync(dto, ct);
        return CreatedAtAction(nameof(Listar), new { id = creado.Id }, creado);
    }

    [HttpPost("{id:guid}/devolucion"), HttpPatch("{id:guid}/devolucion"), Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<PrestamoDto>> Devolver(Guid id, [FromBody] RegistrarDevolucionDto dto, CancellationToken ct)
    {
        await ValidarAsync(_devolucionValidator, dto, ct);
        return Ok(await _prestamos.RegistrarDevolucionAsync(id, dto, ActorId, ct));
    }
}

/// <summary>RF-13: dashboard.</summary>
[Authorize]
public class DashboardController : ApiControllerBase
{
    private readonly IReporteService _reportes;
    public DashboardController(IReporteService reportes) => _reportes = reportes;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Obtener(CancellationToken ct)
        => Ok(await _reportes.ObtenerDashboardAsync(ct));
}

/// <summary>RF-14 a RF-17: reportes.</summary>
[Authorize(Roles = $"{Roles.Administrador},{Roles.ResponsableTecnologia}")]
public class ReportesController : ApiControllerBase
{
    private readonly IReporteService _reportes;
    public ReportesController(IReporteService reportes) => _reportes = reportes;

    [HttpGet("equipos-por-estado")]
    public async Task<ActionResult<ReporteEquiposPorEstadoDto>> EquiposPorEstado([FromQuery] string? estado, CancellationToken ct)
        => Ok(await _reportes.ObtenerEquiposPorEstadoAsync(estado, ct));

    [HttpGet("equipos-mas-utilizados")]
    public async Task<ActionResult<IReadOnlyList<EquipoMasUtilizadoDto>>> MasUtilizados([FromQuery] int top = 10, CancellationToken ct = default)
        => Ok(await _reportes.ObtenerEquiposMasUtilizadosAsync(top, ct));

    [HttpGet("prestamos-por-area")]
    public async Task<ActionResult<IReadOnlyList<PrestamosPorAreaItemDto>>> PorArea(CancellationToken ct)
        => Ok(await _reportes.ObtenerPrestamosPorAreaAsync(ct));

    [HttpGet("movimientos")]
    public async Task<ActionResult<IReadOnlyList<MovimientoDto>>> Movimientos(
        [FromQuery] string? tipo, [FromQuery] string? busqueda, [FromQuery] Guid? equipoId,
        [FromQuery] DateOnly? fechaDesde, [FromQuery] DateOnly? fechaHasta, CancellationToken ct)
        => Ok(await _reportes.ObtenerMovimientosAsync(tipo, busqueda, equipoId, fechaDesde, fechaHasta, ct));
}
