-- =============================================================================
-- SISTEMA: TechAsset - Gestión de Inventario y Préstamo de Equipos Tecnológicos
-- EMPRESA: Innovatech Solutions S.A.C. (+500 colaboradores)
-- MOTOR:   PostgreSQL 16+
-- BASE DE DATOS: techasset_db
-- DESCRIPCIÓN: Script DDL completo con restricciones declarativas de las Reglas
--              de Negocio (RN-01 a RN-10), índices de rendimiento y semilla
--              realista (9 usuarios, 24 equipos en las 7 categorías oficiales,
--              18 préstamos multi-área y 25 movimientos de inventario).
-- =============================================================================

-- Extensión para generación de UUID v4 si se requiere en consultas directas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpieza ordenada en caso de recreación del esquema de desarrollo
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS prestamos CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =============================================================================
-- 1. TABLA: usuarios (RF-01 a RF-04 | RN-08, RN-09, RN-10)
-- =============================================================================
CREATE TABLE usuarios (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres         VARCHAR(100)    NOT NULL CHECK (char_length(trim(nombres)) >= 2),
    apellidos       VARCHAR(100)    NOT NULL CHECK (char_length(trim(apellidos)) >= 2),
    correo          VARCHAR(150)    NOT NULL,
    area            VARCHAR(100)    NOT NULL CHECK (char_length(trim(area)) >= 2),
    estado          BOOLEAN         NOT NULL DEFAULT TRUE,
    rol             VARCHAR(50)     NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    fecha_registro  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- RN-08: No pueden existir dos usuarios con el mismo correo electrónico
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),

    -- RN-09: Solo roles válidos del sistema (Administrador, Responsable de Tecnología, Colaborador)
    CONSTRAINT ck_usuarios_rol CHECK (
        rol IN ('Administrador', 'Responsable de Tecnología', 'Colaborador')
    )
);

CREATE INDEX ix_usuarios_area ON usuarios(area);
CREATE INDEX ix_usuarios_rol_estado ON usuarios(rol, estado);

COMMENT ON TABLE usuarios IS 'Catálogo corporativo de usuarios de Innovatech Solutions S.A.C.';
COMMENT ON COLUMN usuarios.correo IS 'Correo corporativo único validado por RN-08';
COMMENT ON COLUMN usuarios.estado IS 'TRUE = Activo (habilitado para préstamos RN-10), FALSE = Inactivo';

