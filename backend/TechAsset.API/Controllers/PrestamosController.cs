using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Exceptions;

namespace TechAsset.API.Controllers;

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
        // El colaborador solicita préstamos únicamente a su nombre (queda en estado Pendiente)
        if (EsColaborador && ActorId.HasValue)
        {
            dto.UsuarioId = ActorId.Value;
            dto.ResponsableId = null;
        }
        await ValidarAsync(_crearValidator, dto, ct);
        var creado = await _prestamos.RegistrarPrestamoAsync(dto, ActorRol, ct);
        return CreatedAtAction(nameof(Listar), new { id = creado.Id }, creado);
    }

    /// <summary>Aprobar solicitud de préstamo pendiente (solo Administrador y Responsable de Tecnología).</summary>
    [HttpPatch("{id:guid}/aprobar"), Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<PrestamoDto>> Aprobar(Guid id, CancellationToken ct)
    {
        if (ActorId is null) throw new ReglaNegocioException("AUTH-401", "Sesión no válida.", 401);
        return Ok(await _prestamos.AprobarPrestamoAsync(id, ActorId.Value, ActorRol, ct));
    }

    [HttpPost("{id:guid}/devolucion"), HttpPatch("{id:guid}/devolucion"), Authorize(Roles = RolesGestion)]
    public async Task<ActionResult<PrestamoDto>> Devolver(Guid id, [FromBody] RegistrarDevolucionDto dto, CancellationToken ct)
    {
        await ValidarAsync(_devolucionValidator, dto, ct);
        return Ok(await _prestamos.RegistrarDevolucionAsync(id, dto, ActorId, ct));
    }
}
