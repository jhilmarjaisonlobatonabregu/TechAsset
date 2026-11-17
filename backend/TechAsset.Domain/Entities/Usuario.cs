using TechAsset.Domain.Constants;
using TechAsset.Domain.Exceptions;

namespace TechAsset.Domain.Entities;

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public bool Estado { get; set; } = true;
    public string Rol { get; set; } = Roles.Colaborador;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public ICollection<Prestamo> PrestamosRecibidos { get; set; } = new List<Prestamo>();
    public ICollection<Prestamo> PrestamosGestionados { get; set; } = new List<Prestamo>();

    public string NombreCompleto => $"{Nombres} {Apellidos}".Trim();

    public void Actualizar(string nombres, string apellidos, string correo, string area, string rol)
    {
        Nombres = nombres.Trim();
        Apellidos = apellidos.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        Area = area.Trim();
        Rol = string.IsNullOrWhiteSpace(rol) ? Rol : rol.Trim();
    }

    public void CambiarEstado(bool nuevoEstado, string? rolActor)
    {
        if (!nuevoEstado && !string.Equals(rolActor?.Trim(), Roles.Administrador, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "RN-09",
                "RN-09: Solo el Administrador podrá deshabilitar usuarios.",
                403);
        }

        Estado = nuevoEstado;
    }
}
