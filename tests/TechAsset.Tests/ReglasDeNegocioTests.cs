using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TechAsset.Application.DTOs;
using TechAsset.Application.Validators;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Exceptions;
using TechAsset.Infrastructure.Persistence;
using TechAsset.Infrastructure.Security;
using TechAsset.Infrastructure.Services;

namespace TechAsset.Tests;

/// <summary>Fixture: base InMemory aislada por prueba, poblada con el seed oficial.</summary>
public abstract class PruebaBase : IAsyncLifetime
{
    protected TechAssetDbContext Db = null!;
    protected static readonly Guid AdminId = Guid.Parse("11111111-1111-1111-1111-111111111001");

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<TechAssetDbContext>()
            .UseInMemoryDatabase($"techasset-{Guid.NewGuid()}")
            .Options;
        Db = new TechAssetDbContext(options);
        await DatabaseSeeder.SeedAsync(Db);
    }

    public Task DisposeAsync()
    {
        Db.Dispose();
        return Task.CompletedTask;
    }

    protected Task<Guid> ObtenerEquipoIdAsync(string estado) =>
        Db.Equipos.Where(e => e.Estado == estado).Select(e => e.Id).FirstAsync();

    protected Task<Guid> ObtenerColaboradorIdAsync() =>
        Db.Usuarios.Where(u => u.Rol == Roles.Colaborador && u.Estado).Select(u => u.Id).FirstAsync();

    protected Task<Guid> ObtenerResponsableIdAsync() =>
        Db.Usuarios.Where(u => u.Rol == Roles.ResponsableTecnologia && u.Estado).Select(u => u.Id).FirstAsync();

    protected async Task<CrearPrestamoDto> NuevoPrestamoAsync(Guid equipoId) => new()
    {
        EquipoId = equipoId,
        UsuarioId = await ObtenerColaboradorIdAsync(),
        ResponsableId = await ObtenerResponsableIdAsync(),
        FechaPrestamo = DateOnly.FromDateTime(DateTime.Today),
        FechaDevolucion = DateOnly.FromDateTime(DateTime.Today.AddDays(5)),
        Observacion = "Prueba automatizada"
    };

    protected static async Task<ReglaNegocioException> EsperarReglaAsync(Func<Task> accion)
        => await Assert.ThrowsAsync<ReglaNegocioException>(accion);
}

public class ReglasPrestamoTests : PruebaBase
{
    [Fact(DisplayName = "RN-01: un equipo con préstamo activo no puede prestarse de nuevo (409)")]
    public async Task RN01_EquipoPrestadoNoSePuedePrestar()
    {
        var servicio = new PrestamoService(Db);
        var equipoId = await ObtenerEquipoIdAsync(EstadosEquipo.Prestado);
        var ex = await EsperarReglaAsync(async () => await servicio.RegistrarPrestamoAsync(await NuevoPrestamoAsync(equipoId)));
        Assert.Equal("RN-01", ex.Codigo);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact(DisplayName = "RN-01: tras prestar un equipo disponible no puede prestarse otra vez")]
    public async Task RN01_SegundoPrestamoDelMismoEquipoSeRechaza()
    {
        var servicio = new PrestamoService(Db);
        var equipoId = await ObtenerEquipoIdAsync(EstadosEquipo.Disponible);
        await servicio.RegistrarPrestamoAsync(await NuevoPrestamoAsync(equipoId));
        var ex = await EsperarReglaAsync(async () => await servicio.RegistrarPrestamoAsync(await NuevoPrestamoAsync(equipoId)));
        Assert.Equal("RN-01", ex.Codigo);
    }

    [Fact(DisplayName = "RN-02: no se presta un equipo en Mantenimiento (422)")]
    public async Task RN02_MantenimientoNoSePresta()
    {
        var servicio = new PrestamoService(Db);
        var equipoId = await ObtenerEquipoIdAsync(EstadosEquipo.Mantenimiento);
        var ex = await EsperarReglaAsync(async () => await servicio.RegistrarPrestamoAsync(await NuevoPrestamoAsync(equipoId)));
        Assert.Equal("RN-02", ex.Codigo);
        Assert.Equal(422, ex.StatusCode);
    }

