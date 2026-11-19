using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;

namespace TechAsset.API.Controllers;

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
