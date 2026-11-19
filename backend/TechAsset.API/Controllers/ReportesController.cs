using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;

namespace TechAsset.API.Controllers;

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