    [Fact(DisplayName = "RN-03: no se presta un equipo en Baja (422)")]
    public async Task RN03_BajaNoSePresta()
    {
        var servicio = new PrestamoService(Db);
        var equipoId = await ObtenerEquipoIdAsync(EstadosEquipo.Baja);
        var ex = await EsperarReglaAsync(async () => await servicio.RegistrarPrestamoAsync(await NuevoPrestamoAsync(equipoId)));
        Assert.Equal("RN-03", ex.Codigo);
        Assert.Equal(422, ex.StatusCode);
    }

    [Fact(DisplayName = "RN-04: FechaDevolucion debe ser posterior a FechaPrestamo (400)")]
    public async Task RN04_FechaDevolucionPosterior()
    {
        var servicio = new PrestamoService(Db);
        var dto = await NuevoPrestamoAsync(await ObtenerEquipoIdAsync(EstadosEquipo.Disponible));
        dto.FechaDevolucion = dto.FechaPrestamo;
        var ex = await EsperarReglaAsync(() => servicio.RegistrarPrestamoAsync(dto));
        Assert.Equal("RN-04", ex.Codigo);
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact(DisplayName = "RN-05: todo préstamo exige responsable (400)")]
    public async Task RN05_ResponsableObligatorio()
    {
        var servicio = new PrestamoService(Db);
        var dto = await NuevoPrestamoAsync(await ObtenerEquipoIdAsync(EstadosEquipo.Disponible));
        dto.ResponsableId = Guid.Empty;
        var ex = await EsperarReglaAsync(() => servicio.RegistrarPrestamoAsync(dto));
        Assert.Equal("RN-05", ex.Codigo);
    }

    [Fact(DisplayName = "RN-05: el préstamo registrado conserva su responsable")]
    public async Task RN05_PrestamoGuardaResponsable()
    {
        var servicio = new PrestamoService(Db);
        var dto = await NuevoPrestamoAsync(await ObtenerEquipoIdAsync(EstadosEquipo.Disponible));
        var creado = await servicio.RegistrarPrestamoAsync(dto);
        Assert.Equal(dto.ResponsableId, creado.ResponsableId);
        Assert.Equal("Activo", creado.EstadoPrestamo);
    }

    [Fact(DisplayName = "RF-09: prestar cambia el equipo a Prestado y registra un movimiento")]
    public async Task RF09_PrestamoActualizaEstadoYMovimiento()
    {
        var servicio = new PrestamoService(Db);
        var equipoId = await ObtenerEquipoIdAsync(EstadosEquipo.Disponible);
        var movimientosAntes = await Db.MovimientosInventario.CountAsync();
        await servicio.RegistrarPrestamoAsync(await NuevoPrestamoAsync(equipoId));
        Assert.Equal(EstadosEquipo.Prestado, (await Db.Equipos.FindAsync(equipoId))!.Estado);
        Assert.Equal(movimientosAntes + 1, await Db.MovimientosInventario.CountAsync());
    }

    [Fact(DisplayName = "RN-10: toda devolución exige observaciones (400)")]
    public async Task RN10_DevolucionSinObservacionSeRechaza()
    {
        var servicio = new PrestamoService(Db);
        var prestamo = await Db.Prestamos.FirstAsync(p => p.EstadoPrestamo == EstadosPrestamo.Activo);
        var ex = await EsperarReglaAsync(() => servicio.RegistrarDevolucionAsync(prestamo.Id, new RegistrarDevolucionDto { Observacion = "   " }));
        Assert.Equal("RN-10", ex.Codigo);
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact(DisplayName = "RF-10: la devolución libera el equipo (Disponible) y cierra el préstamo")]
    public async Task RF10_DevolucionLiberaEquipo()
    {
        var servicio = new PrestamoService(Db);
        var prestamo = await Db.Prestamos.FirstAsync(p => p.EstadoPrestamo == EstadosPrestamo.Activo);
        var resultado = await servicio.RegistrarDevolucionAsync(prestamo.Id, new RegistrarDevolucionDto { Observacion = "Entregado en buen estado" });
        Assert.Equal("Devuelto", resultado.EstadoPrestamo);
        Assert.Equal(EstadosEquipo.Disponible, (await Db.Equipos.FindAsync(prestamo.EquipoId))!.Estado);
    }

