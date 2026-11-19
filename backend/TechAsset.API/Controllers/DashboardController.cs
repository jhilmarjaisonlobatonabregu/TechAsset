using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;

namespace TechAsset.API.Controllers;

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
