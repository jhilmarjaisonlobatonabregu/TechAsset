using Microsoft.EntityFrameworkCore;
using TechAsset.Domain.Constants;
using TechAsset.Domain.Entities;
using TechAsset.Infrastructure.Security;

namespace TechAsset.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    private sealed record UsuariosSemilla(
        Usuario Admin, Usuario Soporte1, Usuario Soporte2,
        Usuario ColabDev1, Usuario ColabDev2, Usuario ColabData,
        Usuario ColabQa, Usuario ColabFin, Usuario ColabInactivo)
    {
        public Usuario[] Todos => new[]
        {
            Admin, Soporte1, Soporte2,
            ColabDev1, ColabDev2, ColabData,
            ColabQa, ColabFin, ColabInactivo
        };
    }

    public static async Task SeedAsync(TechAssetDbContext db, CancellationToken ct = default)
    {
        await db.Database.EnsureCreatedAsync(ct);

        if (await db.Usuarios.AnyAsync(ct))
        {
            return;
        }

        var fechaBase = new DateTime(2026, 1, 10, 9, 0, 0, DateTimeKind.Utc);

        var usuarios = CrearUsuarios(fechaBase);
        var equipos = CrearEquipos(fechaBase);
        var prestamos = CrearPrestamos(usuarios, equipos, fechaBase);
        var movimientos = CrearMovimientos(usuarios, equipos, prestamos, fechaBase);

        db.Usuarios.AddRange(usuarios.Todos);
        db.Equipos.AddRange(equipos);
        db.Prestamos.AddRange(prestamos);
        db.MovimientosInventario.AddRange(movimientos);
        await db.SaveChangesAsync(ct);
    }

    // 1. Usuarios (9 cuentas realistas en los 3 roles)
    private static UsuariosSemilla CrearUsuarios(DateTime fechaBase)
    {
        var uAdmin = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111001"),
            Nombres = "Carlos",
            Apellidos = "Mendoza Salazar",
            Correo = "cmendoza@innovatech.pe",
            Area = Areas.InfraestructuraSoporte,
            Rol = Roles.Administrador,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword("Admin2026!"),
            FechaRegistro = fechaBase
        };

        var uSoporte1 = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111002"),
            Nombres = "Lucía",
            Apellidos = "Quispe Huamán",
            Correo = "lquispe@innovatech.pe",
            Area = Areas.InfraestructuraSoporte,
            Rol = Roles.ResponsableTecnologia,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword("Soporte2026!"),
            FechaRegistro = fechaBase.AddDays(1)
        };

        var uSoporte2 = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111003"),
            Nombres = "Marco",
            Apellidos = "Rodríguez Vargas",
            Correo = "mrodriguez@innovatech.pe",
            Area = Areas.InfraestructuraSoporte,
            Rol = Roles.ResponsableTecnologia,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword("Soporte2026!"),
            FechaRegistro = fechaBase.AddDays(2)
        };

        var uColabDev1 = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111004"),
            Nombres = "Alejandro",
            Apellidos = "Torres Mejía",
            Correo = "atorres@innovatech.pe",
            Area = "Desarrollo de Software",
            Rol = Roles.Colaborador,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword(CredencialesPorDefecto.ContrasenaColaborador),
            FechaRegistro = fechaBase.AddDays(3)
        };

        var uColabDev2 = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111005"),
            Nombres = "Valeria",
            Apellidos = "Castillo Ríos",
            Correo = "vcastillo@innovatech.pe",
            Area = "Desarrollo de Software",
            Rol = Roles.Colaborador,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword(CredencialesPorDefecto.ContrasenaColaborador),
            FechaRegistro = fechaBase.AddDays(4)
        };

        var uColabData = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111006"),
            Nombres = "Diego",
            Apellidos = "Flores Cáceres",
            Correo = "dflores@innovatech.pe",
            Area = "Ciencia de Datos e IA",
            Rol = Roles.Colaborador,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword(CredencialesPorDefecto.ContrasenaColaborador),
            FechaRegistro = fechaBase.AddDays(5)
        };

        var uColabQa = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111007"),
            Nombres = "Gabriela",
            Apellidos = "Pereyra Lozano",
            Correo = "gpereyra@innovatech.pe",
            Area = "Aseguramiento de Calidad QA",
            Rol = Roles.Colaborador,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword(CredencialesPorDefecto.ContrasenaColaborador),
            FechaRegistro = fechaBase.AddDays(6)
        };

        var uColabFin = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111008"),
            Nombres = "Jorge",
            Apellidos = "Paredes Alarcón",
            Correo = "jparedes@innovatech.pe",
            Area = "Finanzas y Contabilidad",
            Rol = Roles.Colaborador,
            Estado = true,
            PasswordHash = PasswordHasher.HashPassword(CredencialesPorDefecto.ContrasenaColaborador),
            FechaRegistro = fechaBase.AddDays(7)
        };

        var uColabInactivo = new Usuario
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111009"),
            Nombres = "Renato",
            Apellidos = "Vásquez Espinoza",
            Correo = "rvasquez@innovatech.pe",
            Area = "Operaciones y Proyectos",
            Rol = Roles.Colaborador,
            Estado = false,
            PasswordHash = PasswordHasher.HashPassword(CredencialesPorDefecto.ContrasenaColaborador),
            FechaRegistro = fechaBase.AddDays(8)
        };

        return new UsuariosSemilla(
            uAdmin, uSoporte1, uSoporte2,
            uColabDev1, uColabDev2, uColabData,
            uColabQa, uColabFin, uColabInactivo);
    }

    // 2. Equipos (24 equipos en las 7 categorías: 13 Disponible, 6 Prestado, 3 Mantenimiento, 2 Baja)
    private static List<Equipo> CrearEquipos(DateTime fechaBase)
    {
        var eLap1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222001"), CodigoPatrimonial = "INV-LAP-001", Nombre = "ThinkPad T14 Gen 4 i7 32GB", Categoria = CategoriasEquipo.Laptops, Marca = "Lenovo", Estado = EstadosEquipo.Prestado, FechaRegistro = fechaBase };
        var eLap2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222002"), CodigoPatrimonial = "INV-LAP-002", Nombre = "MacBook Pro 14 M3 Pro 18GB", Categoria = CategoriasEquipo.Laptops, Marca = "Apple", Estado = EstadosEquipo.Prestado, FechaRegistro = fechaBase };
        var eLap3 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222003"), CodigoPatrimonial = "INV-LAP-003", Nombre = "Latitude 5540 Core i7 16GB", Categoria = CategoriasEquipo.Laptops, Marca = "Dell", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eLap4 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222004"), CodigoPatrimonial = "INV-LAP-004", Nombre = "EliteBook 840 G10 Ryzen 7", Categoria = CategoriasEquipo.Laptops, Marca = "HP", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eLap5 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222005"), CodigoPatrimonial = "INV-LAP-005", Nombre = "XPS 15 9530 OLED i9 32GB", Categoria = CategoriasEquipo.Laptops, Marca = "Dell", Estado = EstadosEquipo.Mantenimiento, FechaRegistro = fechaBase };
        var eLap6 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222006"), CodigoPatrimonial = "INV-LAP-006", Nombre = "ThinkPad X1 Carbon Gen 11", Categoria = CategoriasEquipo.Laptops, Marca = "Lenovo", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };

        var ePc1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222007"), CodigoPatrimonial = "INV-PC-001", Nombre = "OptiPlex 7010 Tower i7", Categoria = CategoriasEquipo.ComputadorasEscritorio, Marca = "Dell", Estado = EstadosEquipo.Prestado, FechaRegistro = fechaBase };
        var ePc2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222008"), CodigoPatrimonial = "INV-PC-002", Nombre = "ProDesk 400 G9 SFF i5", Categoria = CategoriasEquipo.ComputadorasEscritorio, Marca = "HP", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var ePc3 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222009"), CodigoPatrimonial = "INV-PC-003", Nombre = "ThinkCentre M90q Tiny i7", Categoria = CategoriasEquipo.ComputadorasEscritorio, Marca = "Lenovo", Estado = EstadosEquipo.Baja, FechaRegistro = fechaBase };

        var eMon1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222010"), CodigoPatrimonial = "INV-MON-001", Nombre = "UltraSharp 27 4K USB-C Hub U2723QE", Categoria = CategoriasEquipo.Monitores, Marca = "Dell", Estado = EstadosEquipo.Prestado, FechaRegistro = fechaBase };
        var eMon2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222011"), CodigoPatrimonial = "INV-MON-002", Nombre = "Odyssey G5 32 QHD 165Hz", Categoria = CategoriasEquipo.Monitores, Marca = "Samsung", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eMon3 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222012"), CodigoPatrimonial = "INV-MON-003", Nombre = "UltraWide 34 WQHD IPS 34WP65C", Categoria = CategoriasEquipo.Monitores, Marca = "LG", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eMon4 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222013"), CodigoPatrimonial = "INV-MON-004", Nombre = "ThinkVision P27h-30 27 QHD", Categoria = CategoriasEquipo.Monitores, Marca = "Lenovo", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };

        var eImp1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222014"), CodigoPatrimonial = "INV-IMP-001", Nombre = "LaserJet Pro MFP 4103fdw", Categoria = CategoriasEquipo.Impresoras, Marca = "HP", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eImp2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222015"), CodigoPatrimonial = "INV-IMP-002", Nombre = "EcoTank L6270 Multifuncional Red", Categoria = CategoriasEquipo.Impresoras, Marca = "Epson", Estado = EstadosEquipo.Mantenimiento, FechaRegistro = fechaBase };
        var eImp3 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222016"), CodigoPatrimonial = "INV-IMP-003", Nombre = "MFC-L8900CDW Láser Color Corporativa", Categoria = CategoriasEquipo.Impresoras, Marca = "Brother", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };

        var eTab1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222017"), CodigoPatrimonial = "INV-TAB-001", Nombre = "iPad Pro 12.9 M2 Wi-Fi 256GB", Categoria = CategoriasEquipo.Tablets, Marca = "Apple", Estado = EstadosEquipo.Prestado, FechaRegistro = fechaBase };
        var eTab2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222018"), CodigoPatrimonial = "INV-TAB-002", Nombre = "Galaxy Tab S9 FE+ 12.4 Con S-Pen", Categoria = CategoriasEquipo.Tablets, Marca = "Samsung", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eTab3 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222019"), CodigoPatrimonial = "INV-TAB-003", Nombre = "Tab P12 Pro AMOLED 256GB", Categoria = CategoriasEquipo.Tablets, Marca = "Lenovo", Estado = EstadosEquipo.Baja, FechaRegistro = fechaBase };

        var eProy1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222020"), CodigoPatrimonial = "INV-PRO-001", Nombre = "PowerLite L210W WXGA 4500 Lúmenes", Categoria = CategoriasEquipo.ProyectoresMultimedia, Marca = "Epson", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eProy2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222021"), CodigoPatrimonial = "INV-PRO-002", Nombre = "MH760 Full HD 5000 Lúmenes Sala Juntas", Categoria = CategoriasEquipo.ProyectoresMultimedia, Marca = "BenQ", Estado = EstadosEquipo.Mantenimiento, FechaRegistro = fechaBase };

        var eRed1 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222022"), CodigoPatrimonial = "INV-RED-001", Nombre = "Catalyst 1200-24P PoE+ Switch", Categoria = CategoriasEquipo.EquiposRed, Marca = "Cisco", Estado = EstadosEquipo.Prestado, FechaRegistro = fechaBase };
        var eRed2 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222023"), CodigoPatrimonial = "INV-RED-002", Nombre = "UniFi U6 Enterprise Wi-Fi 6E AP", Categoria = CategoriasEquipo.EquiposRed, Marca = "Ubiquiti", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };
        var eRed3 = new Equipo { Id = Guid.Parse("22222222-2222-2222-2222-222222222024"), CodigoPatrimonial = "INV-RED-003", Nombre = "FortiGate 60F Next-Gen Firewall", Categoria = CategoriasEquipo.EquiposRed, Marca = "Fortinet", Estado = EstadosEquipo.Disponible, FechaRegistro = fechaBase };

        return new List<Equipo>
        {
            eLap1, eLap2, eLap3, eLap4, eLap5, eLap6,
            ePc1, ePc2, ePc3,
            eMon1, eMon2, eMon3, eMon4,
            eImp1, eImp2, eImp3,
            eTab1, eTab2, eTab3,
            eProy1, eProy2,
            eRed1, eRed2, eRed3
        };
    }

    private static Equipo BuscarEquipo(IEnumerable<Equipo> equipos, string codigoPatrimonial)
        => equipos.First(e => e.CodigoPatrimonial == codigoPatrimonial);

    // 3. Préstamos (20 préstamos: 12 Devueltos, 6 Activos y 2 Pendientes)
    // Desarrollo de Software tendrá 7 préstamos para liderar claramente el indicador AreaConMayorUso
    private static List<Prestamo> CrearPrestamos(UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, DateTime fechaBase)
    {
        var prestamos = new List<Prestamo>();
        prestamos.AddRange(CrearPrestamosDevueltos(usuarios, equipos, fechaBase));
        prestamos.AddRange(CrearPrestamosActivos(usuarios, equipos, fechaBase));
        prestamos.AddRange(CrearSolicitudesPendientes(usuarios, equipos, fechaBase));
        return prestamos;
    }

    // --- 12 Préstamos Devueltos ---
    private static List<Prestamo> CrearPrestamosDevueltos(UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, DateTime fechaBase)
    {
        var (uAdmin, uSoporte1, uSoporte2, uColabDev1, uColabDev2, uColabData, uColabQa, uColabFin, uColabInactivo) = usuarios;
        var eLap1 = BuscarEquipo(equipos, "INV-LAP-001");
        var eLap2 = BuscarEquipo(equipos, "INV-LAP-002");
        var eLap3 = BuscarEquipo(equipos, "INV-LAP-003");
        var eLap4 = BuscarEquipo(equipos, "INV-LAP-004");
        var eLap5 = BuscarEquipo(equipos, "INV-LAP-005");
        var ePc3 = BuscarEquipo(equipos, "INV-PC-003");
        var eMon1 = BuscarEquipo(equipos, "INV-MON-001");
        var eTab1 = BuscarEquipo(equipos, "INV-TAB-001");
        var eTab3 = BuscarEquipo(equipos, "INV-TAB-003");
        var eProy1 = BuscarEquipo(equipos, "INV-PRO-001");

        return new List<Prestamo>
        {
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333001"),
                EquipoId = eLap1.Id,
                UsuarioId = uColabDev1.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 1, 15),
                FechaDevolucion = new DateOnly(2026, 1, 30),
                FechaDevolucionReal = new DateOnly(2026, 1, 29),
                Observacion = "Asignación para sprint de microservicios de facturación.",
                ObservacionDevolucion = "Equipo devuelto con cargador original USB-C de 65W sin daños.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(5)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333002"),
                EquipoId = eLap1.Id,
                UsuarioId = uColabDev2.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 2, 2),
                FechaDevolucion = new DateOnly(2026, 2, 18),
                FechaDevolucionReal = new DateOnly(2026, 2, 17),
                Observacion = "Despliegue de entorno Docker local y pruebas de integración.",
                ObservacionDevolucion = "Recepción conforme; se realizó limpieza preventiva de teclado.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(23)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333003"),
                EquipoId = eLap2.Id,
                UsuarioId = uColabDev2.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 1, 18),
                FechaDevolucion = new DateOnly(2026, 2, 2),
                FechaDevolucionReal = new DateOnly(2026, 2, 1),
                Observacion = "Compilación de aplicaciones móviles iOS y Android corporativas.",
                ObservacionDevolucion = "Devuelto en perfecto estado estético y operativo con adaptador MagSafe 3.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(8)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333004"),
                EquipoId = eLap3.Id,
                UsuarioId = uColabDev1.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 2, 5),
                FechaDevolucion = new DateOnly(2026, 2, 20),
                FechaDevolucionReal = new DateOnly(2026, 2, 19),
                Observacion = "Pruebas de rendimiento en cliente bancario.",
                ObservacionDevolucion = "Devolución verificada por soporte técnico sin incidencias.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(26)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333005"),
                EquipoId = eLap3.Id,
                UsuarioId = uColabData.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 2, 22),
                FechaDevolucion = new DateOnly(2026, 3, 5),
                FechaDevolucionReal = new DateOnly(2026, 3, 4),
                Observacion = "Entrenamiento de modelo predictivo de rotación de clientes.",
                ObservacionDevolucion = "Equipo operativo, disco formateado según protocolo de seguridad.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(43)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333006"),
                EquipoId = eMon1.Id,
                UsuarioId = uColabDev1.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 1, 20),
                FechaDevolucion = new DateOnly(2026, 2, 10),
                FechaDevolucionReal = new DateOnly(2026, 2, 9),
                Observacion = "Segundo monitor para estación de arquitectura de software.",
                ObservacionDevolucion = "Panel IPS sin píxeles muertos, incluye cable USB-C y DisplayPort.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(10)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333007"),
                EquipoId = eTab1.Id,
                UsuarioId = uColabQa.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 1, 25),
                FechaDevolucion = new DateOnly(2026, 2, 8),
                FechaDevolucionReal = new DateOnly(2026, 2, 7),
                Observacion = "Validación de diseño responsivo y accesibilidad en Safari iPadOS.",
                ObservacionDevolucion = "Pantalla impecable y Apple Pencil con carga al 100%.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(15)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333008"),
                EquipoId = eProy1.Id,
                UsuarioId = uColabFin.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 2, 10),
                FechaDevolucion = new DateOnly(2026, 2, 14),
                FechaDevolucionReal = new DateOnly(2026, 2, 13),
                Observacion = "Sustentación de presupuesto trimestral ante directorio.",
                ObservacionDevolucion = "Proyector devuelto con control remoto, cable HDMI y maletín acolchado.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(31)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333009"),
                EquipoId = eLap5.Id,
                UsuarioId = uColabData.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 2, 12),
                FechaDevolucion = new DateOnly(2026, 2, 26),
                FechaDevolucionReal = new DateOnly(2026, 2, 25),
                Observacion = "Procesamiento de pipeline ETL y visualización analítica.",
                ObservacionDevolucion = "Se reporta calentamiento en ventilador derecho; pasa a Mantenimiento preventivo.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(33)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333010"),
                EquipoId = ePc3.Id,
                UsuarioId = uColabInactivo.Id,
                ResponsableId = uAdmin.Id,
                FechaPrestamo = new DateOnly(2026, 1, 12),
                FechaDevolucion = new DateOnly(2026, 1, 28),
                FechaDevolucionReal = new DateOnly(2026, 1, 27),
                Observacion = "Estación temporal de coordinación de operaciones.",
                ObservacionDevolucion = "Devuelto al finalizar contrato; equipo programado para baja por obsolescencia.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(2)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333011"),
                EquipoId = eLap4.Id,
                UsuarioId = uColabQa.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 2, 15),
                FechaDevolucion = new DateOnly(2026, 3, 1),
                FechaDevolucionReal = new DateOnly(2026, 2, 28),
                Observacion = "Ejecución de suite automatizada Playwright y pruebas E2E.",
                ObservacionDevolucion = "Equipo verificado y reincorporado al stock disponible.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(36)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333012"),
                EquipoId = eTab3.Id,
                UsuarioId = uColabFin.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 1, 14),
                FechaDevolucion = new DateOnly(2026, 1, 24),
                FechaDevolucionReal = new DateOnly(2026, 1, 23),
                Observacion = "Toma de inventario físico de activos fijos en sede central.",
                ObservacionDevolucion = "Equipo devuelto; batería degradada al 40%, se procede a baja lógica.",
                EstadoPrestamo = EstadosPrestamo.Devuelto,
                FechaRegistro = fechaBase.AddDays(4)
            },
        };
    }

    // --- 6 Préstamos Activos (coinciden con los 6 equipos en Estado = Prestado) ---
    private static List<Prestamo> CrearPrestamosActivos(UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, DateTime fechaBase)
    {
        var (uAdmin, uSoporte1, uSoporte2, uColabDev1, uColabDev2, uColabData, uColabQa, uColabFin, uColabInactivo) = usuarios;
        var eLap1 = BuscarEquipo(equipos, "INV-LAP-001");
        var eLap2 = BuscarEquipo(equipos, "INV-LAP-002");
        var ePc1 = BuscarEquipo(equipos, "INV-PC-001");
        var eMon1 = BuscarEquipo(equipos, "INV-MON-001");
        var eTab1 = BuscarEquipo(equipos, "INV-TAB-001");
        var eRed1 = BuscarEquipo(equipos, "INV-RED-001");

        return new List<Prestamo>
        {
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333013"),
                EquipoId = eLap1.Id,
                UsuarioId = uColabDev1.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 3, 2),
                FechaDevolucion = new DateOnly(2026, 3, 30),
                Observacion = "Desarrollo del portal corporativo de gestión de activos TechAsset.",
                EstadoPrestamo = EstadosPrestamo.Activo,
                FechaRegistro = fechaBase.AddDays(51)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333014"),
                EquipoId = eLap2.Id,
                UsuarioId = uColabDev2.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 3, 4),
                FechaDevolucion = new DateOnly(2026, 4, 2),
                Observacion = "Integración continua y arquitectura frontend React/TypeScript.",
                EstadoPrestamo = EstadosPrestamo.Activo,
                FechaRegistro = fechaBase.AddDays(53)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333015"),
                EquipoId = ePc1.Id,
                UsuarioId = uColabData.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 3, 5),
                FechaDevolucion = new DateOnly(2026, 4, 10),
                Observacion = "Servidor local de inferencia y análisis estadístico en Ciencia de Datos.",
                EstadoPrestamo = EstadosPrestamo.Activo,
                FechaRegistro = fechaBase.AddDays(54)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333016"),
                EquipoId = eMon1.Id,
                UsuarioId = uColabDev1.Id,
                ResponsableId = uSoporte1.Id,
                FechaPrestamo = new DateOnly(2026, 3, 3),
                FechaDevolucion = new DateOnly(2026, 3, 30),
                Observacion = "Monitor auxiliar 4K asignado a líder técnico de Desarrollo de Software.",
                EstadoPrestamo = EstadosPrestamo.Activo,
                FechaRegistro = fechaBase.AddDays(52)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333017"),
                EquipoId = eTab1.Id,
                UsuarioId = uColabQa.Id,
                ResponsableId = uSoporte2.Id,
                FechaPrestamo = new DateOnly(2026, 3, 6),
                FechaDevolucion = new DateOnly(2026, 3, 25),
                Observacion = "Certificación funcional multi-dispositivo del release 2026.1.",
                EstadoPrestamo = EstadosPrestamo.Activo,
                FechaRegistro = fechaBase.AddDays(55)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333018"),
                EquipoId = eRed1.Id,
                UsuarioId = uSoporte2.Id,
                ResponsableId = uAdmin.Id,
                FechaPrestamo = new DateOnly(2026, 3, 1),
                FechaDevolucion = new DateOnly(2026, 3, 28),
                Observacion = "Segmentación de VLANs en laboratorio de contingencia de red.",
                EstadoPrestamo = EstadosPrestamo.Activo,
                FechaRegistro = fechaBase.AddDays(50)
            },
        };
    }

    // --- 2 Solicitudes Pendientes de Aprobación (equipos permanecen en Estado = Disponible y ResponsableId = null) ---
    private static List<Prestamo> CrearSolicitudesPendientes(UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, DateTime fechaBase)
    {
        var (uAdmin, uSoporte1, uSoporte2, uColabDev1, uColabDev2, uColabData, uColabQa, uColabFin, uColabInactivo) = usuarios;
        var eLap3 = BuscarEquipo(equipos, "INV-LAP-003");
        var eLap4 = BuscarEquipo(equipos, "INV-LAP-004");

        return new List<Prestamo>
        {
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333019"),
                EquipoId = eLap3.Id,
                UsuarioId = uColabDev1.Id,
                ResponsableId = null,
                FechaPrestamo = new DateOnly(2026, 3, 12),
                FechaDevolucion = new DateOnly(2026, 3, 26),
                Observacion = "Solicitud de laptop adicional para pruebas de carga y estrés del módulo de préstamos.",
                EstadoPrestamo = EstadosPrestamo.Pendiente,
                FechaRegistro = fechaBase.AddDays(56)
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333020"),
                EquipoId = eLap4.Id,
                UsuarioId = uColabQa.Id,
                ResponsableId = null,
                FechaPrestamo = new DateOnly(2026, 3, 13),
                FechaDevolucion = new DateOnly(2026, 3, 27),
                Observacion = "Solicitud de equipo portátil para validación funcional en entorno de preproducción.",
                EstadoPrestamo = EstadosPrestamo.Pendiente,
                FechaRegistro = fechaBase.AddDays(57)
            }
        };
    }

    // 4. Movimientos de Inventario (44 registros detallados para RF-17)
    private static List<MovimientoInventario> CrearMovimientos(
        UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, IReadOnlyList<Prestamo> prestamos, DateTime fechaBase)
    {
        var movimientos = new List<MovimientoInventario>();
        movimientos.AddRange(CrearMovimientosAlta(usuarios, equipos, fechaBase));
        movimientos.AddRange(CrearMovimientosPrestamosYDevoluciones(usuarios, equipos, prestamos));
        movimientos.AddRange(CrearMovimientosMantenimientoYBaja(usuarios, equipos));
        return movimientos;
    }

    private static List<MovimientoInventario> CrearMovimientosAlta(UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, DateTime fechaBase)
    {
        var uAdmin = usuarios.Admin;
        var movimientos = new List<MovimientoInventario>();
        var idx = 1;

        foreach (var eq in equipos.Take(10))
        {
            movimientos.Add(new MovimientoInventario
            {
                Id = Guid.NewGuid(),
                Fecha = fechaBase.AddHours(idx++),
                TipoMovimiento = TiposMovimiento.AltaEquipo,
                EquipoId = eq.Id,
                EstadoAnterior = "Nuevo",
                EstadoNuevo = EstadosEquipo.Disponible,
                ResponsableId = uAdmin.Id,
                Area = Areas.InfraestructuraSoporte,
                Observacion = $"Alta patrimonial inicial del activo {eq.CodigoPatrimonial} ({eq.Nombre})."
            });
        }

        return movimientos;
    }

    private static List<MovimientoInventario> CrearMovimientosPrestamosYDevoluciones(
        UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos, IReadOnlyList<Prestamo> prestamos)
    {
        var eLap5 = BuscarEquipo(equipos, "INV-LAP-005");
        var movimientos = new List<MovimientoInventario>();

        foreach (var pr in prestamos)
        {
            if (pr.EstadoPrestamo == EstadosPrestamo.Pendiente)
            {
                continue;
            }
            var colab = usuarios.Todos.First(u => u.Id == pr.UsuarioId);
            movimientos.Add(new MovimientoInventario
            {
                Id = Guid.NewGuid(),
                Fecha = pr.FechaPrestamo.ToDateTime(new TimeOnly(10, 15), DateTimeKind.Utc),
                TipoMovimiento = TiposMovimiento.Prestamo,
                EquipoId = pr.EquipoId,
                EstadoAnterior = EstadosEquipo.Disponible,
                EstadoNuevo = EstadosEquipo.Prestado,
                UsuarioId = pr.UsuarioId,
                ResponsableId = pr.ResponsableId,
                Area = colab.Area,
                Observacion = $"Entrega en préstamo a {colab.NombreCompleto}: {pr.Observacion}"
            });

            if (pr.EstadoPrestamo == EstadosPrestamo.Devuelto && pr.FechaDevolucionReal.HasValue)
            {
                var estadoPost = pr.EquipoId == eLap5.Id ? EstadosEquipo.Mantenimiento : EstadosEquipo.Disponible;
                movimientos.Add(new MovimientoInventario
                {
                    Id = Guid.NewGuid(),
                    Fecha = pr.FechaDevolucionReal.Value.ToDateTime(new TimeOnly(16, 40), DateTimeKind.Utc),
                    TipoMovimiento = TiposMovimiento.Devolucion,
                    EquipoId = pr.EquipoId,
                    EstadoAnterior = EstadosEquipo.Prestado,
                    EstadoNuevo = estadoPost,
                    UsuarioId = pr.UsuarioId,
                    ResponsableId = pr.ResponsableId,
                    Area = colab.Area,
                    Observacion = $"Devolución registrada ({colab.NombreCompleto}): {pr.ObservacionDevolucion}"
                });
            }
        }

        return movimientos;
    }

    // Movimientos adicionales de Mantenimiento y Baja Lógica
    private static List<MovimientoInventario> CrearMovimientosMantenimientoYBaja(UsuariosSemilla usuarios, IReadOnlyList<Equipo> equipos)
    {
        var (uAdmin, uSoporte1, uSoporte2) = (usuarios.Admin, usuarios.Soporte1, usuarios.Soporte2);
        var eImp2 = BuscarEquipo(equipos, "INV-IMP-002");
        var eProy2 = BuscarEquipo(equipos, "INV-PRO-002");
        var ePc3 = BuscarEquipo(equipos, "INV-PC-003");
        var eTab3 = BuscarEquipo(equipos, "INV-TAB-003");
        var movimientos = new List<MovimientoInventario>();

        movimientos.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = new DateTime(2026, 2, 26, 11, 30, 0, DateTimeKind.Utc),
            TipoMovimiento = TiposMovimiento.CambioEstado,
            EquipoId = eImp2.Id,
            EstadoAnterior = EstadosEquipo.Disponible,
            EstadoNuevo = EstadosEquipo.Mantenimiento,
            ResponsableId = uSoporte1.Id,
            Area = Areas.InfraestructuraSoporte,
            Observacion = "Limpieza de cabezales de impresión y calibración de inyectores Epson."
        });

        movimientos.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = new DateTime(2026, 2, 27, 15, 0, 0, DateTimeKind.Utc),
            TipoMovimiento = TiposMovimiento.CambioEstado,
            EquipoId = eProy2.Id,
            EstadoAnterior = EstadosEquipo.Disponible,
            EstadoNuevo = EstadosEquipo.Mantenimiento,
            ResponsableId = uSoporte2.Id,
            Area = Areas.InfraestructuraSoporte,
            Observacion = "Sustitución de lámpara óptica y filtro de aire en proyector BenQ."
        });

        movimientos.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = new DateTime(2026, 1, 28, 17, 15, 0, DateTimeKind.Utc),
            TipoMovimiento = TiposMovimiento.BajaLogica,
            EquipoId = ePc3.Id,
            EstadoAnterior = EstadosEquipo.Disponible,
            EstadoNuevo = EstadosEquipo.Baja,
            ResponsableId = uAdmin.Id,
            Area = Areas.InfraestructuraSoporte,
            Observacion = "RN-06: Baja lógica aplicada tras cumplir vida útil contable conservando historial de préstamos."
        });

        movimientos.Add(new MovimientoInventario
        {
            Id = Guid.NewGuid(),
            Fecha = new DateTime(2026, 1, 24, 18, 0, 0, DateTimeKind.Utc),
            TipoMovimiento = TiposMovimiento.BajaLogica,
            EquipoId = eTab3.Id,
            EstadoAnterior = EstadosEquipo.Disponible,
            EstadoNuevo = EstadosEquipo.Baja,
            ResponsableId = uAdmin.Id,
            Area = Areas.InfraestructuraSoporte,
            Observacion = "RN-06: Baja lógica aplicada por desgaste severo de batería conservando trazabilidad histórica."
        });

        return movimientos;
    }
}
