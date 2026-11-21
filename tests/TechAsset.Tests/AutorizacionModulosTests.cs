using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TechAsset.API.Controllers;
using TechAsset.API.Middleware;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Application.Validators;
using TechAsset.Domain.Constants;
using TechAsset.Infrastructure.Persistence;
using TechAsset.Infrastructure.Security;
using TechAsset.Infrastructure.Services;

namespace TechAsset.Tests;

/// <summary>
/// Fixture HTTP real sobre WebApplication + JWT + [Authorize(Roles = ...)] con base InMemory aislada.
/// </summary>
public sealed class ApiAutorizacionFixture : IAsyncLifetime
{
    private const string JwtKey = "InnovatechSolutionsTechAssetSuperSecretKey2026!@#";
    private const string JwtIssuer = "TechAsset.API";
    private const string JwtAudience = "TechAsset.Client";

    private WebApplication _app = null!;
    public Uri BaseAddress { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        var dbName = $"techasset-rbac-{Guid.NewGuid()}";
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            ApplicationName = typeof(DashboardController).Assembly.GetName().Name
        });

        builder.WebHost.UseUrls("http://127.0.0.1:0");

        builder.Services.AddDbContext<TechAssetDbContext>(options => options.UseInMemoryDatabase(dbName));
        builder.Services.AddSingleton<JwtTokenGenerator>();
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<IUsuarioService, UsuarioService>();
        builder.Services.AddScoped<IEquipoService, EquipoService>();
        builder.Services.AddScoped<IPrestamoService, PrestamoService>();
        builder.Services.AddScoped<IReporteService, ReporteService>();
        builder.Services.AddValidatorsFromAssemblyContaining<CrearUsuarioValidator>();

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = JwtIssuer,
                    ValidAudience = JwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey)),
                    RoleClaimType = ClaimTypes.Role
                };
            });
        builder.Services.AddAuthorization();

        builder.Services.AddControllers()
            .AddApplicationPart(typeof(DashboardController).Assembly)
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            });

        _app = builder.Build();
        _app.UseMiddleware<ManejoErroresMiddleware>();
        _app.UseAuthentication();
        _app.UseAuthorization();
        _app.MapControllers();

        using (var scope = _app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TechAssetDbContext>();
            await DatabaseSeeder.SeedAsync(db);
        }

        await _app.StartAsync();

        var addresses = _app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>();
        var url = addresses?.Addresses.FirstOrDefault()
            ?? throw new InvalidOperationException("No se pudo obtener la dirección del servidor de pruebas.");
        BaseAddress = new Uri(url);
    }

    public async Task DisposeAsync()
    {
        if (_app is not null)
        {
            await _app.StopAsync();
            await _app.DisposeAsync();
        }
    }

    public async Task<HttpClient> CrearClienteAutenticadoAsync(string correo, string password)
    {
        var client = new HttpClient { BaseAddress = BaseAddress };
        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Correo = correo,
            Password = password
        });
        loginResp.EnsureSuccessStatusCode();
        var auth = await loginResp.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }
}

public class AutorizacionModulosTests : IClassFixture<ApiAutorizacionFixture>
{
    private static readonly Guid ColaboradorActivoId = Guid.Parse("11111111-1111-1111-1111-111111111004");
    private static readonly Guid UsuarioInactivoId = Guid.Parse("11111111-1111-1111-1111-111111111009");
    private static readonly Guid PrestamoActivoId = Guid.Parse("33333333-3333-3333-3333-333333333013");
    private static readonly Guid SolicitudPendienteId = Guid.Parse("33333333-3333-3333-3333-333333333019");

    private readonly ApiAutorizacionFixture _fixture;

    public AutorizacionModulosTests(ApiAutorizacionFixture fixture)
    {
        _fixture = fixture;
    }