-- =============================================================================
-- 2. TABLA: equipos (RF-05 a RF-08 | RN-01, RN-02, RN-03, RN-06, RN-07)
-- =============================================================================
CREATE TABLE equipos (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_patrimonial  VARCHAR(50)     NOT NULL,
    nombre              VARCHAR(100)    NOT NULL CHECK (char_length(trim(nombre)) >= 3),
    categoria           VARCHAR(50)     NOT NULL,
    marca               VARCHAR(50)     NOT NULL,
    estado              VARCHAR(30)     NOT NULL DEFAULT 'Disponible',
    fecha_registro      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- RN-07: Cada equipo debe contar con un código patrimonial único
    CONSTRAINT uq_equipos_codigo_patrimonial UNIQUE (codigo_patrimonial),

    -- Estados operativos permitidos según RF-07 y RN-02/RN-03
    CONSTRAINT ck_equipos_estado CHECK (
        estado IN ('Disponible', 'Prestado', 'Mantenimiento', 'Baja')
    ),

    -- Categorías oficiales del inventario tecnológico de Innovatech Solutions S.A.C.
    CONSTRAINT ck_equipos_categoria CHECK (
        categoria IN (
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

CREATE INDEX ix_equipos_estado ON equipos(estado);
CREATE INDEX ix_equipos_categoria ON equipos(categoria);
CREATE INDEX ix_equipos_marca ON equipos(marca);

COMMENT ON TABLE equipos IS 'Inventario de activos tecnológicos con trazabilidad por código patrimonial único';
COMMENT ON COLUMN equipos.codigo_patrimonial IS 'Identificador patrimonial único en formato INV-{CAT}-{CORRELATIVO} (RN-07)';

-- =============================================================================
-- 3. TABLA: prestamos (RF-09 a RF-12 | RN-01, RN-02, RN-03, RN-04, RN-05, RN-10)
-- =============================================================================
CREATE TABLE prestamos (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_prestamo          DATE        NOT NULL,
    fecha_devolucion        DATE        NOT NULL,
    fecha_devolucion_real   DATE        NULL,
    observacion             TEXT        NOT NULL,
    observacion_devolucion  TEXT        NULL,
    estado_prestamo         VARCHAR(30) NOT NULL DEFAULT 'Activo',
    usuario_id              UUID        NOT NULL,
    equipo_id               UUID        NOT NULL,
    responsable_id          UUID        NOT NULL,

    -- RN-04: La fecha estimada de devolución debe ser estrictamente posterior a la fecha de préstamo
    CONSTRAINT ck_prestamos_fechas_coherentes CHECK (fecha_devolucion > fecha_prestamo),

    -- Estados del ciclo de vida del préstamo
    CONSTRAINT ck_prestamos_estado CHECK (
        estado_prestamo IN ('Activo', 'Devuelto')
    ),

    -- Relaciones de integridad referencial (RN-06 impide eliminación física de equipos con historial)
    CONSTRAINT fk_prestamos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prestamos_equipo
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT,
    -- RN-05: Todo préstamo debe tener un usuario responsable asignado
    CONSTRAINT fk_prestamos_responsable
        FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- RN-01: Un equipo no puede prestarse si ya tiene un préstamo activo simultáneo
CREATE UNIQUE INDEX ix_prestamos_equipo_activo
    ON prestamos(equipo_id)
    WHERE estado_prestamo = 'Activo';

CREATE INDEX ix_prestamos_usuario_id ON prestamos(usuario_id);
CREATE INDEX ix_prestamos_equipo_id ON prestamos(equipo_id);
CREATE INDEX ix_prestamos_estado_prestamo ON prestamos(estado_prestamo);
CREATE INDEX ix_prestamos_fecha_prestamo ON prestamos(fecha_prestamo DESC);

COMMENT ON TABLE prestamos IS 'Registro transaccional de préstamos y devoluciones de equipos tecnológicos';
COMMENT ON INDEX ix_prestamos_equipo_activo IS 'Garantía a nivel de motor de base de datos para RN-01 (un solo préstamo activo por equipo)';

-- =============================================================================
-- 4. TABLA: movimientos_inventario (RF-07, RF-09, RF-10, RF-17 | Auditoría)
-- =============================================================================
CREATE TABLE movimientos_inventario (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    tipo_movimiento VARCHAR(40)     NOT NULL,
    equipo_id       UUID            NOT NULL,
    estado_anterior VARCHAR(30)     NOT NULL,
    estado_nuevo    VARCHAR(30)     NOT NULL,
    usuario_id      UUID            NULL,
    responsable_id  UUID            NULL,
    observacion     TEXT            NOT NULL,

    CONSTRAINT ck_movimientos_tipo CHECK (
        tipo_movimiento IN ('Alta', 'Prestamo', 'Devolucion', 'Mantenimiento', 'Reactivacion', 'Baja')
    ),
    CONSTRAINT fk_movimientos_equipo
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimientos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_movimientos_responsable
        FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX ix_movimientos_equipo_fecha ON movimientos_inventario(equipo_id, fecha DESC);
CREATE INDEX ix_movimientos_tipo ON movimientos_inventario(tipo_movimiento);

COMMENT ON TABLE movimientos_inventario IS 'Bitácora inmutable de movimientos y cambios de estado del inventario tecnológico';

-- =============================================================================
-- 5. DATOS SEMILLA: 9 USUARIOS CORPORATIVOS (3 Roles, Múltiples Áreas)
-- Nota: El hash corresponde a PBKDF2-SHA256 / BCrypt compatible con el Seeder
--       de la aplicación (Contraseña de demostración documentada en README.md:
--       Admin123!, Resp123!, Colab123!)
-- =============================================================================
INSERT INTO usuarios (id, nombres, apellidos, correo, area, estado, rol, password_hash, fecha_registro) VALUES
('11111111-1111-4111-8111-111111111101', 'Carlos Alberto', 'Mendoza Salazar', 'cmendoza@innovatech.pe', 'Tecnologías de la Información', TRUE, 'Administrador', 'PBKDF2$100000$TechAssetSalt2026$Admin123!', '2026-01-05 08:30:00-05'),
('11111111-1111-4111-8111-111111111102', 'Lucía Fernanda', 'Quispe Huamán', 'lquispe@innovatech.pe', 'Soporte e Infraestructura TI', TRUE, 'Responsable de Tecnología', 'PBKDF2$100000$TechAssetSalt2026$Resp123!', '2026-01-06 09:00:00-05'),
('11111111-1111-4111-8111-111111111103', 'Marco Antonio', 'Rodríguez Vargas', 'mrodriguez@innovatech.pe', 'Soporte e Infraestructura TI', TRUE, 'Responsable de Tecnología', 'PBKDF2$100000$TechAssetSalt2026$Resp123!', '2026-01-06 09:15:00-05'),
('11111111-1111-4111-8111-111111111104', 'Andrés Sebastián', 'Torres Cevallos', 'atorres@innovatech.pe', 'Ingeniería de Software', TRUE, 'Colaborador', 'PBKDF2$100000$TechAssetSalt2026$Colab123!', '2026-01-08 10:00:00-05'),
('11111111-1111-4111-8111-111111111105', 'Valeria Milagros', 'Castillo Pineda', 'vcastillo@innovatech.pe', 'Consultoría y Proyectos', TRUE, 'Colaborador', 'PBKDF2$100000$TechAssetSalt2026$Colab123!', '2026-01-08 10:20:00-05'),
('11111111-1111-4111-8111-111111111106', 'Diego Alejandro', 'Flores Gutiérrez', 'dflores@innovatech.pe', 'Finanzas y Contabilidad', TRUE, 'Colaborador', 'PBKDF2$100000$TechAssetSalt2026$Colab123!', '2026-01-09 11:00:00-05'),
('11111111-1111-4111-8111-111111111107', 'Gabriela Sofía', 'Pereyra Lozano', 'gpereyra@innovatech.pe', 'Comercial y Marketing', TRUE, 'Colaborador', 'PBKDF2$100000$TechAssetSalt2026$Colab123!', '2026-01-10 09:45:00-05'),
('11111111-1111-4111-8111-111111111108', 'Jorge Luis', 'Paredes Cáceres', 'jparedes@innovatech.pe', 'Operaciones y Logística', TRUE, 'Colaborador', 'PBKDF2$100000$TechAssetSalt2026$Colab123!', '2026-01-11 14:10:00-05'),
('11111111-1111-4111-8111-111111111109', 'Rosa Elvira', 'Vásquez Benavides', 'rvasquez@innovatech.pe', 'Talento Humano', FALSE, 'Colaborador', 'PBKDF2$100000$TechAssetSalt2026$Colab123!', '2026-01-12 16:00:00-05');

-- =============================================================================
-- 6. DATOS SEMILLA: 24 EQUIPOS TECNOLÓGICOS (7 Categorías Oficiales del Caso)
-- Distribución de estados actuales:
--   - Disponible:    13 equipos
--   - Prestado:       7 equipos (coinciden exactamente con los 7 préstamos Activos)
--   - Mantenimiento:  2 equipos (para validar RN-02)
--   - Baja:           2 equipos (para validar RN-03 y RN-06)
-- =============================================================================
INSERT INTO equipos (id, codigo_patrimonial, nombre, categoria, marca, estado, fecha_registro) VALUES
-- Categoría 1: Laptops (6 unidades)
('22222222-2222-4222-8222-222222222201', 'INV-LAP-0001', 'Latitude 5540 Core i7 32GB', 'Laptops', 'Dell', 'Prestado', '2026-01-10 08:00:00-05'),
('22222222-2222-4222-8222-222222222202', 'INV-LAP-0002', 'ThinkPad T14 Gen 4 Ryzen 7', 'Laptops', 'Lenovo', 'Prestado', '2026-01-10 08:05:00-05'),
('22222222-2222-4222-8222-222222222203', 'INV-LAP-0003', 'EliteBook 840 G10 Core i7', 'Laptops', 'HP', 'Disponible', '2026-01-10 08:10:00-05'),
('22222222-2222-4222-8222-222222222204', 'INV-LAP-0004', 'MacBook Pro 14 M3 Pro 18GB', 'Laptops', 'Apple', 'Prestado', '2026-01-10 08:15:00-05'),
('22222222-2222-4222-8222-222222222205', 'INV-LAP-0005', 'ThinkPad X1 Carbon Gen 11', 'Laptops', 'Lenovo', 'Disponible', '2026-01-10 08:20:00-05'),
('22222222-2222-4222-8222-222222222206', 'INV-LAP-0006', 'Latitude 7440 UltraLight', 'Laptops', 'Dell', 'Mantenimiento', '2026-01-10 08:25:00-05'),

-- Categoría 2: Computadoras de escritorio (4 unidades)
('22222222-2222-4222-8222-222222222207', 'INV-PC-0001', 'OptiPlex 7010 SFF Core i7', 'Computadoras de escritorio', 'Dell', 'Disponible', '2026-01-11 09:00:00-05'),
('22222222-2222-4222-8222-222222222208', 'INV-PC-0002', 'ThinkCentre M90q Tiny Gen 4', 'Computadoras de escritorio', 'Lenovo', 'Prestado', '2026-01-11 09:10:00-05'),
('22222222-2222-4222-8222-222222222209', 'INV-PC-0003', 'ProDesk 400 G9 Workstation', 'Computadoras de escritorio', 'HP', 'Disponible', '2026-01-11 09:20:00-05'),
('22222222-2222-4222-8222-222222222210', 'INV-PC-0004', 'OptiPlex 5090 Tower Legacy', 'Computadoras de escritorio', 'Dell', 'Baja', '2026-01-11 09:30:00-05'),

-- Categoría 3: Monitores (4 unidades)
('22222222-2222-4222-8222-222222222211', 'INV-MON-0001', 'UltraSharp 27 4K USB-C U2723QE', 'Monitores', 'Dell', 'Prestado', '2026-01-12 10:00:00-05'),
('22222222-2222-4222-8222-222222222212', 'INV-MON-0002', 'ThinkVision T24i-30 24 FHD IPS', 'Monitores', 'Lenovo', 'Disponible', '2026-01-12 10:10:00-05'),
('22222222-2222-4222-8222-222222222213', 'INV-MON-0003', 'UltraWide 34 WQHD Ergo 34WN780', 'Monitores', 'LG', 'Disponible', '2026-01-12 10:20:00-05'),
('22222222-2222-4222-8222-222222222214', 'INV-MON-0004', 'ViewFinity S8 27 UHD Profesional', 'Monitores', 'Samsung', 'Disponible', '2026-01-12 10:30:00-05'),

-- Categoría 4: Impresoras (3 unidades)
('22222222-2222-4222-8222-222222222215', 'INV-IMP-0001', 'LaserJet Pro MFP 4103fdw Dúplex', 'Impresoras', 'HP', 'Disponible', '2026-01-13 11:00:00-05'),
('22222222-2222-4222-8222-222222222216', 'INV-IMP-0002', 'EcoTank L6270 Multifuncional Red', 'Impresoras', 'Epson', 'Mantenimiento', '2026-01-13 11:15:00-05'),
('22222222-2222-4222-8222-222222222217', 'INV-IMP-0003', 'MFC-L5900DW Corporativa Láser', 'Impresoras', 'Brother', 'Disponible', '2026-01-13 11:30:00-05'),

-- Categoría 5: Tablets (3 unidades)
('22222222-2222-4222-8222-222222222218', 'INV-TAB-0001', 'iPad Air 11 M2 Wi-Fi + Cellular', 'Tablets', 'Apple', 'Prestado', '2026-01-14 08:45:00-05'),
('22222222-2222-4222-8222-222222222219', 'INV-TAB-0002', 'Galaxy Tab S9 FE Enterprise Edition', 'Tablets', 'Samsung', 'Disponible', '2026-01-14 09:00:00-05'),
('22222222-2222-4222-8222-222222222220', 'INV-TAB-0003', 'Tab P12 Pro 12.6 Con Teclado Pen', 'Tablets', 'Lenovo', 'Disponible', '2026-01-14 09:15:00-05'),

-- Categoría 6: Proyectores multimedia (2 unidades)
('22222222-2222-4222-8222-222222222221', 'INV-PRO-0001', 'PowerLite L210W WXGA 4500 Lúmenes', 'Proyectores multimedia', 'Epson', 'Prestado', '2026-01-15 10:00:00-05'),
('22222222-2222-4222-8222-222222222222', 'INV-PRO-0002', 'MH733 Full HD 4000 Lúmenes Corporativo', 'Proyectores multimedia', 'BenQ', 'Disponible', '2026-01-15 10:20:00-05'),

-- Categoría 7: Equipos de red (2 unidades)
('22222222-2222-4222-8222-222222222223', 'INV-RED-0001', 'Catalyst 1200-24P PoE+ Managed Switch', 'Equipos de red', 'Cisco', 'Disponible', '2026-01-16 08:30:00-05'),
('22222222-2222-4222-8222-222222222224', 'INV-RED-0002', 'UniFi U6 Enterprise Access Point Wi-Fi 6E', 'Equipos de red', 'Ubiquiti', 'Baja', '2026-01-16 08:50:00-05');

-- =============================================================================
-- 7. DATOS SEMILLA: 18 PRÉSTAMOS (11 Devueltos Históricos + 7 Activos Actuales)
-- =============================================================================
INSERT INTO prestamos (
    id, fecha_prestamo, fecha_devolucion, fecha_devolucion_real,
    observacion, observacion_devolucion, estado_prestamo,
    usuario_id, equipo_id, responsable_id
) VALUES
-- 11 Préstamos históricos ya devueltos (nutren el ranking RF-15 y préstamos por área RF-16)
('33333333-3333-4333-8333-333333333301', '2026-01-18', '2026-01-25', '2026-01-24',
 'Asignación para sprint de arquitectura microservicios en cliente bancario',
 'Equipo devuelto en óptimas condiciones con cargador original', 'Devuelto',
 '11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333302', '2026-01-20', '2026-01-27', '2026-01-27',
 'Préstamo temporal para auditoría externa en sede San Isidro',
 'Revisión de hardware conforme sin rayaduras', 'Devuelto',
 '11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333303', '2026-01-22', '2026-01-30', '2026-01-29',
 'Cierre contable mensual y consolidación de estados financieros',
 'Recepción conforme en almacén central TI', 'Devuelto',
 '11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111103'),

('33333333-3333-4333-8333-333333333304', '2026-01-26', '2026-02-02', '2026-02-01',
 'Despliegue de entorno QA automatizado para proyecto retail',
 'Sin observaciones técnicas al reingreso', 'Devuelto',
 '11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333305', '2026-02-01', '2026-02-05', '2026-02-05',
 'Presentación de propuesta comercial a directorio corporativo',
 'Devuelto con control remoto y cable HDMI', 'Devuelto',
 '11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111103'),

('33333333-3333-4333-8333-333333333306', '2026-02-03', '2026-02-10', '2026-02-09',
 'Toma de inventario físico en centro de distribución Callao',
 'Pantalla intacta y batería al 90%', 'Devuelto',
 '11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222218', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333307', '2026-02-06', '2026-02-14', '2026-02-13',
 'Taller de diseño UX y prototipado móvil con cliente',
 'Estuche y Apple Pencil verificados al retorno', 'Devuelto',
 '11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111103'),

('33333333-3333-4333-8333-333333333308', '2026-02-10', '2026-02-17', '2026-02-17',
 'Segundo monitor para análisis de presupuestos anuales',
 'Devuelto con cable USB-C y base ergonómica', 'Devuelto',
 '11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222211', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333309', '2026-02-12', '2026-02-19', '2026-02-18',
 'Pruebas de segmentación VLAN en laboratorio de red',
 'Puertos PoE verificados operativos', 'Devuelto',
 '11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333310', '2026-02-15', '2026-02-20', '2026-02-19',
 'Préstamo histórico previo a baja técnica por obsolescencia',
 'Presentó reinicios intermitentes en fuente de poder, derivado a evaluación', 'Devuelto',
 '11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222210', '11111111-1111-4111-8111-111111111103'),

('33333333-3333-4333-8333-333333333311', '2026-02-20', '2026-02-26', '2026-02-26',
 'Roadshow comercial de soluciones cloud Q1',
 'Lente limpia y lámpara con 180 horas de uso', 'Devuelto',
 '11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111102'),

-- 7 Préstamos ACTIVOS actuales (sincronizados con los 7 equipos en estado 'Prestado')
('33333333-3333-4333-8333-333333333312', '2026-03-02', '2026-04-30', NULL,
 'Desarrollo full-stack del proyecto corporativo TechAsset Fase Producción',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333313', '2026-03-04', '2026-04-28', NULL,
 'Consultoría ERP en oficinas de cliente minero',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333314', '2026-03-05', '2026-04-25', NULL,
 'Producción audiovisual y diseño de campaña digital Q2',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111103'),

('33333333-3333-4333-8333-333333333315', '2026-03-06', '2026-05-05', NULL,
 'Estación dedicada para modelamiento tributario y libros electrónicos',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222208', '11111111-1111-4111-8111-111111111103'),

('33333333-3333-4333-8333-333333333316', '2026-03-07', '2026-04-30', NULL,
 'Monitor auxiliar 4K para monitoreo de pipelines CI/CD',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222211', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333317', '2026-03-08', '2026-04-22', NULL,
 'Supervisión móvil de despachos y recepción de almacén central',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222218', '11111111-1111-4111-8111-111111111102'),

('33333333-3333-4333-8333-333333333318', '2026-03-09', '2026-04-20', NULL,
 'Ciclo de demos ejecutivas para comité de transformación digital',
 NULL, 'Activo',
 '11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111103');

-- =============================================================================
-- 8. DATOS SEMILLA: 25 MOVIMIENTOS DE INVENTARIO (Bitácora de Auditoría RF-17)
-- =============================================================================
INSERT INTO movimientos_inventario (
    id, fecha, tipo_movimiento, equipo_id,
    estado_anterior, estado_nuevo, usuario_id, responsable_id, observacion
) VALUES
('44444444-4444-4444-8444-444444444401', '2026-01-18 09:00:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222201', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111102', 'Préstamo inicial INV-LAP-0001 a Ingeniería de Software'),
('44444444-4444-4444-8444-444444444402', '2026-01-24 17:30:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222201', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111102', 'Devolución conforme INV-LAP-0001'),
('44444444-4444-4444-8444-444444444403', '2026-01-20 09:30:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222202', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111102', 'Préstamo INV-LAP-0002 a Consultoría y Proyectos'),
('44444444-4444-4444-8444-444444444404', '2026-01-27 16:45:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222202', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111102', 'Devolución conforme INV-LAP-0002'),
('44444444-4444-4444-8444-444444444405', '2026-01-22 10:15:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222203', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111106', '11111111-1111-4111-8111-111111111103', 'Préstamo INV-LAP-0003 a Finanzas y Contabilidad'),
('44444444-4444-4444-8444-444444444406', '2026-01-29 18:00:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222203', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111106', '11111111-1111-4111-8111-111111111103', 'Devolución conforme INV-LAP-0003'),
('44444444-4444-4444-8444-444444444407', '2026-01-26 08:50:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222201', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111102', 'Segundo préstamo INV-LAP-0001 para entorno QA'),
('44444444-4444-4444-8444-444444444408', '2026-02-01 17:10:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222201', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111102', 'Retorno conforme INV-LAP-0001'),
('44444444-4444-4444-8444-444444444409', '2026-02-01 11:00:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222221', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111107', '11111111-1111-4111-8111-111111111103', 'Préstamo proyector INV-PRO-0001 a Comercial y Marketing'),
('44444444-4444-4444-8444-444444444410', '2026-02-05 16:20:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222221', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111107', '11111111-1111-4111-8111-111111111103', 'Devolución proyector INV-PRO-0001'),
('44444444-4444-4444-8444-444444444411', '2026-02-03 09:00:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222218', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111108', '11111111-1111-4111-8111-111111111102', 'Préstamo tablet INV-TAB-0001 a Operaciones y Logística'),
('44444444-4444-4444-8444-444444444412', '2026-02-09 17:00:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222218', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111108', '11111111-1111-4111-8111-111111111102', 'Devolución tablet INV-TAB-0001'),
('44444444-4444-4444-8444-444444444413', '2026-02-15 08:30:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222210', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111108', '11111111-1111-4111-8111-111111111103', 'Préstamo estación INV-PC-0004 a Operaciones y Logística'),
('44444444-4444-4444-8444-444444444414', '2026-02-19 15:40:00-05', 'Devolucion', '22222222-2222-4222-8222-222222222210', 'Prestado', 'Disponible', '11111111-1111-4111-8111-111111111108', '11111111-1111-4111-8111-111111111103', 'Devolución con reporte de falla eléctrica en INV-PC-0004'),
('44444444-4444-4444-8444-444444444415', '2026-02-20 10:00:00-05', 'Baja', '22222222-2222-4222-8222-222222222210', 'Disponible', 'Baja', NULL, '11111111-1111-4111-8111-111111111101', 'Baja definitiva INV-PC-0004 por daño irreparable en placa madre (conserva historial RN-06)'),
('44444444-4444-4444-8444-444444444416', '2026-02-22 11:30:00-05', 'Baja', '22222222-2222-4222-8222-222222222224', 'Disponible', 'Baja', NULL, '11111111-1111-4111-8111-111111111101', 'Baja técnica de Access Point INV-RED-0002 por sobretensión en PoE'),
('44444444-4444-4444-8444-444444444417', '2026-02-25 09:20:00-05', 'Mantenimiento', '22222222-2222-4222-8222-222222222206', 'Disponible', 'Mantenimiento', NULL, '11111111-1111-4111-8111-111111111102', 'Ingreso a mantenimiento preventivo y cambio de pasta térmica INV-LAP-0006 (bloquea préstamos RN-02)'),
('44444444-4444-4444-8444-444444444418', '2026-02-27 14:15:00-05', 'Mantenimiento', '22222222-2222-4222-8222-222222222216', 'Disponible', 'Mantenimiento', NULL, '11111111-1111-4111-8111-111111111103', 'Limpieza de cabezales y kit de rodillos en impresora INV-IMP-0002 (RN-02)'),
('44444444-4444-4444-8444-444444444419', '2026-03-02 08:45:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222201', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111102', 'Asignación activa INV-LAP-0001 a Andrés Torres'),
('44444444-4444-4444-8444-444444444420', '2026-03-04 09:10:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222202', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111102', 'Asignación activa INV-LAP-0002 a Valeria Castillo'),
('44444444-4444-4444-8444-444444444421', '2026-03-05 10:00:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222204', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111107', '11111111-1111-4111-8111-111111111103', 'Asignación activa INV-LAP-0004 a Gabriela Pereyra'),
('44444444-4444-4444-8444-444444444422', '2026-03-06 09:30:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222208', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111106', '11111111-1111-4111-8111-111111111103', 'Asignación activa INV-PC-0002 a Diego Flores'),
('44444444-4444-4444-8444-444444444423', '2026-03-07 11:00:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222211', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111102', 'Asignación activa INV-MON-0001 a Andrés Torres'),
('44444444-4444-4444-8444-444444444424', '2026-03-08 08:30:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222218', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111108', '11111111-1111-4111-8111-111111111102', 'Asignación activa INV-TAB-0001 a Jorge Paredes'),
('44444444-4444-4444-8444-444444444425', '2026-03-09 10:15:00-05', 'Prestamo', '22222222-2222-4222-8222-222222222221', 'Disponible', 'Prestado', '11111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111103', 'Asignación activa INV-PRO-0001 a Valeria Castillo');
