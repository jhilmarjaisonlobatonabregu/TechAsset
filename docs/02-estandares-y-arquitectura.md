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
| **Clases, Entidades, Interfaces y Componentes React** | `PascalCase` | `Equipo`, `PrestamoService`, `IEquipoService` | `EquiposPage.tsx`, `DataTable.tsx`, `Badge.tsx` |
| **Métodos en C# y Propiedades de Entidad/DTO** | `PascalCase` | `RegistrarPrestamoAsync()`, `CodigoPatrimonial` | — |
| **Funciones, Variables Locales y Propiedades JSON/TS** | `camelCase` | `equipoExistente`, `fechaActual` | `codigoPatrimonial`, `registrarDevolucion()` |
| **Custom Hooks de React** | `camelCase` con prefijo `use` | — | `useApi.ts`, `useCarga.ts`, `useForm.ts` |
| **Constantes Globales y Variables de Entorno** | `UPPER_SNAKE_CASE` | `ROLES_AUTORIZADOS_INVENTARIO` | `VITE_API_URL`, `CATEGORIAS_OFICIALES` |
| **Tablas, Columnas e Índices en PostgreSQL** | `snake_case` (tablas/índice parcial) y `"PascalCase"` EF Core (columnas) | `movimientos_inventario`, `"CodigoPatrimonial"`, `ix_prestamos_equipo_activo` | — |
| **Rutas de Endpoints REST** | `kebab-case` (plural) | `/api/equipos`, `/api/reportes/equipos-mas-utilizados` | — |

### 1.2 Reglas de Calidad de Código
1. **Tipado estricto y nulabilidad explícita:**
   - En C# se habilita `<Nullable>enable</Nullable>` en todos los proyectos `.csproj`.
   - En TypeScript se habilita `"strict": true` prohibiendo el uso del tipo `any`.
2. **Responsabilidad única por archivo:**
   - Cada entidad de dominio, DTO, servicio, controlador o componente UI reutilizable reside en su propio archivo fuente claramente identificado.
3. **Manejo uniforme de errores:**
   - Ningún controlador expone trazas de pila (`stack traces`) crudas. Las validaciones estructurales se ejecutan con `FluentValidation` y las reglas de negocio lanzan `ReglaNegocioException`, capturadas por `ManejoErroresMiddleware` que devuelve respuestas JSON estandarizadas con el código (`RN-01` a `RN-10`).

---

## 2. Estructura de Carpetas del Proyecto

El repositorio aplica una separación limpia entre el servidor de aplicaciones (**Clean Architecture en 4 capas** + proyecto de pruebas) y el cliente web (**Arquitectura Modular Basada en Componentes**):