    [Theory(DisplayName = "RBAC: Responsable de Tecnología recibe 403 en Dashboard, Reportes y Usuarios completo")]
    [InlineData("/api/dashboard")]
    [InlineData("/api/reportes/equipos-por-estado")]
    [InlineData("/api/reportes/equipos-mas-utilizados")]
    [InlineData("/api/reportes/prestamos-por-area")]
    [InlineData("/api/reportes/movimientos")]
    [InlineData("/api/usuarios")]
    [InlineData("/api/usuarios/11111111-1111-1111-1111-111111111004")]
    public async Task Responsable_Recibe403_EnModulosDeAdministrador(string ruta)
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("lquispe@innovatech.pe", "Soporte2026!");
        var respuesta = await client.GetAsync(ruta);
        Assert.Equal(HttpStatusCode.Forbidden, respuesta.StatusCode);
    }

    [Theory(DisplayName = "RBAC: Colaborador recibe 403 en Dashboard, Reportes, Usuarios completo y colaboradores")]
    [InlineData("/api/dashboard")]
    [InlineData("/api/reportes/equipos-por-estado")]
    [InlineData("/api/reportes/equipos-mas-utilizados")]
    [InlineData("/api/reportes/prestamos-por-area")]
    [InlineData("/api/reportes/movimientos")]
    [InlineData("/api/usuarios")]
    [InlineData("/api/usuarios/11111111-1111-1111-1111-111111111004")]
    [InlineData("/api/usuarios/colaboradores")]
    public async Task Colaborador_Recibe403_EnModulosRestringidos(string ruta)
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("atorres@innovatech.pe", CredencialesPorDefecto.ContrasenaColaborador);
        var respuesta = await client.GetAsync(ruta);
        Assert.Equal(HttpStatusCode.Forbidden, respuesta.StatusCode);
    }

    [Theory(DisplayName = "RBAC: Administrador recibe 200 en Dashboard, Reportes, Usuarios y colaboradores")]
    [InlineData("/api/dashboard")]
    [InlineData("/api/reportes/equipos-por-estado")]
    [InlineData("/api/reportes/equipos-mas-utilizados")]
    [InlineData("/api/reportes/prestamos-por-area")]
    [InlineData("/api/reportes/movimientos")]
    [InlineData("/api/usuarios")]
    [InlineData("/api/usuarios/11111111-1111-1111-1111-111111111004")]
    [InlineData("/api/usuarios/colaboradores")]
    public async Task Administrador_Recibe200_EnTodosLosModulos(string ruta)
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("cmendoza@innovatech.pe", "Admin2026!");
        var respuesta = await client.GetAsync(ruta);
        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
    }

    [Fact(DisplayName = "RBAC: Responsable puede cargar la consulta mínima de colaboradores habilitados para el formulario de préstamo")]
    public async Task Responsable_PuedeCargarListaMinimaColaboradores()
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("lquispe@innovatech.pe", "Soporte2026!");
        var respuesta = await client.GetAsync("/api/usuarios/colaboradores");
        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);

        var json = await respuesta.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() > 0);

        var ids = new List<Guid>();
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            var propiedades = item.EnumerateObject().Select(p => p.Name).OrderBy(n => n).ToArray();
            Assert.Equal(new[] { "area", "id", "nombreCompleto" }, propiedades);
            ids.Add(item.GetProperty("id").GetGuid());
        }

        Assert.Contains(ColaboradorActivoId, ids);
        Assert.DoesNotContain(UsuarioInactivoId, ids);
    }

    [Fact(DisplayName = "RBAC: Responsable mantiene acceso 200 a GET /api/usuarios/responsables")]
    public async Task Responsable_MantieneAccesoAResponsables()
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("lquispe@innovatech.pe", "Soporte2026!");
        var respuesta = await client.GetAsync("/api/usuarios/responsables");
        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
    }

    [Fact(DisplayName = "RBAC: Colaborador sigue recibiendo 403 al intentar aprobar una solicitud")]
    public async Task Colaborador_Recibe403_AlAprobarPrestamo()
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("atorres@innovatech.pe", CredencialesPorDefecto.ContrasenaColaborador);
        var respuesta = await client.PatchAsync($"/api/prestamos/{SolicitudPendienteId}/aprobar", null);
        Assert.Equal(HttpStatusCode.Forbidden, respuesta.StatusCode);
    }

    [Fact(DisplayName = "RBAC: Colaborador sigue recibiendo 403 al intentar registrar devolución")]
    public async Task Colaborador_Recibe403_AlDevolverPrestamo()
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync("atorres@innovatech.pe", CredencialesPorDefecto.ContrasenaColaborador);
        var respuesta = await client.PostAsJsonAsync($"/api/prestamos/{PrestamoActivoId}/devolucion", new RegistrarDevolucionDto
        {
            Observacion = "Intento no autorizado",
            EstadoEquipoDestino = EstadosEquipo.Disponible
        });
        Assert.Equal(HttpStatusCode.Forbidden, respuesta.StatusCode);
    }

    [Theory(DisplayName = "RBAC: Responsable y Colaborador mantienen acceso 200 a Equipos y Préstamos")]
    [InlineData("lquispe@innovatech.pe", "Soporte2026!")]
    [InlineData("atorres@innovatech.pe", "Colab2026!")]
    public async Task ResponsableYColaborador_AccedenAEquiposYPrestamos(string correo, string password)
    {
        using var client = await _fixture.CrearClienteAutenticadoAsync(correo, password);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/equipos")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/prestamos")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/prestamos/activos")).StatusCode);
    }
}
