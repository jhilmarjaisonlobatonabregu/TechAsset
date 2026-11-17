using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Entities;
using TechAsset.Domain.Exceptions;
using TechAsset.Infrastructure.Persistence;
using TechAsset.Infrastructure.Security;

namespace TechAsset.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly TechAssetDbContext _db;
    private readonly JwtTokenGenerator _jwtGenerator;

    public AuthService(TechAssetDbContext db, JwtTokenGenerator jwtGenerator)
    {
        _db = db;
        _jwtGenerator = jwtGenerator;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ReglaNegocioException("AUTH-01", "Debe ingresar su correo electrónico y contraseña.", 400);
        }

        var correoNorm = request.Correo.Trim().ToLowerInvariant();
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Correo.ToLower() == correoNorm, ct);

        if (usuario is null || !PasswordHasher.VerifyPassword(request.Password, usuario.PasswordHash))
        {
            throw new ReglaNegocioException("AUTH-01", "Correo electrónico o contraseña incorrectos.", 401);
        }

        if (!usuario.Estado)
        {
            throw new ReglaNegocioException("AUTH-02", "El usuario se encuentra deshabilitado en el sistema.", 403);
        }

        var token = _jwtGenerator.GenerarToken(usuario);

        return new LoginResponseDto
        {
            Token = token,
            Usuario = MapearSesion(usuario)
        };
    }

    public async Task<UsuarioSesionDto> ObtenerPerfilActualAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var usuario = await _db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == usuarioId, ct);
        if (usuario is null)
        {
            throw new ReglaNegocioException("AUTH-404", "El usuario de la sesión no fue encontrado.", 404);
        }

        return MapearSesion(usuario);
    }

    public async Task<IReadOnlyList<DemoUserDto>> ObtenerUsuariosDemoAsync(CancellationToken ct = default)
    {
        var usuarios = await _db.Usuarios
            .AsNoTracking()
            .Where(u => u.Estado)
            .OrderBy(u => u.Rol == Roles.Administrador ? 1 : u.Rol == Roles.ResponsableTecnologia ? 2 : 3)
            .ThenBy(u => u.Nombres)
            .ToListAsync(ct);

        return usuarios.Select(u => new DemoUserDto
        {
            Id = u.Id,
            Correo = u.Correo,
            NombreCompleto = u.NombreCompleto,
            Rol = u.Rol,
            Area = u.Area,
            PasswordDemo = u.Rol == Roles.Administrador
                ? "Admin2026!"
                : u.Rol == Roles.ResponsableTecnologia
                    ? "Soporte2026!"
                    : "Colab2026!"
        }).ToList();
    }

    private static UsuarioSesionDto MapearSesion(Usuario u) => new()
    {
        Id = u.Id,
        Nombres = u.Nombres,
        Apellidos = u.Apellidos,
        NombreCompleto = u.NombreCompleto,
        Correo = u.Correo,
        Area = u.Area,
        Rol = u.Rol,
        Estado = u.Estado
    };
}
