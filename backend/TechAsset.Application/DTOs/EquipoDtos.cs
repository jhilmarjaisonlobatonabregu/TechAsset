using TechAsset.Domain.Constants;

namespace TechAsset.Application.DTOs;

public class EquipoDto
{
    public Guid Id { get; set; }
    public string CodigoPatrimonial { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Estado { get; set; } = EstadosEquipo.Disponible;
    public int TotalPrestamos { get; set; }
    public string? UsuarioActual { get; set; }
    public string? AreaActual { get; set; }
    public DateTime FechaRegistro { get; set; }
}

public class CrearEquipoDto
{
    public string CodigoPatrimonial { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = CategoriasEquipo.Laptops;
    public string Marca { get; set; } = string.Empty;
    public string? Estado { get; set; }
}

public class ActualizarEquipoDto
{
    public string CodigoPatrimonial { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = CategoriasEquipo.Laptops;
    public string Marca { get; set; } = string.Empty;
    public string Estado { get; set; } = EstadosEquipo.Disponible;
}

public class CambiarEstadoEquipoDto
{
    public string Estado { get; set; } = string.Empty;
    public string? Observacion { get; set; }
}
