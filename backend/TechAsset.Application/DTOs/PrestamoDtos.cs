namespace TechAsset.Application.DTOs;

public class PrestamoDto
{
    public Guid Id { get; set; }
    public DateOnly FechaPrestamo { get; set; }
    public DateOnly FechaDevolucion { get; set; }
    public DateOnly? FechaDevolucionReal { get; set; }
    public string Observacion { get; set; } = string.Empty;
    public string? ObservacionDevolucion { get; set; }
    public string EstadoPrestamo { get; set; } = string.Empty;

    public Guid UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public string UsuarioCorreo { get; set; } = string.Empty;
    public string UsuarioArea { get; set; } = string.Empty;

    public Guid EquipoId { get; set; }
    public string EquipoCodigo { get; set; } = string.Empty;
    public string EquipoNombre { get; set; } = string.Empty;
    public string EquipoCategoria { get; set; } = string.Empty;
    public string EquipoMarca { get; set; } = string.Empty;

    public Guid? ResponsableId { get; set; }
    public string ResponsableNombre { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
}

public class CrearPrestamoDto
{
    public Guid EquipoId { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid? ResponsableId { get; set; }
    public DateOnly FechaPrestamo { get; set; }
    public DateOnly FechaDevolucion { get; set; }
    public string? Observacion { get; set; }
}

public class RegistrarDevolucionDto
{
    public string? Observacion { get; set; }
    public DateOnly? FechaDevolucionReal { get; set; }
    public string? EstadoEquipoDestino { get; set; }
}
