-- =============================================================================
-- SISTEMA: TechAsset - Gestión de Inventario y Préstamo de Equipos Tecnológicos
-- EMPRESA: Innovatech Solutions S.A.C. (+500 colaboradores)
-- MOTOR:   PostgreSQL 16+
-- BASE DE DATOS: techasset_db
-- DESCRIPCIÓN: Script DDL y DML alineado con TechAssetDbContext (EF Core) y
--              DatabaseSeeder, incluyendo restricciones declarativas de las
--              Reglas de Negocio (RN-01 a RN-10), índice parcial único para
--              RN-01 y semilla idéntica al seeder de la aplicación (9 usuarios
--              con hashes PBKDF2 reales, 24 equipos en las 7 categorías,
--              20 préstamos: 12 Devueltos, 6 Activos y 2 Pendientes, y
--              44 movimientos de inventario).
-- =============================================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Limpieza ordenada en caso de recreación del esquema
DROP TABLE IF EXISTS public.movimientos_inventario CASCADE;
DROP TABLE IF EXISTS public.prestamos CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- =============================================================================
-- 1. TABLA: usuarios (RF-01 a RF-04 | RN-08, RN-09, RN-10)
-- =============================================================================
CREATE TABLE public.usuarios (
    "Id"            uuid                    NOT NULL,
    "Nombres"       character varying(100)  NOT NULL CHECK (char_length(trim("Nombres")) >= 2),
    "Apellidos"     character varying(100)  NOT NULL CHECK (char_length(trim("Apellidos")) >= 2),
    "Correo"        character varying(150)  NOT NULL,
    "Area"          character varying(100)  NOT NULL CHECK (char_length(trim("Area")) >= 2),
    "Estado"        boolean                 NOT NULL,
    "Rol"           character varying(50)   NOT NULL,
    "PasswordHash"  character varying(255)  NOT NULL,
    "FechaRegistro" timestamp with time zone NOT NULL,

    CONSTRAINT "PK_usuarios" PRIMARY KEY ("Id"),

    -- RN-09: Solo roles válidos del sistema (Administrador, Responsable de Tecnología, Colaborador)
    CONSTRAINT ck_usuarios_rol CHECK (
        "Rol" IN ('Administrador', 'Responsable de Tecnología', 'Colaborador')
    )
);

-- RN-08: No pueden existir dos usuarios con el mismo correo electrónico
CREATE UNIQUE INDEX "IX_Usuarios_Correo" ON public.usuarios USING btree ("Correo");

COMMENT ON TABLE public.usuarios IS 'Catálogo corporativo de usuarios de Innovatech Solutions S.A.C.';
COMMENT ON COLUMN public.usuarios."Correo" IS 'Correo corporativo único validado por RN-08';
COMMENT ON COLUMN public.usuarios."Estado" IS 'TRUE = Activo (habilitado para préstamos RN-10), FALSE = Inactivo';

-- =============================================================================
-- 2. TABLA: equipos (RF-05 a RF-08 | RN-01, RN-02, RN-03, RN-06, RN-07)
-- =============================================================================
CREATE TABLE public.equipos (
    "Id"                uuid                    NOT NULL,
    "CodigoPatrimonial" character varying(50)   NOT NULL,
    "Nombre"            character varying(100)  NOT NULL CHECK (char_length(trim("Nombre")) >= 3),
    "Categoria"         character varying(50)   NOT NULL,
    "Marca"             character varying(50)   NOT NULL,
    "Estado"            character varying(30)   NOT NULL,
    "FechaRegistro"     timestamp with time zone NOT NULL,

    CONSTRAINT "PK_equipos" PRIMARY KEY ("Id"),

    -- Estados operativos permitidos según RF-07 y RN-02/RN-03
    CONSTRAINT ck_equipos_estado CHECK (
        "Estado" IN ('Disponible', 'Prestado', 'Mantenimiento', 'Baja')
    ),

    -- Categorías oficiales del inventario tecnológico de Innovatech Solutions S.A.C.
    CONSTRAINT ck_equipos_categoria CHECK (
        "Categoria" IN (
            'Laptops',
            'Computadoras de escritorio',
            'Monitores',
            'Impresoras',
            'Tablets',
            'Proyectores multimedia',
            'Equipos de red'
        )
    )
);

-- RN-07: Cada equipo debe contar con un código patrimonial único
CREATE UNIQUE INDEX "IX_Equipos_CodigoPatrimonial" ON public.equipos USING btree ("CodigoPatrimonial");

COMMENT ON TABLE public.equipos IS 'Inventario de activos tecnológicos con trazabilidad por código patrimonial único';
COMMENT ON COLUMN public.equipos."CodigoPatrimonial" IS 'Identificador patrimonial único en formato INV-{CAT}-{CORRELATIVO} (RN-07)';