    [Fact(DisplayName = "RF-10: devolver con fallas deja el equipo en Mantenimiento")]
    public async Task RF10_DevolucionAMantenimiento()
    {
        var servicio = new PrestamoService(Db);
        var prestamo = await Db.Prestamos.FirstAsync(p => p.EstadoPrestamo == EstadosPrestamo.Activo);
        await servicio.RegistrarDevolucionAsync(prestamo.Id, new RegistrarDevolucionDto { Observacion = "Pantalla dañada", EstadoEquipoDestino = EstadosEquipo.Mantenimiento });
        Assert.Equal(EstadosEquipo.Mantenimiento, (await Db.Equipos.FindAsync(prestamo.EquipoId))!.Estado);
    }

    [Fact(DisplayName = "RF-12: los préstamos activos coinciden con equipos Prestado")]
    public async Task RF12_ActivosCoincidenConEquiposPrestados()
    {
        var servicio = new PrestamoService(Db);
        var activos = await servicio.ListarActivosAsync();
        Assert.All(activos, p => Assert.Equal("Activo", p.EstadoPrestamo));
        Assert.Equal(await Db.Equipos.CountAsync(e => e.Estado == EstadosEquipo.Prestado), activos.Count);
    }

    [Fact(DisplayName = "RF-11: el historial se filtra por área y fecha")]
    public async Task RF11_HistorialFiltrable()
    {
        var servicio = new PrestamoService(Db);
        var todos = await servicio.ListarAsync();
        var porArea = await servicio.ListarAsync(area: "Desarrollo de Software");
        Assert.True(todos.Count >= 15);
        Assert.NotEmpty(porArea);
        Assert.All(porArea, p => Assert.Equal("Desarrollo de Software", p.UsuarioArea));
    }
}

public class ReglasEquipoUsuarioTests : PruebaBase
{
    [Fact(DisplayName = "RN-06: un equipo con historial no se elimina; se exige baja lógica (409)")]
    public async Task RN06_NoEliminarEquipoConHistorial()
    {
        var servicio = new EquipoService(Db);
        var equipoId = await Db.Equipos.Where(e => e.Estado != EstadosEquipo.Prestado && e.Prestamos.Any()).Select(e => e.Id).FirstAsync();
        var ex = await EsperarReglaAsync(() => servicio.EliminarOBajaLogicaAsync(equipoId, aplicarBajaLogica: false));
        Assert.Equal("RN-06", ex.Codigo);
        Assert.Equal(409, ex.StatusCode);
        Assert.NotNull(await Db.Equipos.FindAsync(equipoId));
    }

    [Fact(DisplayName = "RN-06: la baja lógica conserva el equipo y su historial")]
    public async Task RN06_BajaLogicaConservaHistorial()
    {
        var servicio = new EquipoService(Db);
        var equipoId = await Db.Equipos.Where(e => e.Estado != EstadosEquipo.Prestado && e.Prestamos.Any()).Select(e => e.Id).FirstAsync();
        var resultado = await servicio.EliminarOBajaLogicaAsync(equipoId, aplicarBajaLogica: true);
        Assert.Equal(EstadosEquipo.Baja, resultado.Estado);
        Assert.True(await Db.Prestamos.AnyAsync(p => p.EquipoId == equipoId));
    }

    [Fact(DisplayName = "RN-07: el código patrimonial es único (409)")]
    public async Task RN07_CodigoPatrimonialUnico()
    {
        var servicio = new EquipoService(Db);
        var existente = await Db.Equipos.FirstAsync();
        var ex = await EsperarReglaAsync(() => servicio.CrearAsync(new CrearEquipoDto
        {
            CodigoPatrimonial = existente.CodigoPatrimonial,
            Nombre = "Duplicado",
            Categoria = CategoriasEquipo.Laptops,
            Marca = "Dell"
        }));
        Assert.Equal("RN-07", ex.Codigo);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact(DisplayName = "RF-05: registrar equipo lo deja Disponible y genera movimiento de alta")]
    public async Task RF05_RegistrarEquipo()
    {
        var servicio = new EquipoService(Db);
        var creado = await servicio.CrearAsync(new CrearEquipoDto { CodigoPatrimonial = "INV-TEST-9001", Nombre = "Monitor de prueba", Categoria = CategoriasEquipo.Monitores, Marca = "LG" });
        Assert.Equal(EstadosEquipo.Disponible, creado.Estado);
        Assert.True(await Db.MovimientosInventario.AnyAsync(m => m.EquipoId == creado.Id && m.TipoMovimiento == TiposMovimiento.AltaEquipo));
    }

