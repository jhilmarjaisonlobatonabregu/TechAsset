# 02. Estándares de Construcción de Software y Arquitectura del Sistema

**Sistema:** TechAsset — Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos  
**Organización:** Innovatech Solutions S.A.C.  
**Curso / Evaluación:** Construcción de Software — Caso Práctico Integral (Criterio 1)

---

## 1. Estándares de Codificación y Nomenclatura

Con el objetivo de garantizar mantenibilidad, legibilidad y consistencia entre el Backend (`.NET 8 / C# 12`) y el Frontend (`React 19 / TypeScript 5`), el equipo de desarrollo de **TechAsset** definió y aplicó el siguiente estándar obligatorio de nomenclatura:

### 1.1 Convenciones de Nombres por Capa Tecnológica

| Elemento de Software | Convención | Ejemplo en Backend (.NET 8) | Ejemplo en Frontend (React + TS) |
| :--- | :---: | :--- | :--- |
| **Clases, Entidades, Interfaces y Componentes React** | `PascalCase` | `Equipo`, `PrestamoService`, `IEquipoRepository` | `EquiposPage.tsx`, `DataTable.tsx`, `StatusBadge.tsx` |
| **Métodos en C# y Propiedades de Entidad/DTO** | `PascalCase` | `RegistrarPrestamoAsync()`, `CodigoPatrimonial` | — |
| **Funciones, Variables Locales y Propiedades JSON/TS** | `camelCase` | `equipoExistente`, `fechaActual` | `codigoPatrimonial`, `registrarDevolucion()` |
| **Custom Hooks de React** | `camelCase` con prefijo `use` | — | `useApi.ts`, `useFormValidation.ts` |
| **Constantes Globales y Variables de Entorno** | `UPPER_SNAKE_CASE` | `ROLES_AUTORIZADOS_INVENTARIO` | `VITE_API_URL`, `CATEGORIAS_OFICIALES` |
| **Tablas, Columnas e Índices en PostgreSQL** | `snake_case` | `movimientos_inventario`, `codigo_patrimonial`, `ix_prestamos_equipo_activo` | — |
| **Rutas de Endpoints REST** | `kebab-case` (plural) | `/api/equipos`, `/api/reportes/equipos-mas-utilizados` | — |

### 1.2 Reglas de Calidad de Código
1. **Tipado estricto y nulabilidad explícita:**
   - En C# se habilita `<Nullable>enable</Nullable>` en todos los proyectos `.csproj`.
   - En TypeScript se habilita `"strict": true` prohibiendo el uso del tipo `any`.
2. **Responsabilidad única por archivo:**
   - Cada entidad de dominio, DTO, servicio, controlador o componente UI reutilizable reside en su propio archivo fuente claramente identificado.
3. **Manejo uniforme de errores:**
   - Ningún controlador expone trazas de pila (`stack traces`) crudas. Se utiliza el patrón `Result<T>` en la capa de Aplicación junto con el `ExceptionHandlingMiddleware` que devuelve respuestas JSON estandarizadas con el código de regla de negocio (`RN-01` a `RN-10`).

---

## 2. Estructura de Carpetas del Proyecto

El repositorio aplica una separación limpia entre el servidor de aplicaciones (**Clean Architecture en 4 capas** + proyecto de pruebas) y el cliente web (**Arquitectura Modular Basada en Componentes**):

