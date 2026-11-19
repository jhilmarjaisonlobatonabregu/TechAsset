using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;

namespace TechAsset.API.Controllers;

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