```text
TechAsset/
├── backend/
│   ├── TechAsset.sln
│   ├── TechAsset.Domain/                 # Capa 1: Núcleo de Dominio (Sin dependencias externas)
│   │   ├── Constants/                    # CatalogosDominio.cs (Roles, Estados, Categorías, Áreas, Mensajes)
│   │   ├── Entities/                     # Usuario.cs, Equipo.cs, Prestamo.cs, MovimientoInventario.cs
│   │   └── Exceptions/                   # ReglaNegocioException.cs
│   ├── TechAsset.Application/            # Capa 2: Casos de Uso y Reglas de Negocio
│   │   ├── Common/                       # ErrorRespuestaDto.cs
│   │   ├── DTOs/                         # Contratos de entrada/salida (Auth, Usuarios, Equipos, Prestamos, Reportes)
│   │   ├── Interfaces/                   # IServices.cs (contratos de servicios)
│   │   └── Validators/                   # Validadores.cs (FluentValidation)
│   ├── TechAsset.Infrastructure/         # Capa 3: Persistencia EF Core y Seguridad JWT
│   │   ├── Persistence/                  # TechAssetDbContext.cs, DatabaseSeeder.cs
│   │   ├── Security/                     # SecurityServices.cs (JwtTokenGenerator, PasswordHasher)
│   │   └── Services/                     # AuthService, UsuarioService, EquipoService, PrestamoService, ReporteService
│   └── TechAsset.API/                    # Capa 4: Presentación HTTP REST
│       ├── Controllers/                  # ApiControllerBase, AuthController, UsuariosController, EquiposController, PrestamosController, DashboardController, ReportesController
│       ├── Middleware/                   # ManejoErroresMiddleware.cs
│       └── Program.cs
├── tests/
│   └── TechAsset.Tests/                  # Suite de pruebas unitarias xUnit (39 pruebas: RN-01 a RN-10 y servicios)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/                       # 13 componentes UI reutilizables (Button, DataTable, Modal, FormField, Badge, etc.)
│       │   └── layout/                   # AppLayout, Sidebar, Header
│       ├── context/                      # AuthContext.tsx, ThemeContext.tsx
│       ├── hooks/                        # useApi.ts, useCarga.ts, useDebounce.ts, useForm.ts
│       ├── pages/                        # LandingPage, LoginPage, DashboardPage, UsuariosPage, EquiposPage, PrestamosPage, ReportesPage
│       ├── services/                     # apiClient.ts y servicios tipados por módulo
│       ├── types/                        # Interfaces y contratos TypeScript
│       └── utils/                        # Formateadores de fechas, esquemas Zod y exportación CSV
├── database/
│   └── init_techasset.sql                # Script DDL PostgreSQL + Datos Semilla (9 usuarios, 24 equipos, 20 préstamos, 44 movimientos)
├── postman/
│   └── TechAsset.postman_collection.json # Colección de pruebas de API REST (52 peticiones, 81 aserciones)
└── docs/                                 # Documentación académica y técnica del proyecto
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
| 9 | ¿Se manejan adecuadamente los estados de carga (`Spinner`), lista vacía (`EmptyState`) y error (`Toast`)? | Sí |
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
        RF09["RF-09: Solicitar, registrar y aprobar prestamo"]
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
    Colab --> RF09
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
        +Actualizar(nombres, apellidos, correo, area, rol) void
        +CambiarEstado(bool nuevoEstado, string rolActor) void
    }

    class Equipo {
        +Guid Id
        +string CodigoPatrimonial
        +string Nombre
        +string Categoria
        +string Marca
        +string Estado
        +DateTime FechaRegistro
        +ValidarDisponibleParaPrestamo() void
        +MarcarComoPrestado() void
        +MarcarComoDevuelto(string estadoDestino) void
        +CambiarEstado(string nuevoEstado) void
        +Actualizar(...) void
        +DarDeBajaLogica(bool aplicarBajaLogica) void
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
        +Guid? ResponsableId
        +DateTime FechaRegistro
        +Crear(...) Prestamo
        +CrearSolicitud(...) Prestamo
        +Aprobar(Guid responsableId) void
        +RegistrarDevolucion(string obs, DateOnly? fechaReal) void
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
        +string Area
        +string Observacion
    }

    class IUsuarioService {
        <<interface>>
        +ListarAsync(...)
        +ObtenerPorIdAsync(Guid id)
        +CrearAsync(CrearUsuarioDto dto)
        +ActualizarAsync(Guid id, ActualizarUsuarioDto dto)
        +CambiarEstadoAsync(Guid id, bool nuevoEstado, string rolActor)
    }

    class IEquipoService {
        <<interface>>
        +ListarAsync(...)
        +ObtenerPorIdAsync(Guid id)
        +CrearAsync(CrearEquipoDto dto, Guid? responsableId)
        +ActualizarAsync(Guid id, ActualizarEquipoDto dto, Guid? responsableId)
        +CambiarEstadoAsync(Guid id, CambiarEstadoEquipoDto dto, Guid? responsableId)
        +EliminarOBajaLogicaAsync(Guid id, bool aplicarBajaLogica)
    }

    class IPrestamoService {
        <<interface>>
        +ListarAsync(...)
        +ListarActivosAsync()
        +ObtenerPorIdAsync(Guid id)
        +RegistrarPrestamoAsync(CrearPrestamoDto dto, string? rolActor)
        +AprobarPrestamoAsync(Guid prestamoId, Guid responsableId, string? rolActor)
        +RegistrarDevolucionAsync(Guid prestamoId, RegistrarDevolucionDto dto, Guid? responsableId)
    }

    class IReporteService {
        <<interface>>
        +ObtenerDashboardAsync()
        +ObtenerEquiposPorEstadoAsync(string? estado)
        +ObtenerEquiposMasUtilizadosAsync(int top)
        +ObtenerPrestamosPorAreaAsync()
        +ObtenerMovimientosAsync(...)
    }

    Usuario "1" --> "0..*" Prestamo : recibe (UsuarioId)
    Usuario "1" --> "0..*" Prestamo : autoriza (ResponsableId)
    Equipo "1" --> "0..*" Prestamo : se asigna en
    Equipo "1" --> "1..*" MovimientoInventario : registra historial
    IPrestamoService ..> Usuario : valida RN-05 y USR-INACTIVO
    IPrestamoService ..> Equipo : valida RN-01, RN-02 y RN-03
    IPrestamoService ..> Prestamo : valida RN-04 y RN-10
    IEquipoService ..> Equipo : valida RN-06 y RN-07
    IUsuarioService ..> Usuario : valida RN-08 y RN-09
```