```text
TechAsset/
├── backend/
│   ├── TechAsset.sln
│   ├── src/
│   │   ├── TechAsset.Domain/                 # Capa 1: Núcleo de Dominio (Sin dependencias externas)
│   │   │   ├── Entities/                     # Usuario.cs, Equipo.cs, Prestamo.cs, MovimientoInventario.cs
│   │   │   ├── Enums/                        # RolUsuario.cs, EstadoEquipo.cs, EstadoPrestamo.cs
│   │   │   └── Common/                       # Result.cs, DomainException.cs
│   │   ├── TechAsset.Application/            # Capa 2: Casos de Uso y Reglas de Negocio
│   │   │   ├── DTOs/                         # Contratos de entrada/salida (Auth, Usuarios, Equipos, Prestamos, Reportes)
│   │   │   ├── Interfaces/                   # Contratos de repositorios y servicios
│   │   │   └── Services/                     # AuthService, UsuarioService, EquipoService, PrestamoService, ReporteService
│   │   ├── TechAsset.Infrastructure/         # Capa 3: Persistencia EF Core y Seguridad JWT
│   │   │   ├── Data/                         # TechAssetDbContext.cs, DbSeeder.cs
│   │   │   ├── Repositories/                 # Implementación de repositorios EF Core
│   │   │   └── Security/                     # JwtTokenGenerator.cs, PasswordHasher.cs
│   │   └── TechAsset.API/                    # Capa 4: Presentación HTTP REST
│   │       ├── Controllers/                  # AuthController, UsuariosController, EquiposController, PrestamosController, ReportesController
│   │       ├── Middleware/                   # ExceptionHandlingMiddleware.cs
│   │       └── Program.cs
│   └── tests/
│       └── TechAsset.Tests/                  # Suite de pruebas unitarias xUnit (RN-01 a RN-10 y servicios)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/                           # 13 componentes UI reutilizables (Button, DataTable, Modal, FormField, etc.)
│       │   └── layout/                       # AppLayout, Sidebar, Topbar, ProtectedRoute
│       ├── context/                          # AuthContext.tsx (Sesión JWT y RBAC)
│       ├── hooks/                            # useApi.ts, useFormValidation.ts
│       ├── pages/                            # LoginPage, DashboardPage, UsuariosPage, EquiposPage, PrestamosPage, ReportesPage
│       ├── services/                         # apiClient.ts y servicios tipados por módulo
│       ├── types/                            # Interfaces y contratos TypeScript
│       └── utils/                            # Formateadores de fechas, estados y exportación CSV
├── database/
│   └── init_techasset.sql                    # Script DDL PostgreSQL + Datos Semilla
├── postman/
│   └── TechAsset.postman_collection.json     # Colección de pruebas de API REST y Reglas RN-01..RN-10
└── docs/                                     # Documentación académica y técnica del proyecto
```

---

## 3. Estrategia de Control de Versiones (Git) y Code Review

### 3.1 Flujo de Ramas (Gitflow Simplificado)
- **`main`**: Rama estable de producción/entrega académica. Solo recibe código que compila sin advertencias y supera el 100% de pruebas unitarias.
- **`develop`**: Rama de integración continua donde convergen los incrementos de cada Sprint.
- **`feature/<modulo>-<descripcion>`**: Ramas de trabajo por requerimiento funcional (ej. `feature/rf09-registro-prestamos`, `feature/rf13-dashboard-kpis`).

### 3.2 Formato Estricto de Commits (Conventional Commits)
Todos los mensajes de confirmación siguen la especificación `<tipo>(<alcance>): <descripción en imperativo>`:
- `feat(prestamos): implementar registro de prestamos y validacion RN-01 a RN-05`
- `feat(reportes): agregar dashboard ejecutivo y 4 reportes gerenciales RF-13 a RF-17`
- `refactor(ui): extraer tabla generica DataTable y hook useFormValidation`
- `test(reglas): cubrir las 10 reglas de negocio RN-01 a RN-10 con xUnit`
- `docs(arquitectura): documentar diagramas UML, ER y estandares de construccion`

### 3.3 Checklist de Revisión de Código (Code Review — 12 Puntos de Control)

| # | Criterio de Verificación en Pull Request | Obligatorio |
| :-: | :--- | :---: |
| 1 | ¿El código respeta la convención `PascalCase` / `camelCase` / `snake_case` definida para su capa? | Sí |
| 2 | ¿El controlador de la API es delgado (*Thin Controller*) y delega toda lógica al servicio de aplicación? | Sí |
| 3 | ¿Se utilizan DTOs de entrada/salida sin exponer directamente las entidades de EF Core en las respuestas HTTP? | Sí |
| 4 | ¿Las operaciones que modifican `prestamos`, `equipos` y `movimientos_inventario` son atómicas? | Sí |
| 5 | ¿Se validan explícitamente las reglas de negocio aplicables (`RN-01` a `RN-10`) devolviendo el código HTTP correcto? | Sí |
| 6 | ¿Los endpoints protegidos cuentan con el atributo `[Authorize]` y la restricción de roles (`RN-09`)? | Sí |
| 7 | ¿El frontend reutiliza los componentes de `src/components/ui/` en lugar de duplicar HTML/Tailwind? | Sí |
| 8 | ¿Los formularios validan campos obligatorios y reglas de fecha (`RN-04`) antes de enviar la petición HTTP? | Sí |
| 9 | ¿Se manejan adecuadamente los estados de carga (`LoadingSpinner`), lista vacía (`EmptyState`) y error (`AlertBanner`)? | Sí |
| 10 | ¿El proyecto Backend compila con 0 errores (`dotnet build`) y pasan todas las pruebas (`dotnet test`)? | Sí |
| 11 | ¿El proyecto Frontend compila con 0 errores de TypeScript (`npm run build`)? | Sí |
| 12 | ¿No existen credenciales, secretos expuestos ni bloques `TODO` o código comentado muerto? | Sí |

