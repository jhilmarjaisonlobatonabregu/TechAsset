using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TechAsset.API.Middleware;
using TechAsset.Application.Interfaces;
using TechAsset.Application.Validators;
using TechAsset.Infrastructure.Persistence;
using TechAsset.Infrastructure.Security;
using TechAsset.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;
var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=techasset_db;Username=postgres;Password=admin123";

builder.Services.AddDbContext<TechAssetDbContext>(options => options.UseNpgsql(connectionString));

// Inyección de dependencias (capas Application / Infrastructure)
builder.Services.AddSingleton<JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IEquipoService, EquipoService>();
builder.Services.AddScoped<IPrestamoService, PrestamoService>();
builder.Services.AddScoped<IReporteService, ReporteService>();
builder.Services.AddValidatorsFromAssemblyContaining<CrearUsuarioValidator>();

// JWT
var jwtKey = configuration["Jwt:Key"] ?? "InnovatechSolutionsTechAssetSuperSecretKey2026!@#";
var jwtIssuer = configuration["Jwt:Issuer"] ?? "TechAsset.API";
var jwtAudience = configuration["Jwt:Audience"] ?? "TechAsset.Client";

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
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });
builder.Services.AddAuthorization();

// CORS
var origenesPermitidos = configuration.GetSection("Cors:Origenes").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(origenesPermitidos)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TechAsset API",
        Version = "v1",
        Description = "Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos — Innovatech Solutions S.A.C."
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese el token JWT obtenido en POST /api/auth/login"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
    var xml = Path.Combine(AppContext.BaseDirectory, "TechAsset.API.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

var app = builder.Build();

app.UseMiddleware<ManejoErroresMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TechAsset API v1"));
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TechAssetDbContext>();
    await DatabaseSeeder.SeedAsync(db);
}

app.Run();

public partial class Program { }
