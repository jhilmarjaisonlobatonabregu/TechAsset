# TechAsset — Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos

> **Empresa:** Innovatech Solutions S.A.C. (+500 colaboradores)  
> **Tipo:** Caso Práctico Integrador — Construcción de Software (Semanas 01–12)  
> **Stack:** ASP.NET Core 8 · Entity Framework Core 8 · PostgreSQL · Swagger · React 19 · TypeScript · Vite · Tailwind CSS v4

---

## 1. Descripción del Problema y Solución

Innovatech Solutions S.A.C. administraba su parque tecnológico (laptops, computadoras de escritorio, monitores, impresoras, tablets, proyectores multimedia y equipos de red) mediante hojas de cálculo y registros manuales, lo que generaba pérdida de información, duplicidad de códigos patrimoniales, desconocimiento de ubicación, imposibilidad de verificar disponibilidad en tiempo real y ausencia de indicadores gerenciales.

**TechAsset** centraliza el ciclo de vida completo de los activos tecnológicos con autenticación JWT basada en 3 roles (**Administrador**, **Responsable de Tecnología** y **Colaborador**), control estricto de los **17 Requerimientos Funcionales (`RF-01` a `RF-17`)**, validación en doble capa de las **10 Reglas de Negocio (`RN-01` a `RN-10`)** y trazabilidad histórica de movimientos.

---

## 2. Arquitectura del Sistema

```text
┌────────────────────────────────────────────────────────────────────┐
│  FRONTEND  React 19 + TypeScript + Vite + Tailwind CSS v4          │
│  Puerto: 5173  │  Proxy /api → http://127.0.0.1:5080               │
│  Validación: React Hook Form + Zod │ 13 Componentes UI + Hooks     │
└──────────────────────────────────┬─────────────────────────────────┘
                                   │ HTTP/REST + JWT Bearer
┌──────────────────────────────────▼─────────────────────────────────┐
│  BACKEND  ASP.NET Core 8 · Clean Architecture                      │
│  Puerto: 5080  │  Swagger UI: http://localhost:5080/swagger        │
│  TechAsset.Domain → TechAsset.Application → TechAsset.Infrastructure│
│  → TechAsset.API (Controllers, ManejoErroresMiddleware, JWT/RBAC)  │
└──────────────────────────────────┬─────────────────────────────────┘
                                   │ EF Core 8 + Npgsql
┌──────────────────────────────────▼─────────────────────────────────┐
│  BASE DE DATOS  PostgreSQL 14+  │  Base de datos: techasset_db     │
│  Tablas: usuarios · equipos · prestamos · movimientos_inventario   │
│  Índices únicos: "Correo" (RN-08), "CodigoPatrimonial" (RN-07),    │
│  préstamo activo único por equipo (RN-01)                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Requisitos Previos

| Herramienta | Versión | Verificación |
|---|---|---|
| **.NET SDK** | 8.0+ | `dotnet --version` |
| **Node.js** | 20 LTS+ | `node --version` |
| **PostgreSQL** | 14+ | `psql --version` |

---

## 4. Instalación y Ejecución Paso a Paso

### Paso 1 — Base de datos PostgreSQL
El backend crea automáticamente la base de datos y carga los datos semilla al iniciar (`DatabaseSeeder.SeedAsync`). Si desea crearla manualmente con el script SQL oficial (directamente compatible con la API: 9 usuarios, 24 equipos, 20 préstamos y 44 movimientos):

```bash
psql -U postgres -c "CREATE DATABASE techasset_db;"
psql -U postgres -d techasset_db -f database/init_techasset.sql
```

### Paso 2 — Backend (.NET 8 Web API + Swagger)
```bash
cd backend
dotnet build TechAsset.sln
dotnet run --project TechAsset.API
```
- API disponible en: `http://localhost:5080/api`
- Swagger UI: `http://localhost:5080/swagger`

*(Nota para entornos con .NET 9/10 instalado sin runtime 8.0 en Windows: ejecutar `$env:DOTNET_ROLL_FORWARD="Major"` antes de `dotnet run` o `dotnet test`).*

### Paso 3 — Frontend (React + Vite)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
- Aplicación disponible en: `http://localhost:5173`

### Paso 4 — Pruebas Unitarias (xUnit)
```bash
dotnet test backend/TechAsset.sln
```
- Ejecuta las **39 pruebas automatizadas** que cubren las reglas `RN-01` a `RN-10`, los 17 requerimientos funcionales, el flujo de solicitud (`Pendiente`) y aprobación de préstamos (`Activo`), autenticación JWT y validadores FluentValidation.

---

## 5. Cuentas Institucionales de Prueba (Seed)

