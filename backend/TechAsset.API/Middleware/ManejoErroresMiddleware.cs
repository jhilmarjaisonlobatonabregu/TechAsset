using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TechAsset.Application.Common;
using TechAsset.Domain.Exceptions;

namespace TechAsset.API.Middleware;

/// <summary>
/// Middleware global: traduce excepciones de reglas de negocio, validación y persistencia
/// a respuestas HTTP uniformes (400/403/404/409/422/500) con mensajes entendibles.
/// </summary>
public class ManejoErroresMiddleware
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private readonly RequestDelegate _next;
    private readonly ILogger<ManejoErroresMiddleware> _logger;

    public ManejoErroresMiddleware(RequestDelegate next, ILogger<ManejoErroresMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ReglaNegocioException ex)
        {
            await Escribir(context, ex.StatusCode, ErrorRespuestaDto.Crear(ex.Codigo, ex.Message, ex.Errores));
        }
        catch (ValidationException ex)
        {
            var errores = ex.Errors.Select(e => e.ErrorMessage).Distinct().ToList();
            await Escribir(context, 400, ErrorRespuestaDto.Crear("VALIDACION", errores.FirstOrDefault() ?? "Datos inválidos.", errores));
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Violación de integridad en base de datos");
            await Escribir(context, 409, ErrorRespuestaDto.Crear("INTEGRIDAD",
                "La operación viola una restricción de integridad (valor duplicado o registro relacionado)."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado");
            await Escribir(context, 500, ErrorRespuestaDto.Crear("ERROR-INTERNO",
                "Ocurrió un error interno en el servidor. Intente nuevamente."));
        }
    }

    private static async Task Escribir(HttpContext context, int status, ErrorRespuestaDto error)
    {
        if (context.Response.HasStarted) return;
        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOpts));
    }
}
