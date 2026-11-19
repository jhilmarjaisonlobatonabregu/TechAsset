using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
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
}