---

### 4.3 Diagrama Entidad-Relación de Base de Datos (`erDiagram`)

```mermaid
erDiagram
    USUARIOS ||--o{ PRESTAMOS : "recibe (UsuarioId)"
    USUARIOS ||--o{ PRESTAMOS : "autoriza (ResponsableId)"
    EQUIPOS ||--o{ PRESTAMOS : "asignado_en (EquipoId)"
    EQUIPOS ||--o{ MOVIMIENTOS_INVENTARIO : "audita (EquipoId)"
    USUARIOS ||--o{ MOVIMIENTOS_INVENTARIO : "involucra (UsuarioId)"
    USUARIOS ||--o{ MOVIMIENTOS_INVENTARIO : "ejecuta (ResponsableId)"

    USUARIOS {
        uuid Id PK
        varchar_100 Nombres "NOT NULL"
        varchar_100 Apellidos "NOT NULL"
        varchar_150 Correo UK "NOT NULL UNIQUE (RN-08)"
        varchar_100 Area "NOT NULL"
        boolean Estado "NOT NULL"
        varchar_50 Rol "NOT NULL CHECK (RN-09)"
        varchar_255 PasswordHash "NOT NULL"
        timestamptz FechaRegistro "NOT NULL"
    }

    EQUIPOS {
        uuid Id PK
        varchar_50 CodigoPatrimonial UK "NOT NULL UNIQUE (RN-07)"
        varchar_100 Nombre "NOT NULL"
        varchar_50 Categoria "NOT NULL CHECK (7 categorias)"
        varchar_50 Marca "NOT NULL"
        varchar_30 Estado "NOT NULL CHECK (Disponible, Prestado, Mantenimiento, Baja)"
        timestamptz FechaRegistro "NOT NULL"
    }

    PRESTAMOS {
        uuid Id PK
        date FechaPrestamo "NOT NULL"
        date FechaDevolucion "NOT NULL CHECK > FechaPrestamo (RN-04)"
        date FechaDevolucionReal "NULL"
        text Observacion "NOT NULL"
        text ObservacionDevolucion "NULL"
        varchar_30 EstadoPrestamo "NOT NULL CHECK (Pendiente, Activo, Devuelto) + UK parcial sobre Activo (RN-01)"
        uuid UsuarioId FK "NOT NULL REFERENCES usuarios(Id)"
        uuid EquipoId FK "NOT NULL REFERENCES equipos(Id) ON DELETE RESTRICT (RN-06)"
        uuid ResponsableId FK "NULL en Pendiente / NOT NULL en Activo y Devuelto REFERENCES usuarios(Id) (RN-05)"
        timestamptz FechaRegistro "NOT NULL"
    }

    MOVIMIENTOS_INVENTARIO {
        uuid Id PK
        timestamptz Fecha "NOT NULL"
        varchar_40 TipoMovimiento "NOT NULL CHECK (AltaEquipo, ActualizacionEquipo, Prestamo, Devolucion, CambioEstado, BajaLogica)"
        uuid EquipoId FK "NOT NULL REFERENCES equipos(Id)"
        varchar_30 EstadoAnterior "NOT NULL"
        varchar_30 EstadoNuevo "NOT NULL"
        uuid UsuarioId FK "NULL REFERENCES usuarios(Id)"
        uuid ResponsableId FK "NULL REFERENCES usuarios(Id)"
        varchar_100 Area "NOT NULL"
        text Observacion "NOT NULL"
    }
```

