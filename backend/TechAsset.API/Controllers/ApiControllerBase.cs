using System.Security.Claims;
using System.Text.RegularExpressions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Domain.Exceptions;

namespace TechAsset.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    protected Guid? ActorId =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    protected string? ActorRol => User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("rol");

    /// <summary>Ejecuta un validador FluentValidation y lanza ReglaNegocioException 400 conservando el código RN-xx.</summary>
    protected static async Task ValidarAsync<T>(IValidator<T> validador, T modelo, CancellationToken ct)
    {
        var resultado = await validador.ValidateAsync(modelo, ct);
        if (resultado.IsValid) return;

        var errores = resultado.Errors.Select(e => e.ErrorMessage).Distinct().ToList();
        var primero = errores[0];
        var match = Regex.Match(primero, @"^(RN-\d{2})");
        throw new ReglaNegocioException(match.Success ? match.Groups[1].Value : "VALIDACION", primero, 400, errores);
    }
}