-- =============================================================================
-- 3. TABLA: prestamos (RF-09 a RF-12 | RN-01, RN-02, RN-03, RN-04, RN-05, RN-10)
-- =============================================================================
CREATE TABLE public.prestamos (
    "Id"                    uuid                    NOT NULL,
    "FechaPrestamo"         date                    NOT NULL,
    "FechaDevolucion"       date                    NOT NULL,
    "FechaDevolucionReal"   date,
    "Observacion"           text                    NOT NULL,
    "ObservacionDevolucion" text,
    "EstadoPrestamo"        character varying(30)   NOT NULL,
    "UsuarioId"             uuid                    NOT NULL,
    "EquipoId"              uuid                    NOT NULL,
    "ResponsableId"         uuid,
    "FechaRegistro"         timestamp with time zone NOT NULL,

    CONSTRAINT "PK_prestamos" PRIMARY KEY ("Id"),

    -- RN-04: La fecha estimada de devolución debe ser estrictamente posterior a la fecha de préstamo
    CONSTRAINT ck_prestamos_fechas_coherentes CHECK ("FechaDevolucion" > "FechaPrestamo"),

    -- Estados del ciclo de vida del préstamo (incluye solicitudes Pendientes de aprobación)
    CONSTRAINT ck_prestamos_estado CHECK (
        "EstadoPrestamo" IN ('Pendiente', 'Activo', 'Devuelto')
    ),

    -- RN-05: Todo préstamo aprobado (Activo o Devuelto) debe tener un usuario responsable asignado
    CONSTRAINT ck_prestamos_responsable_activo CHECK (
        "EstadoPrestamo" = 'Pendiente' OR "ResponsableId" IS NOT NULL
    ),

    -- Relaciones de integridad referencial (RN-06 impide eliminación física de equipos con historial)
    CONSTRAINT "FK_prestamos_equipos_EquipoId"
        FOREIGN KEY ("EquipoId") REFERENCES public.equipos("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_prestamos_usuarios_ResponsableId"
        FOREIGN KEY ("ResponsableId") REFERENCES public.usuarios("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_prestamos_usuarios_UsuarioId"
        FOREIGN KEY ("UsuarioId") REFERENCES public.usuarios("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_prestamos_EquipoId_EstadoPrestamo" ON public.prestamos USING btree ("EquipoId", "EstadoPrestamo");
CREATE INDEX "IX_prestamos_ResponsableId" ON public.prestamos USING btree ("ResponsableId");
CREATE INDEX "IX_prestamos_UsuarioId" ON public.prestamos USING btree ("UsuarioId");

-- RN-01: Un equipo no puede prestarse si ya tiene un préstamo activo simultáneo
CREATE UNIQUE INDEX ix_prestamos_equipo_activo
    ON public.prestamos USING btree ("EquipoId")
    WHERE ("EstadoPrestamo" = 'Activo');

COMMENT ON TABLE public.prestamos IS 'Registro transaccional de préstamos y devoluciones de equipos tecnológicos';
COMMENT ON INDEX public.ix_prestamos_equipo_activo IS 'Garantía a nivel de motor de base de datos para RN-01 (un solo préstamo activo por equipo)';

-- =============================================================================
-- 4. TABLA: movimientos_inventario (RF-07, RF-09, RF-10, RF-17 | Auditoría)
-- =============================================================================
CREATE TABLE public.movimientos_inventario (
    "Id"             uuid                    NOT NULL,
    "Fecha"          timestamp with time zone NOT NULL,
    "TipoMovimiento" character varying(40)   NOT NULL,
    "EquipoId"       uuid                    NOT NULL,
    "EstadoAnterior" character varying(30)   NOT NULL,
    "EstadoNuevo"    character varying(30)   NOT NULL,
    "UsuarioId"      uuid,
    "ResponsableId"  uuid,
    "Area"           character varying(100)  NOT NULL,
    "Observacion"    text                    NOT NULL,

    CONSTRAINT "PK_movimientos_inventario" PRIMARY KEY ("Id"),

    CONSTRAINT ck_movimientos_tipo CHECK (
        "TipoMovimiento" IN ('AltaEquipo', 'ActualizacionEquipo', 'Prestamo', 'Devolucion', 'CambioEstado', 'BajaLogica')
    ),
    CONSTRAINT "FK_movimientos_inventario_equipos_EquipoId"
        FOREIGN KEY ("EquipoId") REFERENCES public.equipos("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_movimientos_inventario_usuarios_ResponsableId"
        FOREIGN KEY ("ResponsableId") REFERENCES public.usuarios("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_movimientos_inventario_usuarios_UsuarioId"
        FOREIGN KEY ("UsuarioId") REFERENCES public.usuarios("Id") ON DELETE SET NULL
);

CREATE INDEX "IX_movimientos_inventario_EquipoId" ON public.movimientos_inventario USING btree ("EquipoId");
CREATE INDEX "IX_movimientos_inventario_ResponsableId" ON public.movimientos_inventario USING btree ("ResponsableId");
CREATE INDEX "IX_movimientos_inventario_UsuarioId" ON public.movimientos_inventario USING btree ("UsuarioId");

COMMENT ON TABLE public.movimientos_inventario IS 'Bitácora inmutable de movimientos y cambios de estado del inventario tecnológico';

-- =============================================================================
-- 5. DATOS SEMILLA: 9 USUARIOS CORPORATIVOS (Hashes PBKDF2-SHA256 reales)
-- Contraseñas por rol:
--   - Administrador (cmendoza@innovatech.pe):            Admin2026!
--   - Responsable de Tecnología (lquispe@innovatech.pe): Soporte2026!
--   - Colaborador (atorres@innovatech.pe y demás):       Colab2026!
-- =============================================================================
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111001', 'Carlos', 'Mendoza Salazar', 'cmendoza@innovatech.pe', 'Infraestructura y Soporte', true, 'Administrador', 'h/wSsk5wjalGN0Owk0k/gw==.Egg1bcQrHll49hN3RQvhe33JHfbXKvgaV7Pu+RFh+84=', '2026-01-10 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111002', 'Lucía', 'Quispe Huamán', 'lquispe@innovatech.pe', 'Infraestructura y Soporte', true, 'Responsable de Tecnología', 'sbv/4bQ6rZ+My3EoIIWUaQ==.6pmFm1TxGyBPnyQRjNJBdT8YBfUdiDPGaoAxvx8YaUg=', '2026-01-11 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111003', 'Marco', 'Rodríguez Vargas', 'mrodriguez@innovatech.pe', 'Infraestructura y Soporte', true, 'Responsable de Tecnología', 'GLn9+YR3qoL1k8UP9jG9Xw==.6L13OX3psm9ZP3SBGc4acp+WujXrOuWV4vnQK33hHv0=', '2026-01-12 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111004', 'Alejandro', 'Torres Mejía', 'atorres@innovatech.pe', 'Desarrollo de Software', true, 'Colaborador', 'aqmh54R495QFrKLmXrDGcA==.zXzQPHhs4QpTYiGIofkxK6m/KdeaaRvomRiCjedhtHM=', '2026-01-13 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111005', 'Valeria', 'Castillo Ríos', 'vcastillo@innovatech.pe', 'Desarrollo de Software', true, 'Colaborador', 'lhmeKi8mAhHYs9YJQsvLaQ==.vlABvdY5PyAxPQ4DdirxodimJiRrANhurW9gfIqzp+c=', '2026-01-14 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111006', 'Diego', 'Flores Cáceres', 'dflores@innovatech.pe', 'Ciencia de Datos e IA', true, 'Colaborador', 'DQWDWkjlVkAbeJHvFhjcnQ==.2AFQLy8pHDPJSn9604kjohrmbQHzyxh2E9OgAZel5Gk=', '2026-01-15 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111007', 'Gabriela', 'Pereyra Lozano', 'gpereyra@innovatech.pe', 'Aseguramiento de Calidad QA', true, 'Colaborador', 'zXvY6UAJWq4jvZtiG88ZRw==.pUDA7tUIgLtahKuL/bMS5QXdk8uu9npgHMxRUuvieZw=', '2026-01-16 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111008', 'Jorge', 'Paredes Alarcón', 'jparedes@innovatech.pe', 'Finanzas y Contabilidad', true, 'Colaborador', 'rtCVmOI4a97EygX0YGqryQ==.sF9kDWEEwbccsnmgKVrHCKtvY6hqmzpvI7eer3D8bqg=', '2026-01-17 04:00:00-05');
INSERT INTO public.usuarios ("Id", "Nombres", "Apellidos", "Correo", "Area", "Estado", "Rol", "PasswordHash", "FechaRegistro") VALUES ('11111111-1111-1111-1111-111111111009', 'Renato', 'Vásquez Espinoza', 'rvasquez@innovatech.pe', 'Operaciones y Proyectos', false, 'Colaborador', 'APMTR93CN6q+Y8Ko3QPsVQ==.TmyAjvXLl2ObKzJnXh4Xlxg9U66l4T910ZcwEBCB9A4=', '2026-01-18 04:00:00-05');

-- =============================================================================
-- 6. DATOS SEMILLA: 24 EQUIPOS TECNOLÓGICOS (7 Categorías Oficiales)
-- =============================================================================
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222001', 'INV-LAP-001', 'ThinkPad T14 Gen 4 i7 32GB', 'Laptops', 'Lenovo', 'Prestado', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222002', 'INV-LAP-002', 'MacBook Pro 14 M3 Pro 18GB', 'Laptops', 'Apple', 'Prestado', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222003', 'INV-LAP-003', 'Latitude 5540 Core i7 16GB', 'Laptops', 'Dell', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222004', 'INV-LAP-004', 'EliteBook 840 G10 Ryzen 7', 'Laptops', 'HP', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222005', 'INV-LAP-005', 'XPS 15 9530 OLED i9 32GB', 'Laptops', 'Dell', 'Mantenimiento', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222006', 'INV-LAP-006', 'ThinkPad X1 Carbon Gen 11', 'Laptops', 'Lenovo', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222007', 'INV-PC-001', 'OptiPlex 7010 Tower i7', 'Computadoras de escritorio', 'Dell', 'Prestado', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222008', 'INV-PC-002', 'ProDesk 400 G9 SFF i5', 'Computadoras de escritorio', 'HP', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222009', 'INV-PC-003', 'ThinkCentre M90q Tiny i7', 'Computadoras de escritorio', 'Lenovo', 'Baja', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222010', 'INV-MON-001', 'UltraSharp 27 4K USB-C Hub U2723QE', 'Monitores', 'Dell', 'Prestado', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222011', 'INV-MON-002', 'Odyssey G5 32 QHD 165Hz', 'Monitores', 'Samsung', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222012', 'INV-MON-003', 'UltraWide 34 WQHD IPS 34WP65C', 'Monitores', 'LG', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222013', 'INV-MON-004', 'ThinkVision P27h-30 27 QHD', 'Monitores', 'Lenovo', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222014', 'INV-IMP-001', 'LaserJet Pro MFP 4103fdw', 'Impresoras', 'HP', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222015', 'INV-IMP-002', 'EcoTank L6270 Multifuncional Red', 'Impresoras', 'Epson', 'Mantenimiento', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222016', 'INV-IMP-003', 'MFC-L8900CDW Láser Color Corporativa', 'Impresoras', 'Brother', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222017', 'INV-TAB-001', 'iPad Pro 12.9 M2 Wi-Fi 256GB', 'Tablets', 'Apple', 'Prestado', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222018', 'INV-TAB-002', 'Galaxy Tab S9 FE+ 12.4 Con S-Pen', 'Tablets', 'Samsung', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222019', 'INV-TAB-003', 'Tab P12 Pro AMOLED 256GB', 'Tablets', 'Lenovo', 'Baja', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222020', 'INV-PRO-001', 'PowerLite L210W WXGA 4500 Lúmenes', 'Proyectores multimedia', 'Epson', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222021', 'INV-PRO-002', 'MH760 Full HD 5000 Lúmenes Sala Juntas', 'Proyectores multimedia', 'BenQ', 'Mantenimiento', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222022', 'INV-RED-001', 'Catalyst 1200-24P PoE+ Switch', 'Equipos de red', 'Cisco', 'Prestado', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222023', 'INV-RED-002', 'UniFi U6 Enterprise Wi-Fi 6E AP', 'Equipos de red', 'Ubiquiti', 'Disponible', '2026-01-10 04:00:00-05');
INSERT INTO public.equipos ("Id", "CodigoPatrimonial", "Nombre", "Categoria", "Marca", "Estado", "FechaRegistro") VALUES ('22222222-2222-2222-2222-222222222024', 'INV-RED-003', 'FortiGate 60F Next-Gen Firewall', 'Equipos de red', 'Fortinet', 'Disponible', '2026-01-10 04:00:00-05');

-- =============================================================================
-- 7. DATOS SEMILLA: 20 PRÉSTAMOS (12 Devueltos + 6 Activos + 2 Pendientes)
-- =============================================================================
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333001', '2026-01-15', '2026-01-30', '2026-01-29', 'Asignación para sprint de microservicios de facturación.', 'Equipo devuelto con cargador original USB-C de 65W sin daños.', 'Devuelto', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111002', '2026-01-15 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333002', '2026-02-02', '2026-02-18', '2026-02-17', 'Despliegue de entorno Docker local y pruebas de integración.', 'Recepción conforme; se realizó limpieza preventiva de teclado.', 'Devuelto', '11111111-1111-1111-1111-111111111005', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111003', '2026-02-02 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333003', '2026-01-18', '2026-02-02', '2026-02-01', 'Compilación de aplicaciones móviles iOS y Android corporativas.', 'Devuelto en perfecto estado estético y operativo con adaptador MagSafe 3.', 'Devuelto', '11111111-1111-1111-1111-111111111005', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111002', '2026-01-18 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333004', '2026-02-05', '2026-02-20', '2026-02-19', 'Pruebas de rendimiento en cliente bancario.', 'Devolución verificada por soporte técnico sin incidencias.', 'Devuelto', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111002', '2026-02-05 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333005', '2026-02-22', '2026-03-05', '2026-03-04', 'Entrenamiento de modelo predictivo de rotación de clientes.', 'Equipo operativo, disco formateado según protocolo de seguridad.', 'Devuelto', '11111111-1111-1111-1111-111111111006', '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111003', '2026-02-22 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333006', '2026-01-20', '2026-02-10', '2026-02-09', 'Segundo monitor para estación de arquitectura de software.', 'Panel IPS sin píxeles muertos, incluye cable USB-C y DisplayPort.', 'Devuelto', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222010', '11111111-1111-1111-1111-111111111002', '2026-01-20 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333007', '2026-01-25', '2026-02-08', '2026-02-07', 'Validación de diseño responsivo y accesibilidad en Safari iPadOS.', 'Pantalla impecable y Apple Pencil con carga al 100%.', 'Devuelto', '11111111-1111-1111-1111-111111111007', '22222222-2222-2222-2222-222222222017', '11111111-1111-1111-1111-111111111003', '2026-01-25 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333008', '2026-02-10', '2026-02-14', '2026-02-13', 'Sustentación de presupuesto trimestral ante directorio.', 'Proyector devuelto con control remoto, cable HDMI y maletín acolchado.', 'Devuelto', '11111111-1111-1111-1111-111111111008', '22222222-2222-2222-2222-222222222020', '11111111-1111-1111-1111-111111111002', '2026-02-10 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333009', '2026-02-12', '2026-02-26', '2026-02-25', 'Procesamiento de pipeline ETL y visualización analítica.', 'Se reporta calentamiento en ventilador derecho; pasa a Mantenimiento preventivo.', 'Devuelto', '11111111-1111-1111-1111-111111111006', '22222222-2222-2222-2222-222222222005', '11111111-1111-1111-1111-111111111003', '2026-02-12 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333010', '2026-01-12', '2026-01-28', '2026-01-27', 'Estación temporal de coordinación de operaciones.', 'Devuelto al finalizar contrato; equipo programado para baja por obsolescencia.', 'Devuelto', '11111111-1111-1111-1111-111111111009', '22222222-2222-2222-2222-222222222009', '11111111-1111-1111-1111-111111111001', '2026-01-12 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333011', '2026-02-15', '2026-03-01', '2026-02-28', 'Ejecución de suite automatizada Playwright y pruebas E2E.', 'Equipo verificado y reincorporado al stock disponible.', 'Devuelto', '11111111-1111-1111-1111-111111111007', '22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111002', '2026-02-15 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333012', '2026-01-14', '2026-01-24', '2026-01-23', 'Toma de inventario físico de activos fijos en sede central.', 'Equipo devuelto; batería degradada al 40%, se procede a baja lógica.', 'Devuelto', '11111111-1111-1111-1111-111111111008', '22222222-2222-2222-2222-222222222019', '11111111-1111-1111-1111-111111111003', '2026-01-14 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333013', '2026-03-02', '2026-03-30', NULL, 'Desarrollo del portal corporativo de gestión de activos TechAsset.', NULL, 'Activo', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111002', '2026-03-02 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333014', '2026-03-04', '2026-04-02', NULL, 'Integración continua y arquitectura frontend React/TypeScript.', NULL, 'Activo', '11111111-1111-1111-1111-111111111005', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111003', '2026-03-04 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333015', '2026-03-05', '2026-04-10', NULL, 'Servidor local de inferencia y análisis estadístico en Ciencia de Datos.', NULL, 'Activo', '11111111-1111-1111-1111-111111111006', '22222222-2222-2222-2222-222222222007', '11111111-1111-1111-1111-111111111002', '2026-03-05 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333016', '2026-03-03', '2026-03-30', NULL, 'Monitor auxiliar 4K asignado a líder técnico de Desarrollo de Software.', NULL, 'Activo', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222010', '11111111-1111-1111-1111-111111111002', '2026-03-03 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333017', '2026-03-06', '2026-03-25', NULL, 'Certificación funcional multi-dispositivo del release 2026.1.', NULL, 'Activo', '11111111-1111-1111-1111-111111111007', '22222222-2222-2222-2222-222222222017', '11111111-1111-1111-1111-111111111003', '2026-03-06 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333018', '2026-03-01', '2026-03-28', NULL, 'Segmentación de VLANs en laboratorio de contingencia de red.', NULL, 'Activo', '11111111-1111-1111-1111-111111111003', '22222222-2222-2222-2222-222222222022', '11111111-1111-1111-1111-111111111001', '2026-03-01 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333019', '2026-03-12', '2026-03-26', NULL, 'Solicitud de laptop adicional para pruebas de carga y estrés del módulo de préstamos.', NULL, 'Pendiente', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222003', NULL, '2026-03-07 04:00:00-05');
INSERT INTO public.prestamos ("Id", "FechaPrestamo", "FechaDevolucion", "FechaDevolucionReal", "Observacion", "ObservacionDevolucion", "EstadoPrestamo", "UsuarioId", "EquipoId", "ResponsableId", "FechaRegistro") VALUES ('33333333-3333-3333-3333-333333333020', '2026-03-13', '2026-03-27', NULL, 'Solicitud de equipo portátil para validación funcional en entorno de preproducción.', NULL, 'Pendiente', '11111111-1111-1111-1111-111111111007', '22222222-2222-2222-2222-222222222004', NULL, '2026-03-08 04:00:00-05');

-- =============================================================================
-- 8. DATOS SEMILLA: 44 MOVIMIENTOS DE INVENTARIO (Bitácora de Auditoría RF-17)
-- =============================================================================
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('027dd513-24fa-4bdd-89fd-386718ebc80f', '2026-01-10 10:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222006', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-LAP-006 (ThinkPad X1 Carbon Gen 11).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('02962388-0aaf-4273-8c5d-7ee57d67b544', '2026-02-19 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222003', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Devolución registrada (Alejandro Torres Mejía): Devolución verificada por soporte técnico sin incidencias.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('0b75ace4-04ae-447b-8cd1-66d281dab5a5', '2026-02-01 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222002', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111005', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Devolución registrada (Valeria Castillo Ríos): Devuelto en perfecto estado estético y operativo con adaptador MagSafe 3.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('1bc609a0-fec0-46d5-98b6-afb8206049d4', '2026-01-29 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222001', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Devolución registrada (Alejandro Torres Mejía): Equipo devuelto con cargador original USB-C de 65W sin daños.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('1c37ac45-e5f1-46e4-a1f0-77a5debf1885', '2026-01-10 09:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222005', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-LAP-005 (XPS 15 9530 OLED i9 32GB).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('271caf9b-ebb4-4231-a95b-f1f47cc40867', '2026-03-04 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222003', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111006', '11111111-1111-1111-1111-111111111003', 'Ciencia de Datos e IA', 'Devolución registrada (Diego Flores Cáceres): Equipo operativo, disco formateado según protocolo de seguridad.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('2a9814fb-312a-4c43-9c97-5811996c39ac', '2026-02-15 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222004', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111007', '11111111-1111-1111-1111-111111111002', 'Aseguramiento de Calidad QA', 'Entrega en préstamo a Gabriela Pereyra Lozano: Ejecución de suite automatizada Playwright y pruebas E2E.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('2abcddea-8fb0-49c9-8192-4e6ddad281fe', '2026-01-23 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222019', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111008', '11111111-1111-1111-1111-111111111003', 'Finanzas y Contabilidad', 'Devolución registrada (Jorge Paredes Alarcón): Equipo devuelto; batería degradada al 40%, se procede a baja lógica.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('2caa6d94-c674-4625-adeb-973681b0d53a', '2026-01-24 13:00:00-05', 'BajaLogica', '22222222-2222-2222-2222-222222222019', 'Disponible', 'Baja', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'RN-06: Baja lógica aplicada por desgaste severo de batería conservando trazabilidad histórica.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('2d887a73-0d3d-45e1-9119-a8dc1e28c368', '2026-02-26 06:30:00-05', 'CambioEstado', '22222222-2222-2222-2222-222222222015', 'Disponible', 'Mantenimiento', NULL, '11111111-1111-1111-1111-111111111002', 'Infraestructura y Soporte', 'Limpieza de cabezales de impresión y calibración de inyectores Epson.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('3576fd80-e119-470e-a1d0-a060e82a8fe9', '2026-03-06 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222017', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111007', '11111111-1111-1111-1111-111111111003', 'Aseguramiento de Calidad QA', 'Entrega en préstamo a Gabriela Pereyra Lozano: Certificación funcional multi-dispositivo del release 2026.1.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('39034b7c-6ac9-4405-a895-7445f3503ff6', '2026-03-01 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222022', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111003', '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Entrega en préstamo a Marco Rodríguez Vargas: Segmentación de VLANs en laboratorio de contingencia de red.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('3bf0f3eb-df96-4cd6-8541-ef3b357bd050', '2026-01-10 05:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222001', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-LAP-001 (ThinkPad T14 Gen 4 i7 32GB).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('44833a60-7e98-4a7c-9631-fc89d5e8c5aa', '2026-01-12 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222009', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111009', '11111111-1111-1111-1111-111111111001', 'Operaciones y Proyectos', 'Entrega en préstamo a Renato Vásquez Espinoza: Estación temporal de coordinación de operaciones.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('45c2e060-752a-494c-a84b-09427d3b6c7f', '2026-01-27 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222009', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111009', '11111111-1111-1111-1111-111111111001', 'Operaciones y Proyectos', 'Devolución registrada (Renato Vásquez Espinoza): Devuelto al finalizar contrato; equipo programado para baja por obsolescencia.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('5ae91986-d10c-4407-8c74-44df759262ce', '2026-03-03 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222010', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Entrega en préstamo a Alejandro Torres Mejía: Monitor auxiliar 4K asignado a líder técnico de Desarrollo de Software.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('74caa167-26f0-4ce4-aa1b-0fe5b3b53deb', '2026-01-10 08:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222004', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-LAP-004 (EliteBook 840 G10 Ryzen 7).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('80cf81a6-d7f3-4ea4-a35b-97e5a50779f2', '2026-01-14 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222019', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111008', '11111111-1111-1111-1111-111111111003', 'Finanzas y Contabilidad', 'Entrega en préstamo a Jorge Paredes Alarcón: Toma de inventario físico de activos fijos en sede central.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('80e5d8fb-ab17-458a-adc7-9aeeef869362', '2026-02-02 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222001', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111005', '11111111-1111-1111-1111-111111111003', 'Desarrollo de Software', 'Entrega en préstamo a Valeria Castillo Ríos: Despliegue de entorno Docker local y pruebas de integración.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('80f9e110-59e3-434d-9d79-eae7d400859d', '2026-02-17 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222001', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111005', '11111111-1111-1111-1111-111111111003', 'Desarrollo de Software', 'Devolución registrada (Valeria Castillo Ríos): Recepción conforme; se realizó limpieza preventiva de teclado.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('8300ce93-2510-4166-97aa-bc28be61f4ba', '2026-02-27 10:00:00-05', 'CambioEstado', '22222222-2222-2222-2222-222222222021', 'Disponible', 'Mantenimiento', NULL, '11111111-1111-1111-1111-111111111003', 'Infraestructura y Soporte', 'Sustitución de lámpara óptica y filtro de aire en proyector BenQ.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('85967fb3-177c-43a2-a89e-09dec8eb30dd', '2026-01-10 13:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222009', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-PC-003 (ThinkCentre M90q Tiny i7).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('88177d3c-d53d-4471-91ab-8d2c15d1ada1', '2026-03-04 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222002', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111005', '11111111-1111-1111-1111-111111111003', 'Desarrollo de Software', 'Entrega en préstamo a Valeria Castillo Ríos: Integración continua y arquitectura frontend React/TypeScript.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('8a6564b5-0b16-4906-9ebd-f37b12ed7c57', '2026-01-10 07:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222003', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-LAP-003 (Latitude 5540 Core i7 16GB).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('8f9da15f-e172-4bfa-b0a2-d96205712183', '2026-03-02 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222001', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Entrega en préstamo a Alejandro Torres Mejía: Desarrollo del portal corporativo de gestión de activos TechAsset.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('908e40bb-9f91-49eb-9447-7ef83ec70ff6', '2026-02-25 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222005', 'Prestado', 'Mantenimiento', '11111111-1111-1111-1111-111111111006', '11111111-1111-1111-1111-111111111003', 'Ciencia de Datos e IA', 'Devolución registrada (Diego Flores Cáceres): Se reporta calentamiento en ventilador derecho; pasa a Mantenimiento preventivo.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('955f8a19-7cb6-4d87-b15a-73cee355e380', '2026-02-05 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222003', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Entrega en préstamo a Alejandro Torres Mejía: Pruebas de rendimiento en cliente bancario.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('993ede42-128e-47e7-bdcf-b0a25f9e3691', '2026-01-25 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222017', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111007', '11111111-1111-1111-1111-111111111003', 'Aseguramiento de Calidad QA', 'Entrega en préstamo a Gabriela Pereyra Lozano: Validación de diseño responsivo y accesibilidad en Safari iPadOS.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('b0a03fac-464f-458a-ae2c-cafe09e9a592', '2026-01-20 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222010', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Entrega en préstamo a Alejandro Torres Mejía: Segundo monitor para estación de arquitectura de software.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('b1e10869-92c8-4e3b-a68f-0d1c4b43a6b6', '2026-01-28 12:15:00-05', 'BajaLogica', '22222222-2222-2222-2222-222222222009', 'Disponible', 'Baja', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'RN-06: Baja lógica aplicada tras cumplir vida útil contable conservando historial de préstamos.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('bb8e2e23-5ad0-49b9-a272-fa6828219bee', '2026-03-05 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222007', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111006', '11111111-1111-1111-1111-111111111002', 'Ciencia de Datos e IA', 'Entrega en préstamo a Diego Flores Cáceres: Servidor local de inferencia y análisis estadístico en Ciencia de Datos.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('bd47282c-b701-42a2-99cb-69abae9b9747', '2026-02-12 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222005', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111006', '11111111-1111-1111-1111-111111111003', 'Ciencia de Datos e IA', 'Entrega en préstamo a Diego Flores Cáceres: Procesamiento de pipeline ETL y visualización analítica.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('c4260d46-d1b6-4cd9-989f-55cc531247fa', '2026-01-10 14:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222010', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-MON-001 (UltraSharp 27 4K USB-C Hub U2723QE).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('c44cb001-a9fa-4e90-a8eb-551e4b28abfd', '2026-02-22 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222003', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111006', '11111111-1111-1111-1111-111111111003', 'Ciencia de Datos e IA', 'Entrega en préstamo a Diego Flores Cáceres: Entrenamiento de modelo predictivo de rotación de clientes.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('c4889f48-352e-4187-86bf-21c0f05722c6', '2026-01-10 06:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222002', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-LAP-002 (MacBook Pro 14 M3 Pro 18GB).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('ca73313f-3cbe-48f8-9afe-e28aa02aa4d3', '2026-02-28 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222004', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111007', '11111111-1111-1111-1111-111111111002', 'Aseguramiento de Calidad QA', 'Devolución registrada (Gabriela Pereyra Lozano): Equipo verificado y reincorporado al stock disponible.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('ce5bf0d4-fc2b-4fb4-8824-6c17bcda43cc', '2026-02-07 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222017', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111007', '11111111-1111-1111-1111-111111111003', 'Aseguramiento de Calidad QA', 'Devolución registrada (Gabriela Pereyra Lozano): Pantalla impecable y Apple Pencil con carga al 100%.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('e29c9b8b-7cd2-42a0-bfc6-a92a0f4b4c6c', '2026-01-18 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222002', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111005', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Entrega en préstamo a Valeria Castillo Ríos: Compilación de aplicaciones móviles iOS y Android corporativas.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('ead2a3de-c957-4f97-befa-21910345a6fd', '2026-02-09 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222010', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Devolución registrada (Alejandro Torres Mejía): Panel IPS sin píxeles muertos, incluye cable USB-C y DisplayPort.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('ebbc1db4-a149-4db7-9fb2-6914373348e7', '2026-01-10 11:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222007', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-PC-001 (OptiPlex 7010 Tower i7).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('f0924615-7927-4eb8-99be-b3198015fc58', '2026-01-10 12:00:00-05', 'AltaEquipo', '22222222-2222-2222-2222-222222222008', 'Nuevo', 'Disponible', NULL, '11111111-1111-1111-1111-111111111001', 'Infraestructura y Soporte', 'Alta patrimonial inicial del activo INV-PC-002 (ProDesk 400 G9 SFF i5).');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('f22a0cef-e267-40b0-81de-a62295bb1f9c', '2026-01-15 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222001', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111004', '11111111-1111-1111-1111-111111111002', 'Desarrollo de Software', 'Entrega en préstamo a Alejandro Torres Mejía: Asignación para sprint de microservicios de facturación.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('f5b28e7a-f331-4ed1-8fef-564397209b36', '2026-02-13 11:40:00-05', 'Devolucion', '22222222-2222-2222-2222-222222222020', 'Prestado', 'Disponible', '11111111-1111-1111-1111-111111111008', '11111111-1111-1111-1111-111111111002', 'Finanzas y Contabilidad', 'Devolución registrada (Jorge Paredes Alarcón): Proyector devuelto con control remoto, cable HDMI y maletín acolchado.');
INSERT INTO public.movimientos_inventario ("Id", "Fecha", "TipoMovimiento", "EquipoId", "EstadoAnterior", "EstadoNuevo", "UsuarioId", "ResponsableId", "Area", "Observacion") VALUES ('ffc65e47-756b-4836-b4b4-8a1b6b73d7e6', '2026-02-10 05:15:00-05', 'Prestamo', '22222222-2222-2222-2222-222222222020', 'Disponible', 'Prestado', '11111111-1111-1111-1111-111111111008', '11111111-1111-1111-1111-111111111002', 'Finanzas y Contabilidad', 'Entrega en préstamo a Jorge Paredes Alarcón: Sustentación de presupuesto trimestral ante directorio.');
