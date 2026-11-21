using TechAsset.Domain.Constants;

namespace TechAsset.Application.DTOs;

public class UsuarioDto
{
    public Guid Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Rol { get; set; } = Roles.Colaborador;
    public bool Estado { get; set; }
    public int TotalPrestamos { get; set; }
    public int PrestamosActivos { get; set; }
    public DateTime FechaRegistro { get; set; }
}

public class CrearUsuarioDto
{
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Rol { get; set; } = Roles.Colaborador;
    public string? Password { get; set; }
}

public class ActualizarUsuarioDto
{
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Rol { get; set; } = Roles.Colaborador;
    public bool? Estado { get; set; }
}

public class CambiarEstadoUsuarioDto
{
    public bool? Estado { get; set; }
    public string? Motivo { get; set; }
}

public class UsuarioMinimoDto
{
    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
}