---

## 4. Diagramas de Arquitectura y Diseño en Mermaid

### 4.1 Diagrama de Casos de Uso (3 Actores y 17 Requerimientos Funcionales)

```mermaid
flowchart LR
    Admin["Actor: Administrador"]
    RespTI["Actor: Responsable de Tecnologia"]
    Colab["Actor: Colaborador"]

    subgraph ModuloUsuarios["1. Gestion de Usuarios (RF-01 a RF-04)"]
        RF01["RF-01: Registrar nuevos usuarios"]
        RF02["RF-02: Editar informacion de usuarios"]
        RF03["RF-03: Deshabilitar usuarios del sistema"]
        RF04["RF-04: Consultar lista de usuarios"]
    end

    subgraph ModuloEquipos["2. Gestion de Equipos Tecnologicos (RF-05 a RF-08)"]
        RF05["RF-05: Registrar nuevos equipos"]
        RF06["RF-06: Editar datos de equipos"]
        RF07["RF-07: Cambiar estado del equipo"]
        RF08["RF-08: Consultar y filtrar equipos"]
    end

    subgraph ModuloPrestamos["3. Gestion de Prestamos y Devoluciones (RF-09 a RF-12)"]
        RF09["RF-09: Registrar prestamo de equipo"]
        RF10["RF-10: Registrar devolucion de equipo"]
        RF11["RF-11: Consultar prestamos activos"]
        RF12["RF-12: Consultar historial de prestamos"]
    end

    subgraph ModuloReportes["4. Dashboard y Reportes (RF-13 a RF-17)"]
        RF13["RF-13: Visualizar dashboard de inventario"]
        RF14["RF-14: Reporte de equipos por estado"]
        RF15["RF-15: Reporte de equipos mas utilizados"]
        RF16["RF-16: Reporte de prestamos por area"]
        RF17["RF-17: Reporte de historial de movimientos"]
    end

    Admin --> RF01
    Admin --> RF02
    Admin --> RF03
    Admin --> RF04
    Admin --> RF05
    Admin --> RF06
    Admin --> RF07
    Admin --> RF08
    Admin --> RF09
    Admin --> RF10
    Admin --> RF11
    Admin --> RF12
    Admin --> RF13
    Admin --> RF14
    Admin --> RF15
    Admin --> RF16
    Admin --> RF17

    RespTI --> RF04
    RespTI --> RF05
    RespTI --> RF06
    RespTI --> RF07
    RespTI --> RF08
    RespTI --> RF09
    RespTI --> RF10
    RespTI --> RF11
    RespTI --> RF12
    RespTI --> RF13
    RespTI --> RF14
    RespTI --> RF15
    RespTI --> RF16
    RespTI --> RF17

    Colab --> RF08
    Colab --> RF11
    Colab --> RF12
    Colab --> RF13
```

---

### 4.2 Diagrama de Clases del Dominio y Capa de Servicios