> **Nota de Seguridad y Usabilidad (Heurística 8 de Nielsen):** Las credenciales de acceso se mantienen exclusivamente en este documento y en el informe técnico, sin exponer botones ni datos de demostración en la interfaz web de producción.

| Rol del Sistema | Nombres y Apellidos | Correo Institucional | Contraseña | Permisos principales |
|---|---|---|---|---|
| **Administrador** | Carlos Mendoza Salazar | `cmendoza@innovatech.pe` | `Admin2026!` | Gestión total de usuarios (único que deshabilita según `RN-09`), equipos, registro y aprobación de préstamos, reportes y dashboard. |
| **Responsable de Tecnología** | Lucía Quispe Huamán | `lquispe@innovatech.pe` | `Soporte2026!` | Registro/actualización de equipos, aprobación de solicitudes pendientes y registro de préstamos (`RN-05`) y devoluciones (`RN-10`), reportes y dashboard. |
| **Colaborador** | Alejandro Torres Mejía | `atorres@innovatech.pe` | `Colab2026!` | Consulta de disponibilidad de equipos, solicitud de préstamos propios (creados en estado `Pendiente`), historial personal y dashboard. |

### Características de la Pantalla de Inicio de Sesión (`/login`)
- **Proporción 60/40:** Panel de marca izquierdo (60%, `lg:col-span-3`) con titular corporativo de alto impacto, párrafo descriptivo centrado verticalmente, degradado azul con overlay oscuro preparado para imagen de fondo (contraste WCAG AAA) y pie institucional con copyright; panel de formulario derecho (40%, `lg:col-span-2`, centrado a `max-w-[420px]`). En dispositivos móviles se oculta el panel izquierdo para máxima usabilidad.
- **Validación con React Hook Form + Zod:** Formato de correo institucional estricto conforme al estándar corporativo (`@innovatech.pe`), contraseña obligatoria y mensajes claros de validación.
- **Control de visibilidad de clave:** Botón accesible mostrar/ocultar contraseña (`Eye` / `EyeOff`).
- **Respuesta de seguridad unificada:** Mensaje genérico y seguro ante credenciales inválidas o usuarios deshabilitados (*"Credenciales de acceso incorrectas o usuario no habilitado."*).
- **Accesibilidad y eficiencia:** Foco automático en el campo correo (`autoFocus`), soporte nativo para tecla `Enter`, estado de carga (`loading`) en el botón y contraste conforme a WCAG 2.1 AA.

---

## 6. Cobertura de Requerimientos y Reglas de Negocio

- **17 Requerimientos Funcionales (`RF-01`..`RF-17`):** Usuarios (crear, actualizar, consultar, deshabilitar), Equipos (crear, actualizar, inventario, estado), Préstamos (solicitar en estado `Pendiente`, aprobar vía `PATCH /api/prestamos/{id}/aprobar` o registrar directamente en estado `Activo`, devolver a `Devuelto`, historial y activos), Dashboard (`RF-13` con los 6 KPIs obligatorios) y Reportes (`RF-14`..`RF-17` con exportación CSV e impresión PDF).
- **10 Reglas de Negocio (`RN-01`..`RN-10`):** Validadas en frontend (React Hook Form + Zod), backend (Dominio + FluentValidation + Middleware) y PostgreSQL (índices únicos y `CHECK`).

---

## 7. Documentación y Entregables (`/docs` y `/postman`)

| Entregable | Ruta |
|---|---|
| Análisis, Planificación, Trazabilidad RF↔RN y Cronograma (Semanas 01–12) | [`docs/01-analisis-y-planificacion.md`](docs/01-analisis-y-planificacion.md) |
| Estándares de Construcción, Gitflow, Checklist y Diagramas Mermaid | [`docs/02-estandares-y-arquitectura.md`](docs/02-estandares-y-arquitectura.md) |
| Reutilización de Componentes y Ejemplos Antes/Después de Refactorización | [`docs/refactorizacion.md`](docs/refactorizacion.md) |
| Usabilidad y UX (ISO 9241-210/11/110, Shneiderman, Nielsen, Norman) | [`docs/usabilidad.md`](docs/usabilidad.md) |
| Informe Técnico, Evidencias, Casos de Prueba y Pregunta de Reflexión | [`docs/informe-tecnico.md`](docs/informe-tecnico.md) |
| Guion de Sustentación (5–7 min, 7 escenarios mínimos) | [`docs/guion-sustentacion.md`](docs/guion-sustentacion.md) |
| Script DDL + Datos Semilla PostgreSQL | [`database/init_techasset.sql`](database/init_techasset.sql) |
| Colección de Postman (52 peticiones y 81 aserciones automatizadas) | [`postman/TechAsset.postman_collection.json`](postman/TechAsset.postman_collection.json) |