    [Fact(DisplayName = "RF-08: cambiar el estado a Mantenimiento registra el movimiento")]
    public async Task RF08_CambiarEstado()
    {
        var servicio = new EquipoService(Db);
        var equipoId = await ObtenerEquipoIdAsync(EstadosEquipo.Disponible);
        var resultado = await servicio.CambiarEstadoAsync(equipoId, new CambiarEstadoEquipoDto { Estado = EstadosEquipo.Mantenimiento, Observacion = "Revisión preventiva" });
        Assert.Equal(EstadosEquipo.Mantenimiento, resultado.Estado);
        Assert.True(await Db.MovimientosInventario.AnyAsync(m => m.EquipoId == equipoId && m.TipoMovimiento == TiposMovimiento.CambioEstado));
    }

    [Fact(DisplayName = "RF-07/RF-14: el inventario se filtra por estado")]
    public async Task RF07_InventarioFiltradoPorEstado()
    {
        var servicio = new EquipoService(Db);
        var disponibles = await servicio.ListarAsync(estado: EstadosEquipo.Disponible);
        Assert.NotEmpty(disponibles);
        Assert.All(disponibles, e => Assert.Equal(EstadosEquipo.Disponible, e.Estado));
    }

    [Fact(DisplayName = "RN-08: el correo de usuario es único (409)")]
    public async Task RN08_CorreoUnico()
    {
        var servicio = new UsuarioService(Db);
        var ex = await EsperarReglaAsync(() => servicio.CrearAsync(new CrearUsuarioDto
        {
            Nombres = "Otro", Apellidos = "Usuario", Correo = "ATORRES@innovatech.pe", Area = "Desarrollo de Software", Rol = Roles.Colaborador
        }));
        Assert.Equal("RN-08", ex.Codigo);
        Assert.Equal(409, ex.StatusCode);
    }

    [Fact(DisplayName = "RF-01: registrar usuario válido lo deja activo")]
    public async Task RF01_RegistrarUsuario()
    {
        var servicio = new UsuarioService(Db);
        var creado = await servicio.CrearAsync(new CrearUsuarioDto
        {
            Nombres = "Nueva", Apellidos = "Colaboradora", Correo = "ncolaboradora@innovatech.pe", Area = "Ciencia de Datos e IA", Rol = Roles.Colaborador
        });
        Assert.True(creado.Estado);
        Assert.Equal("ncolaboradora@innovatech.pe", creado.Correo);
    }

    [Fact(DisplayName = "RN-09: solo el Administrador deshabilita usuarios (403)")]
    public async Task RN09_SoloAdminDeshabilita()
    {
        var servicio = new UsuarioService(Db);
        var colaboradorId = await ObtenerColaboradorIdAsync();
        var ex = await EsperarReglaAsync(() => servicio.CambiarEstadoAsync(colaboradorId, false, Roles.ResponsableTecnologia));
        Assert.Equal("RN-09", ex.Codigo);
        Assert.Equal(403, ex.StatusCode);
    }

    [Fact(DisplayName = "RF-04: el Administrador sí puede deshabilitar y rehabilitar")]
    public async Task RF04_AdminDeshabilita()
    {
        var servicio = new UsuarioService(Db);
        var colaboradorId = await ObtenerColaboradorIdAsync();
        var deshabilitado = await servicio.CambiarEstadoAsync(colaboradorId, false, Roles.Administrador);
        Assert.False(deshabilitado.Estado);
        var rehabilitado = await servicio.CambiarEstadoAsync(colaboradorId, true, Roles.Administrador);
        Assert.True(rehabilitado.Estado);
    }
}

public class ReportesYAutenticacionTests : PruebaBase
{
    [Fact(DisplayName = "RF-13: el dashboard es coherente con el inventario")]
    public async Task RF13_DashboardCoherente()
    {
        var d = await new ReporteService(Db).ObtenerDashboardAsync();
        Assert.Equal(await Db.Equipos.CountAsync(), d.TotalEquipos);
        Assert.Equal(d.TotalEquipos, d.EquiposDisponibles + d.EquiposPrestados + d.EquiposEnMantenimiento + d.EquiposDeBaja);
        Assert.Equal(await Db.Prestamos.CountAsync(), d.TotalPrestamos);
        Assert.True(d.TotalEquipos >= 20);
        Assert.True(d.TotalPrestamos >= 15);
    }