```mermaid
classDiagram
    class Usuario {
        +Guid Id
        +string Nombres
        +string Apellidos
        +string Correo
        +string Area
        +bool Estado
        +string Rol
        +string PasswordHash
        +DateTime FechaRegistro
        +NombreCompleto() string
        +PuedeRecibirPrestamo() bool
        +EsResponsableAutorizado() bool
        +Deshabilitar() void
    }

    class Equipo {
        +Guid Id
        +string CodigoPatrimonial
        +string Nombre
        +string Categoria
        +string Marca
        +string Estado
        +DateTime FechaRegistro
        +ValidarDisponibilidadParaPrestamo() Result
        +MarcarComoPrestado() void
        +MarcarComoDisponible() void
        +CambiarEstado(string nuevoEstado) Result
    }

    class Prestamo {
        +Guid Id
        +DateOnly FechaPrestamo
        +DateOnly FechaDevolucion
        +DateOnly? FechaDevolucionReal
        +string Observacion
        +string? ObservacionDevolucion
        +string EstadoPrestamo
        +Guid UsuarioId
        +Guid EquipoId
        +Guid ResponsableId
        +ValidarFechas(DateOnly prestamo, DateOnly devolucion) Result
        +RegistrarDevolucion(DateOnly fechaReal, string observacion) Result
    }

    class MovimientoInventario {
        +Guid Id
        +DateTime Fecha
        +string TipoMovimiento
        +Guid EquipoId
        +string EstadoAnterior
        +string EstadoNuevo
        +Guid? UsuarioId
        +Guid? ResponsableId
        +string Observacion
    }

    class IUsuarioService {
        <<interface>>
        +ListarUsuariosAsync(FiltroUsuarioDto filtro)
        +CrearUsuarioAsync(CrearUsuarioDto dto)
        +ActualizarUsuarioAsync(Guid id, ActualizarUsuarioDto dto)
        +CambiarEstadoUsuarioAsync(Guid id, bool activo)
    }

    class IEquipoService {
        <<interface>>
        +ListarEquiposAsync(FiltroEquipoDto filtro)
        +CrearEquipoAsync(CrearEquipoDto dto, Guid responsableId)
        +ActualizarEquipoAsync(Guid id, ActualizarEquipoDto dto)
        +CambiarEstadoAsync(Guid id, CambiarEstadoEquipoDto dto, Guid responsableId)
        +EliminarEquipoAsync(Guid id)
    }

    class IPrestamoService {
        <<interface>>
        +ListarPrestamosAsync(FiltroPrestamoDto filtro)
        +ListarPrestamosActivosAsync()
        +RegistrarPrestamoAsync(CrearPrestamoDto dto)
        +RegistrarDevolucionAsync(Guid prestamoId, RegistrarDevolucionDto dto, Guid responsableId)
    }

    class IReporteService {
        <<interface>>
        +ObtenerDashboardAsync()
        +ObtenerEquiposPorEstadoAsync()
        +ObtenerEquiposMasUtilizadosAsync(int top)
        +ObtenerPrestamosPorAreaAsync()
        +ObtenerHistorialMovimientosAsync(Guid? equipoId, string? tipo)
    }

    Usuario "1" --> "0..*" Prestamo : recibe (UsuarioId)
    Usuario "1" --> "0..*" Prestamo : autoriza (ResponsableId)
    Equipo "1" --> "0..*" Prestamo : se asigna en
    Equipo "1" --> "1..*" MovimientoInventario : registra historial
    IPrestamoService ..> Usuario : valida RN-05 y RN-10
    IPrestamoService ..> Equipo : valida RN-01, RN-02 y RN-03
    IPrestamoService ..> Prestamo : valida RN-04
    IEquipoService ..> Equipo : valida RN-06 y RN-07
    IUsuarioService ..> Usuario : valida RN-08 y RN-09
```

---

### 4.3 Diagrama Entidad-Relación de Base de Datos (`erDiagram`)

