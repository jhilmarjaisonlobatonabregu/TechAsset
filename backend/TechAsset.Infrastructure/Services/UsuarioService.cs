using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Entities;
using TechAsset.Domain.Exceptions;
using TechAsset.Infrastructure.Persistence;
using TechAsset.Infrastructure.Security;

namespace TechAsset.Infrastructure.Services;

public class UsuarioService : IUsuarioService
{
    private const string MensajeUsuarioNoExiste = "El usuario solicitado no existe.";

    private readonly TechAssetDbContext _db;

    public UsuarioService(TechAssetDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<UsuarioDto>> ListarAsync(
        string? busqueda = null,
        string? area = null,
        string? rol = null,
        bool? estado = null,
        CancellationToken ct = default)
    {
        var query = _db.Usuarios
            .AsNoTracking()
            .Include(u => u.PrestamosRecibidos)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLowerInvariant();
            query = query.Where(u =>
                u.Nombres.ToLower().Contains(term) ||
                u.Apellidos.ToLower().Contains(term) ||
                (u.Nombres + " " + u.Apellidos).ToLower().Contains(term) ||
                u.Correo.ToLower().Contains(term) ||
                u.Area.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(area))
        {
            var areaNorm = area.Trim().ToLowerInvariant();
            query = query.Where(u => u.Area.ToLower() == areaNorm);
        }

        if (!string.IsNullOrWhiteSpace(rol))
        {
            var rolNorm = rol.Trim().ToLowerInvariant();
            query = query.Where(u => u.Rol.ToLower() == rolNorm);
        }

        if (estado.HasValue)
        {
            query = query.Where(u => u.Estado == estado.Value);
        }

        var usuarios = await query
            .OrderByDescending(u => u.Estado)
            .ThenBy(u => u.Apellidos)
            .ThenBy(u => u.Nombres)
            .ToListAsync(ct);

        return usuarios.Select(MapearDto).ToList();
    }

    public async Task<UsuarioDto> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var usuario = await _db.Usuarios
            .AsNoTracking()
            .Include(u => u.PrestamosRecibidos)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (usuario is null)
        {
            throw new ReglaNegocioException("USR-404", MensajeUsuarioNoExiste, 404);
        }

        return MapearDto(usuario);
    }

    public async Task<UsuarioDto> CrearAsync(CrearUsuarioDto dto, CancellationToken ct = default)
    {
        var correoNorm = dto.Correo.Trim().ToLowerInvariant();
        var existeCorreo = await _db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correoNorm, ct);
        if (existeCorreo)
        {
            throw new ReglaNegocioException(
                "RN-08",
                "RN-08: El correo electrónico del usuario debe ser único. Ya existe un usuario registrado con ese correo.",
                409);
        }

        var passwordPlano = string.IsNullOrWhiteSpace(dto.Password) ? CredencialesPorDefecto.ContrasenaColaborador : dto.Password.Trim();

        var nuevoUsuario = new Usuario
        {
            Id = Guid.NewGuid(),
            Nombres = dto.Nombres.Trim(),
            Apellidos = dto.Apellidos.Trim(),
            Correo = correoNorm,
            Area = dto.Area.Trim(),
            Rol = string.IsNullOrWhiteSpace(dto.Rol) ? Roles.Colaborador : dto.Rol.Trim(),
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword(passwordPlano),
            FechaRegistro = DateTime.UtcNow
        };

        _db.Usuarios.Add(nuevoUsuario);
        await _db.SaveChangesAsync(ct);

        return MapearDto(nuevoUsuario);
    }

    public async Task<UsuarioDto> ActualizarAsync(Guid id, ActualizarUsuarioDto dto, string? rolActor = null, CancellationToken ct = default)
    {
        var usuario = await _db.Usuarios
            .Include(u => u.PrestamosRecibidos)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (usuario is null)
        {
            throw new ReglaNegocioException("USR-404", "El usuario que intenta actualizar no existe.", 404);
        }

        var correoNorm = dto.Correo.Trim().ToLowerInvariant();
        var existeCorreo = await _db.Usuarios.AnyAsync(u => u.Id != id && u.Correo.ToLower() == correoNorm, ct);
        if (existeCorreo)
        {
            throw new ReglaNegocioException(
                "RN-08",
                "RN-08: El correo electrónico del usuario debe ser único. Otro colaborador ya utiliza este correo.",
                409);
        }

        if (dto.Estado.HasValue && dto.Estado.Value != usuario.Estado)
        {
            usuario.CambiarEstado(dto.Estado.Value, rolActor);
        }

        usuario.Actualizar(dto.Nombres, dto.Apellidos, correoNorm, dto.Area, dto.Rol);
        await _db.SaveChangesAsync(ct);

        return MapearDto(usuario);
    }

    public async Task<UsuarioDto> CambiarEstadoAsync(Guid id, bool nuevoEstado, string? rolActor, string? motivo = null, CancellationToken ct = default)
    {
        var usuario = await _db.Usuarios
            .Include(u => u.PrestamosRecibidos)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (usuario is null)
        {
            throw new ReglaNegocioException("USR-404", MensajeUsuarioNoExiste, 404);
        }

        // RN-09: Solo el Administrador podrá deshabilitar usuarios
        usuario.CambiarEstado(nuevoEstado, rolActor);

        await _db.SaveChangesAsync(ct);
        return MapearDto(usuario);
    }

    private static UsuarioDto MapearDto(Usuario u) => new()
    {
        Id = u.Id,
        Nombres = u.Nombres,
        Apellidos = u.Apellidos,
        NombreCompleto = u.NombreCompleto,
        Correo = u.Correo,
        Area = u.Area,
        Rol = u.Rol,
        Estado = u.Estado,
        TotalPrestamos = u.PrestamosRecibidos?.Count(p => p.EstadoPrestamo != EstadosPrestamo.Pendiente) ?? 0,
        PrestamosActivos = u.PrestamosRecibidos?.Count(p => p.EstadoPrestamo == EstadosPrestamo.Activo) ?? 0,
        FechaRegistro = u.FechaRegistro
    };
}
