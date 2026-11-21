using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;

namespace TechAsset.API.Controllers;

/// <summary>RF-13: dashboard.</summary>
[Authorize(Roles = Roles.Administrador)]
public class DashboardController : ApiControllerBase
{
    private readonly IReporteService _reportes;
    public DashboardController(IReporteService reportes) => _reportes = reportes;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Obtener(CancellationToken ct)
        => Ok(await _reportes.ObtenerDashboardAsync(ct));
}
