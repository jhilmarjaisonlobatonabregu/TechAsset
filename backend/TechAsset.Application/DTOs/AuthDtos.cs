namespace TechAsset.Application.DTOs;

public class LoginRequestDto
{
    public string Correo { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UsuarioSesionDto
{
    public Guid Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Estado { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UsuarioSesionDto Usuario { get; set; } = new();
}

public class DemoUserDto
{
    public Guid Id { get; set; }
    public string Correo { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string PasswordDemo { get; set; } = string.Empty;
}