---

### 4.4 Diagrama de Arquitectura en Capas (Full-Stack Clean Architecture)

```mermaid
flowchart TB
    subgraph ClienteWeb["Capa de Presentacion Cliente (React 19 + TypeScript + Vite + Tailwind CSS)"]
        Pages["Paginas Orquestadoras (LandingPage, LoginPage, DashboardPage, UsuariosPage, EquiposPage, PrestamosPage, ReportesPage)"]
        UIComponents["13 Componentes UI Reutilizables (DataTable, Modal, FormField, Badge, Card, ConfirmDialog)"]
        Hooks["Custom Hooks y Contexto (AuthContext, useApi, useCarga, useForm + Esquemas Zod)"]
        ApiClient["Cliente HTTP Centralizado (services/apiClient.ts con Interceptor JWT Bearer)"]
        Pages --> UIComponents
        Pages --> Hooks
        Hooks --> ApiClient
    end

    subgraph ServidorAPI["Servidor Backend ASP.NET Core 8 (Clean Architecture)"]
        subgraph CapaAPI["TechAsset.API (Entrada HTTP REST)"]
            Middleware["ManejoErroresMiddleware + JWT Bearer Authentication + RBAC Policies"]
            Controllers["6 Thin Controllers (Auth, Usuarios, Equipos, Prestamos, Dashboard, Reportes)"]
            Middleware --> Controllers
        end

        subgraph CapaApplication["TechAsset.Application (Contratos y Validadores)"]
            Services["Interfaces de Servicio (IAuthService, IUsuarioService, IEquipoService, IPrestamoService, IReporteService)"]
            Validators["Validadores FluentValidation (Validadores.cs) y DTOs"]
            Controllers --> Services
            Controllers --> Validators
        end

        subgraph CapaDomain["TechAsset.Domain (Nucleo de Entidades y Reglas Puras)"]
            Entities["Entidades Ricas (Usuario, Equipo, Prestamo, MovimientoInventario) + ReglaNegocioException"]
            Services --> Entities
        end

        subgraph CapaInfra["TechAsset.Infrastructure (Persistencia, Servicios y Seguridad)"]
            DbContext["TechAssetDbContext (EF Core 8) + DatabaseSeeder + Servicios + JwtTokenGenerator"]
            Services --> DbContext
        end
    end

    subgraph BaseDatos["Capa de Datos Relacional"]
        Postgres[("PostgreSQL 16+ (techasset_db) con Restricciones CHECK, UNIQUE, FK e Indice Parcial")]
    end

    ApiClient -- "JSON sobre HTTP/REST (Puerto 5080)" --> Middleware
    DbContext -- "Transacciones ACID y Consultas LINQ" --> Postgres
```