    [Fact(DisplayName = "RF-15: equipos más utilizados ordenados de mayor a menor")]
    public async Task RF15_TopOrdenado()
    {
        var top = await new ReporteService(Db).ObtenerEquiposMasUtilizadosAsync(5);
        Assert.NotEmpty(top);
        Assert.Equal(top.OrderByDescending(t => t.TotalPrestamos).Select(t => t.TotalPrestamos), top.Select(t => t.TotalPrestamos));
    }

    [Fact(DisplayName = "RF-16: Desarrollo de Software es el área con mayor uso")]
    public async Task RF16_AreaConMayorUso()
    {
        var servicio = new ReporteService(Db);
        var areas = await servicio.ObtenerPrestamosPorAreaAsync();
        Assert.Equal("Desarrollo de Software", areas.First().Area);
        Assert.Equal("Desarrollo de Software", (await servicio.ObtenerDashboardAsync()).AreaConMayorUso);
    }

    [Fact(DisplayName = "RF-17: el historial de movimientos se entrega del más reciente al más antiguo")]
    public async Task RF17_MovimientosOrdenados()
    {
        var movs = await new ReporteService(Db).ObtenerMovimientosAsync();
        Assert.True(movs.Count >= 20);
        Assert.Equal(movs.OrderByDescending(m => m.Fecha).Select(m => m.Id), movs.Select(m => m.Id));
    }

    [Fact(DisplayName = "Login: credenciales válidas devuelven JWT y rol")]
    public async Task Login_Valido()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var auth = new AuthService(Db, new JwtTokenGenerator(config));
        var r = await auth.LoginAsync(new LoginRequestDto { Correo = "cmendoza@innovatech.pe", Password = "Admin2026!" });
        Assert.False(string.IsNullOrWhiteSpace(r.Token));
        Assert.Equal(Roles.Administrador, r.Usuario.Rol);
    }

    [Fact(DisplayName = "Login: contraseña incorrecta es rechazada")]
    public async Task Login_Invalido()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var auth = new AuthService(Db, new JwtTokenGenerator(config));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => auth.LoginAsync(new LoginRequestDto { Correo = "cmendoza@innovatech.pe", Password = "incorrecta" }));
    }

    [Fact(DisplayName = "Login: un usuario deshabilitado no ingresa (403)")]
    public async Task Login_UsuarioDeshabilitado()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var auth = new AuthService(Db, new JwtTokenGenerator(config));
        var ex = await EsperarReglaAsync(() => auth.LoginAsync(new LoginRequestDto { Correo = "rvasquez@innovatech.pe", Password = "Colab2026!" }));
        Assert.Equal(403, ex.StatusCode);
    }
}

public class ValidadoresTests
{
    [Fact(DisplayName = "FluentValidation: usuario con correo inválido es rechazado")]
    public void Usuario_CorreoInvalido()
    {
        var r = new CrearUsuarioValidator().Validate(new CrearUsuarioDto { Nombres = "Ana", Apellidos = "Ruiz", Correo = "no-es-correo", Area = "QA", Rol = Roles.Colaborador });
        Assert.False(r.IsValid);
    }

    [Fact(DisplayName = "FluentValidation: equipo con categoría fuera del catálogo es rechazado")]
    public void Equipo_CategoriaInvalida()
    {
        var r = new CrearEquipoValidator().Validate(new CrearEquipoDto { CodigoPatrimonial = "INV-1", Nombre = "Algo", Categoria = "Muebles", Marca = "X" });
        Assert.False(r.IsValid);
    }

    [Fact(DisplayName = "FluentValidation: devolución sin observación incumple RN-10")]
    public void Devolucion_SinObservacion()
    {
        var r = new RegistrarDevolucionValidator().Validate(new RegistrarDevolucionDto());
        Assert.Contains(r.Errors, e => e.ErrorMessage.StartsWith("RN-10"));
    }

    [Fact(DisplayName = "FluentValidation: fechas invertidas incumplen RN-04")]
    public void Prestamo_FechasInvertidas()
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var r = new CrearPrestamoValidator().Validate(new CrearPrestamoDto { EquipoId = Guid.NewGuid(), UsuarioId = Guid.NewGuid(), ResponsableId = Guid.NewGuid(), FechaPrestamo = hoy, FechaDevolucion = hoy.AddDays(-1) });
        Assert.Contains(r.Errors, e => e.ErrorMessage.StartsWith("RN-04"));
    }
}