```mermaid
erDiagram
    USUARIOS ||--o{ PRESTAMOS : "recibe (usuario_id)"
    USUARIOS ||--o{ PRESTAMOS : "autoriza (responsable_id)"
    EQUIPOS ||--o{ PRESTAMOS : "asignado_en (equipo_id)"
    EQUIPOS ||--o{ MOVIMIENTOS_INVENTARIO : "audita (equipo_id)"
    USUARIOS ||--o{ MOVIMIENTOS_INVENTARIO : "involucra (usuario_id)"
    USUARIOS ||--o{ MOVIMIENTOS_INVENTARIO : "ejecuta (responsable_id)"

    USUARIOS {
        uuid id PK
        varchar_100 nombres "NOT NULL"
        varchar_100 apellidos "NOT NULL"
        varchar_150 correo UK "NOT NULL UNIQUE (RN-08)"
        varchar_100 area "NOT NULL"
        boolean estado "NOT NULL DEFAULT TRUE (RN-10)"
        varchar_50 rol "NOT NULL CHECK (RN-09)"
        varchar_255 password_hash "NOT NULL"
        timestamptz fecha_registro "NOT NULL DEFAULT NOW()"
    }

    EQUIPOS {
        uuid id PK
        varchar_50 codigo_patrimonial UK "NOT NULL UNIQUE (RN-07)"
        varchar_100 nombre "NOT NULL"
        varchar_50 categoria "NOT NULL CHECK (7 categorias)"
        varchar_50 marca "NOT NULL"
        varchar_30 estado "NOT NULL CHECK (Disponible, Prestado, Mantenimiento, Baja)"
        timestamptz fecha_registro "NOT NULL DEFAULT NOW()"
    }

    PRESTAMOS {
        uuid id PK
        date fecha_prestamo "NOT NULL"
        date fecha_devolucion "NOT NULL CHECK > fecha_prestamo (RN-04)"
        date fecha_devolucion_real "NULL"
        text observacion "NOT NULL"
        text observacion_devolucion "NULL"
        varchar_30 estado_prestamo "NOT NULL CHECK (Activo, Devuelto) + UK parcial (RN-01)"
        uuid usuario_id FK "NOT NULL REFERENCES usuarios(id)"
        uuid equipo_id FK "NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT (RN-06)"
        uuid responsable_id FK "NOT NULL REFERENCES usuarios(id) (RN-05)"
    }

    MOVIMIENTOS_INVENTARIO {
        uuid id PK
        timestamptz fecha "NOT NULL DEFAULT NOW()"
        varchar_40 tipo_movimiento "NOT NULL CHECK (Alta, Prestamo, Devolucion, Mantenimiento, Baja)"
        uuid equipo_id FK "NOT NULL REFERENCES equipos(id)"
        varchar_30 estado_anterior "NOT NULL"
        varchar_30 estado_nuevo "NOT NULL"
        uuid usuario_id FK "NULL REFERENCES usuarios(id)"
        uuid responsable_id FK "NULL REFERENCES usuarios(id)"
        text observacion "NOT NULL"
    }
```

---

### 4.4 Diagrama de Arquitectura en Capas (Full-Stack Clean Architecture)

```mermaid
flowchart TB
    subgraph ClienteWeb["Capa de Presentacion Cliente (React 19 + TypeScript + Vite + Tailwind CSS)"]
        Pages["Paginas Orquestadoras (LoginPage, DashboardPage, UsuariosPage, EquiposPage, PrestamosPage, ReportesPage)"]
        UIComponents["13 Componentes UI Reutilizables (DataTable, Modal, FormField, StatCard, StatusBadge, SearchFilterBar)"]
        Hooks["Custom Hooks y Contexto (AuthContext, useApi, useFormValidation + Esquemas Zod)"]
        ApiClient["Cliente HTTP Centralizado (services/apiClient.ts con Interceptor JWT Bearer)"]
        Pages --> UIComponents
        Pages --> Hooks
        Hooks --> ApiClient
    end

    subgraph ServidorAPI["Servidor Backend ASP.NET Core 8 (Clean Architecture)"]
        subgraph CapaAPI["TechAsset.API (Entrada HTTP REST)"]
            Middleware["ExceptionHandlingMiddleware + JWT Bearer Authentication + RBAC Policies"]
            Controllers["Thin Controllers (AuthController, UsuariosController, EquiposController, PrestamosController, ReportesController)"]
            Middleware --> Controllers
        end

        subgraph CapaApplication["TechAsset.Application (Logica de Aplicacion y Casos de Uso)"]
            Services["Servicios de Dominio/Aplicacion (UsuarioService, EquipoService, PrestamoService, ReporteService)"]
            Validators["Motor de Reglas de Negocio (RN-01 a RN-10) + Patron Result<T>"]
            Controllers --> Services
            Services --> Validators
        end

        subgraph CapaDomain["TechAsset.Domain (Nucleo de Entidades y Reglas Puras)"]
            Entities["Entidades POCO Ricas (Usuario, Equipo, Prestamo, MovimientoInventario)"]
            Services --> Entities
        end

        subgraph CapaInfra["TechAsset.Infrastructure (Persistencia y Seguridad)"]
            DbContext["TechAssetDbContext (Entity Framework Core 8) + Repositorios + JwtTokenGenerator"]
            Services --> DbContext
        end
    end

    subgraph BaseDatos["Capa de Datos Relacional"]
        Postgres[("PostgreSQL 16 (techasset_db) / SQLite Fallback con Restricciones CHECK, UNIQUE y FK")]
    end

    ApiClient -- "JSON sobre HTTP/REST (Puerto 5080)" --> Middleware
    DbContext -- "Transacciones ACID y Consultas LINQ" --> Postgres
```
