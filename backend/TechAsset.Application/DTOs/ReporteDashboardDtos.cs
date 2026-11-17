namespace TechAsset.Application.DTOs;

public class EquiposPorEstadoItemDto
{
    public string Estado { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public double Porcentaje { get; set; }
}

public class PrestamosPorAreaItemDto
{
    public string Area { get; set; } = string.Empty;
    public int TotalPrestamos { get; set; }
    public int PrestamosActivos { get; set; }
    public int PrestamosDevueltos { get; set; }
    public double Porcentaje { get; set; }
    public int ColaboradoresActivos { get; set; }
}

public class EquipoMasUtilizadoDto
{
    public Guid EquipoId { get; set; }
    public string CodigoPatrimonial { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string EstadoActual { get; set; } = string.Empty;
    public int TotalPrestamos { get; set; }
    public string? UltimoUsuario { get; set; }
    public string? UltimaArea { get; set; }
}

public class MovimientoDto
{
    public Guid Id { get; set; }
    public DateTime Fecha { get; set; }
    public string TipoMovimiento { get; set; } = string.Empty;
    public Guid EquipoId { get; set; }
    public string EquipoCodigo { get; set; } = string.Empty;
    public string EquipoNombre { get; set; } = string.Empty;
    public string EquipoCategoria { get; set; } = string.Empty;
    public string EstadoAnterior { get; set; } = string.Empty;
    public string EstadoNuevo { get; set; } = string.Empty;
    public string? UsuarioInvolucrado { get; set; }
    public string? ResponsableNombre { get; set; }
    public string Area { get; set; } = string.Empty;
    public string Observacion { get; set; } = string.Empty;
}

public class DashboardDto
{
    public int TotalEquipos { get; set; }
    public int EquiposDisponibles { get; set; }
    public int EquiposPrestados { get; set; }
    public int EquiposEnMantenimiento { get; set; }
    public int EquiposDeBaja { get; set; }

    public int TotalPrestamos { get; set; }
    public int PrestamosActivos { get; set; }
    public int PrestamosDevueltos { get; set; }

    public string AreaConMayorUso { get; set; } = string.Empty;
    public int PrestamosAreaMayorUso { get; set; }

    public IReadOnlyList<EquiposPorEstadoItemDto> EquiposPorEstado { get; set; } = Array.Empty<EquiposPorEstadoItemDto>();
    public IReadOnlyList<PrestamosPorAreaItemDto> PrestamosPorArea { get; set; } = Array.Empty<PrestamosPorAreaItemDto>();
    public IReadOnlyList<EquipoMasUtilizadoDto> EquiposMasUtilizados { get; set; } = Array.Empty<EquipoMasUtilizadoDto>();
    public IReadOnlyList<MovimientoDto> UltimosMovimientos { get; set; } = Array.Empty<MovimientoDto>();
}

public class ReporteEquiposPorEstadoDto
{
    public IReadOnlyList<EquiposPorEstadoItemDto> Resumen { get; set; } = Array.Empty<EquiposPorEstadoItemDto>();
    public IReadOnlyList<EquipoDto> Equipos { get; set; } = Array.Empty<EquipoDto>();
}
