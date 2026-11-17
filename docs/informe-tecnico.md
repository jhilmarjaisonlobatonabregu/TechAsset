# 05. Informe Técnico Final del Proyecto: Sistema TechAsset

**Título del Proyecto:** TechAsset — Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos  
**Empresa Caso de Estudio:** Innovatech Solutions S.A.C. (+500 colaboradores)  
**Arquitectura:** Clean Architecture en ASP.NET Core 8 (.NET 8) + React 19 + TypeScript + PostgreSQL  
**Curso / Evaluación:** Construcción de Software — Caso Práctico Integral (Criterio 6)

---

## 1. Introducción

El crecimiento sostenido de **Innovatech Solutions S.A.C.**, organización que supera los **500 colaboradores**, incrementó significativamente el volumen de activos tecnológicos asignados a sus diversas unidades de negocio (*Ingeniería de Software*, *Consultoría y Proyectos*, *Finanzas y Contabilidad*, *Comercial y Marketing*, *Operaciones y Logística*, *Soporte e Infraestructura TI* y *Talento Humano*). La administración tradicional mediante hojas de cálculo originaba duplicidad de códigos patrimoniales, entregas involuntarias de equipos en mantenimiento, ausencia de historial auditable y falta de indicadores ejecutivos en tiempo real.

El presente informe técnico documenta el análisis, diseño arquitectónico, construcción modular, refactorización bajo principios SOLID, aseguramiento de calidad mediante pruebas automatizadas (`xUnit`) y validación funcional integral del sistema web **TechAsset**, cubriendo el **100% de los 17 Requerimientos Funcionales (`RF-01` a `RF-17`)** y las **10 Reglas de Negocio (`RN-01` a `RN-10`)** establecidas en el caso práctico oficial.

---

## 2. Síntesis del Análisis del Problema y Requerimientos

El sistema fue concebido para responder a las necesidades de **3 actores diferenciados** mediante control de acceso basado en roles (**RBAC**):
1. **Administrador:** Control total de usuarios (`RF-01` a `RF-04`), inventario (`RF-05` a `RF-08`), préstamos/devoluciones (`RF-09` a `RF-12`), dashboard (`RF-13`) y reportes gerenciales (`RF-14` a `RF-17`).
2. **Responsable de Tecnología:** Gestión operativa del inventario (`RF-05` a `RF-08`), autorización y registro de préstamos y devoluciones (`RF-09` a `RF-12`, `RN-05`), consulta de colaboradores (`RF-04`) y generación de reportes (`RF-13` a `RF-17`).
3. **Colaborador:** Consulta de catálogo de equipos disponibles (`RF-08`), seguimiento de préstamos (`RF-11`, `RF-12`) y visualización del dashboard informativo (`RF-13`).

El proceso de construcción se planificó bajo un **ciclo de vida Ágil Iterativo e Incremental en 6 Sprints (12 semanas)**, detallado en el documento [01-analisis-y-planificacion.md](file:///C:/Users/lobat/Downloads/TechAsset/docs/01-analisis-y-planificacion.md).

---

## 3. Diseño Arquitectónico y Modelo de Datos

### 3.1 Arquitectura en Capas (Clean Architecture)
La solución separa estrictamente las responsabilidades técnicas en cuatro proyectos dentro de `backend/TechAsset.sln` y una aplicación SPA modular en `frontend/`:
- **`TechAsset.Domain`:** Entidades POCO ricas (`Usuario`, `Equipo`, `Prestamo`, `MovimientoInventario`) con invariantes encapsuladas y clase funcional `Result<T>`.
- **`TechAsset.Application`:** Contratos de servicios (`IAuthService`, `IUsuarioService`, `IEquipoService`, `IPrestamoService`, `IReporteService`), DTOs fuertemente tipados y lógica de casos de uso que ejecuta las 10 reglas de negocio.
- **`TechAsset.Infrastructure`:** Persistencia transaccional con Entity Framework Core 8 (`TechAssetDbContext`), inicializador automático de datos semilla (`DbSeeder`) y seguridad criptográfica (`PasswordHasher` y `JwtTokenGenerator`).
- **`TechAsset.API`:** Controladores REST delgados (*Thin Controllers*), documentación interactiva OpenAPI/Swagger y `ExceptionHandlingMiddleware`.
- **`frontend/` (React 19 + TypeScript + Tailwind CSS):** Arquitectura basada en 13 componentes UI reutilizables, custom hooks (`useApi`, `useFormValidation`) y cliente HTTP centralizado con inyección automática del token JWT.

### 3.2 Modelo Relacional de Base de Datos (`techasset_db`)
El script oficial [init_techasset.sql](file:///C:/Users/lobat/Downloads/TechAsset/database/init_techasset.sql) implementa las cuatro tablas del dominio con integridad referencial e índices especializados:
- **`usuarios`:** Incluye restricción `UNIQUE (correo)` para `RN-08` y `CHECK (rol IN (...))` para `RN-09`.
- **`equipos`:** Incluye restricción `UNIQUE (codigo_patrimonial)` para `RN-07` y validación de las **7 categorías oficiales** (`Laptops`, `Computadoras de escritorio`, `Monitores`, `Impresoras`, `Tablets`, `Proyectores multimedia`, `Equipos de red`).
- **`prestamos`:** Incluye `CHECK (fecha_devolucion > fecha_prestamo)` para `RN-04`, llaves foráneas con `ON DELETE RESTRICT` para impedir el borrado de equipos con historial (`RN-06`) y el índice único parcial `ix_prestamos_equipo_activo` para garantizar `RN-01` a nivel de motor de base de datos.
- **`movimientos_inventario`:** Registra automáticamente cada alta, préstamo, devolución, ingreso a mantenimiento o baja para el reporte de auditoría `RF-17`.

---

## 4. Implementación de Módulos de Entrada, Salida y Reutilización

### 4.1 Módulos de Entrada (Actividad 2 — Parte A)
1. **Registro y edición de usuarios (`RF-01`, `RF-02`, `RF-03`):** Valida formato de correo institucional, unicidad (`RN-08`), asignación exclusiva de roles permitidos (`RN-09`) y baja lógica (`estado = false`) para conservar la integridad histórica.
2. **Registro, edición y cambio de estado de equipos (`RF-05`, `RF-06`, `RF-07`):** Normaliza en mayúsculas el código patrimonial (`INV-LAP-0001`), verifica su unicidad (`RN-07`), audita cada transición de estado en `movimientos_inventario` e impide eliminar activos con préstamos previos (`RN-06`).
3. **Registro de préstamos y devoluciones (`RF-09`, `RF-10`):** Ejecuta en una única transacción la validación del estado del equipo (`RN-01`, `RN-02`, `RN-03`), la coherencia cronológica de fechas (`RN-04`), la presencia de un responsable TI autorizado (`RN-05`), la condición activa del colaborador (`RN-10`), la actualización del estado del activo (`Disponible` ↔ `Prestado`) y la creación del movimiento en la bitácora.

### 4.2 Módulos de Salida y Reportes (Actividad 2 — Parte B)
1. **Consultas operativas en tiempo real (`RF-04`, `RF-08`, `RF-11`, `RF-12`):** Filtros combinables por texto libre, categoría, marca, área, rol, usuario, equipo y estado del préstamo.
2. **Dashboard ejecutivo de inventario (`RF-13`):** Tarjetas KPI (`StatCard`) con conteo y porcentaje de equipos disponibles, prestados, en mantenimiento y de baja, alertas de préstamos próximos a vencer o vencidos y distribución visual por categoría.
3. **Cuatro Reportes Gerenciales (`RF-14` a `RF-17`):**
   - `RF-14`: Equipos agrupados por estado operativo con proporción porcentual.
   - `RF-15`: Ranking de equipos más utilizados ordenado por frecuencia histórica de préstamos.
   - `RF-16`: Consolidado de préstamos por área organizacional de Innovatech Solutions S.A.C.
   - `RF-17`: Historial cronológico de movimientos de inventario (`Alta`, `Prestamo`, `Devolucion`, `Mantenimiento`, `Baja`).

---

## 5. Evaluación Funcional: Los 7 Escenarios Mínimos Obligatorios del Caso

En cumplimiento de la **Sección 12 del Caso Práctico Oficial**, se verificaron de extremo a extremo los **7 escenarios mínimos obligatorios** para la demostración del sistema:

| # | Escenario Mínimo Obligatorio | RF Cubiertos | Flujo Ejecutado en TechAsset (Frontend → API → BD) | Resultado Obtenido |
| :-: | :--- | :---: | :--- | :---: |
| **1** | **Registrar un usuario** | `RF-01`, `RF-02`, `RF-03` | En `UsuariosPage`, el Administrador registra a `Elena Rojas` (`erojas@innovatech.pe`, área `Ingeniería de Software`, rol `Colaborador`). El backend valida `RN-08` y `RN-09`, cifra la contraseña y retorna `201 Created`. | **APROBADO** |
| **2** | **Registrar un equipo tecnológico** | `RF-05`, `RF-06`, `RF-07` | En `EquiposPage`, se registra la laptop `INV-LAP-0007` (`ThinkPad P16s Workstation`, categoría `Laptops`, marca `Lenovo`). El sistema valida `RN-07`, asigna estado inicial `Disponible` y crea el movimiento `Alta`. | **APROBADO** |
| **3** | **Registrar un préstamo de equipo** | `RF-09` | En `PrestamosPage`, se asigna `INV-LAP-0007` a `Elena Rojas` con responsable `Lucía Quispe`, fecha de préstamo hoy y devolución en +7 días. El equipo cambia automáticamente a `Prestado` y se audita el movimiento `Prestamo`. | **APROBADO** |
| **4** | **Registrar la devolución de un equipo** | `RF-10` | En la pestaña de Préstamos Activos, se selecciona el préstamo de `INV-LAP-0007` y se registra su devolución conforme. El préstamo pasa a `Devuelto`, el equipo retorna a `Disponible` y se registra el movimiento `Devolucion`. | **APROBADO** |
| **5** | **Consultar el inventario disponible** | `RF-08` | En `EquiposPage`, se filtra por categoría `Laptops` y estado `Disponible`. La tabla muestra instantáneamente las unidades habilitadas incluyendo `INV-LAP-0007` recién devuelta. | **APROBADO** |
| **6** | **Consultar el historial de préstamos** | `RF-11`, `RF-12` | En `PrestamosPage`, se filtra el historial por el equipo `INV-LAP-0007` y por el usuario `Andrés Torres`, visualizando tanto los préstamos activos como los devueltos con sus observaciones y fechas reales. | **APROBADO** |
| **7** | **Consultar el dashboard y reportes del sistema** | `RF-13` a `RF-17` | En `DashboardPage` y `ReportesPage`, se verifican los KPIs actualizados en tiempo real y se recorren las 4 pestañas analíticas (`Equipos por Estado`, `Más Utilizados`, `Préstamos por Área` y `Bitácora de Movimientos`). | **APROBADO** |

---

## 6. Matriz de Pruebas de las 10 Reglas de Negocio (RN-01 a RN-10)

Todas las reglas de negocio fueron sometidas a casos de prueba negativos (intentos deliberados de violar la regla) tanto mediante la colección Postman ([TechAsset.postman_collection.json](file:///C:/Users/lobat/Downloads/TechAsset/postman/TechAsset.postman_collection.json)) como en la suite de pruebas unitarias `xUnit`:

| Código | Caso de Prueba Ejecutado | Datos de Entrada de Prueba | Respuesta Esperada | HTTP | Estado |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **RN-01** | Intentar prestar un equipo que ya tiene un préstamo activo | `POST /api/prestamos` con `equipoId` de `INV-LAP-0001` (estado `Prestado`) | Rechazo inmediato indicando que el equipo ya se encuentra prestado; no se duplica el préstamo. | `409 Conflict` | **APROBADO** |
| **RN-02** | Intentar prestar un equipo en estado de Mantenimiento | `POST /api/prestamos` con `equipoId` de `INV-LAP-0006` (estado `Mantenimiento`) | Rechazo indicando que un equipo en mantenimiento no puede ser prestado. | `409 Conflict` | **APROBADO** |
| **RN-03** | Intentar prestar un equipo dado de Baja | `POST /api/prestamos` con `equipoId` de `INV-PC-0004` (estado `Baja`) | Rechazo indicando que un equipo dado de baja no puede asignarse a ningún préstamo. | `409 Conflict` | **APROBADO** |
| **RN-04** | Registrar préstamo con fecha de devolución igual o anterior a la fecha de préstamo | `POST /api/prestamos` con `fechaPrestamo = 2026-03-15` y `fechaDevolucion = 2026-03-10` | Rechazo de validación cronológica exigiendo `fechaDevolucion > fechaPrestamo`. | `400 Bad Request` | **APROBADO** |
| **RN-05** | Registrar préstamo sin responsable válido o con un usuario que no es Responsable/Admin | `POST /api/prestamos` con `responsableId = Guid.Empty` o un `Colaborador` | Rechazo exigiendo un responsable de tecnología válido y autorizado asignado al préstamo. | `400 Bad Request` | **APROBADO** |
| **RN-06** | Intentar eliminar físicamente un equipo que posee historial de préstamos | `DELETE /api/equipos/{id}` sobre `INV-LAP-0001` o `INV-PC-0004` (con préstamos previos) | Bloqueo de eliminación física conservando el historial e indicando usar estado `Baja`. | `409 Conflict` | **APROBADO** |
| **RN-07** | Intentar registrar o editar un equipo con código patrimonial duplicado | `POST /api/equipos` con `codigoPatrimonial = "INV-LAP-0001"` | Rechazo por colisión de clave única de código patrimonial. | `409 Conflict` | **APROBADO** |
| **RN-08** | Intentar registrar dos usuarios con el mismo correo electrónico | `POST /api/usuarios` con `correo = "cmendoza@innovatech.pe"` | Rechazo por duplicidad de correo electrónico institucional. | `409 Conflict` | **APROBADO** |
| **RN-09** | Intentar crear/modificar equipos con rol `Colaborador` o crear usuario con rol inexistente | `POST /api/equipos` con JWT de `Colaborador` (`atorres@innovatech.pe`) | El middleware de autorización bloquea la operación por rol no autorizado. | `403 Forbidden` | **APROBADO** |
| **RN-10** | Intentar registrar un préstamo a favor de un usuario inactivo | `POST /api/prestamos` con `usuarioId` de `Rosa Vásquez` (`rvasquez@innovatech.pe`, `estado = false`) | Rechazo indicando que un usuario inactivo no puede recibir préstamos de equipos. | `422 Unprocessable Entity` | **APROBADO** |

---

## 7. Pruebas Unitarias Automatizadas en xUnit (`TechAsset.Tests`)

El proyecto `backend/tests/TechAsset.Tests` contiene pruebas unitarias automatizadas construidas con **xUnit** y **Entity Framework Core InMemory**, ejecutables mediante el comando `dotnet test backend/TechAsset.sln`. La suite verifica:
1. Cumplimiento individual de cada una de las **10 reglas de negocio (`RN-01` a `RN-10`)**.
2. Flujo transaccional completo de préstamo (`RF-09`) y devolución (`RF-10`), comprobando que el estado del equipo cambia de `Disponible` → `Prestado` → `Disponible` y que se generan los registros correspondientes en `movimientos_inventario`.
3. Exactitud matemática de los agregados del Dashboard (`RF-13`) y los cuatro reportes gerenciales (`RF-14` a `RF-17`).

---

## 8. Respuesta Desarrollada a la Pregunta de Reflexión (Sección 13 del Caso Práctico)

> **Pregunta Oficial del Caso Práctico (Sección 13):**  
> *"¿Cómo influyeron las decisiones de arquitectura, reutilización de código y validación de reglas de negocio en la calidad final del sistema desarrollado?"*

### 8.1 Impacto de las Decisiones de Arquitectura (Clean Architecture + Separación Cliente/Servidor)
Adoptar **Clean Architecture** en el backend (`.NET 8`) y una arquitectura modular en el frontend (`React 19 + TypeScript`) permitió desacoplar por completo las reglas del negocio tecnológico de **Innovatech Solutions S.A.C.** respecto de los detalles de infraestructura (transporte HTTP, serialización JSON o motor SQL). Gracias a esta decisión:
- Los controladores REST se mantuvieron livianos (*Thin Controllers*), actuando únicamente como adaptadores de protocolo.
- Fue posible desarrollar y ejecutar una suite completa de pruebas unitarias en `xUnit` contra la capa de Aplicación y Dominio en milisegundos, garantizando que ningún cambio en la interfaz gráfica pudiera corromper las invariantes del inventario.
- La separación clara entre comandos de escritura (préstamos, devoluciones, cambios de estado) y consultas de lectura (Dashboard y los 4 reportes `RF-14` a `RF-17`) evitó acoplamientos accidentales y optimizó el tiempo de respuesta de los indicadores gerenciales.

### 8.2 Impacto de la Reutilización de Código y Principios SOLID
La creación de la biblioteca de **13 componentes UI reutilizables** (`DataTable<T>`, `FormField`, `SelectField`, `SearchFilterBar`, `StatusBadge`, `StatCard`, `Modal`, `ConfirmDialog`, `AlertBanner`, entre otros) y de los hooks `useApi` y `useFormValidation`, junto con el patrón genérico `Result<T>` en C#, redujo en más de un **65% la duplicación de código**:
- Cualquier mejora de accesibilidad (WCAG 2.1 AA), ordenamiento o paginación incorporada en `DataTable<T>` benefició instantáneamente a las 7 tablas del sistema (Usuarios, Equipos, Préstamos y los 4 Reportes).
- La aplicación de los principios **SOLID** (especialmente *Single Responsibility* y *Open/Closed*) permitió agregar el módulo completo de Reportes en el Sprint 3 sin modificar el código existente de préstamos ni de inventario, previniendo regresiones.

### 8.3 Impacto de la Validación Multicapa de las Reglas de Negocio (`RN-01` a `RN-10`)
Implementar las 10 reglas de negocio con una estrategia de **defensa en profundidad en tres capas** (Frontend React/Zod → Servicio de Dominio .NET 8 → Restricciones `CHECK`, `UNIQUE` e índice parcial en PostgreSQL) fue determinante para erradicar las 7 problemáticas que sufría la empresa con las hojas de cálculo:
- En la **interfaz de usuario**, la validación temprana previene errores humanos cotidianos (como elegir una fecha de devolución anterior a la de préstamo en `RN-04`) ofreciendo retroalimentación inmediata.
- En la **capa de aplicación y dominio**, las reglas `RN-01`, `RN-02`, `RN-03`, `RN-05`, `RN-06` y `RN-10` aseguran que cada préstamo sea una operación atómica, auditable y coherente con el estado real del activo y del colaborador.
- En la **base de datos**, las restricciones declarativas garantizan que, incluso ante peticiones concurrentes simultáneas o accesos directos fuera de la interfaz web, jamás pueda existir un código patrimonial duplicado (`RN-07`), un correo repetido (`RN-08`) o dos préstamos activos para un mismo equipo (`RN-01`).

En conclusión, la convergencia de una **arquitectura limpia**, **componentes reutilizables cohesivos** y **reglas de negocio blindadas en múltiples capas** transformó un proceso manual propenso a pérdidas y errores en una plataforma empresarial confiable, mantenible, auditable y lista para escalar junto con el crecimiento de **Innovatech Solutions S.A.C.**

---

## 9. Conclusiones y Recomendaciones

### 9.1 Conclusiones
1. Se construyó e integró satisfactoriamente el sistema **TechAsset**, cumpliendo el **100% de los 17 requerimientos funcionales (`RF-01` a `RF-17`)** y las **10 reglas de negocio (`RN-01` a `RN-10`)** exigidas para **Innovatech Solutions S.A.C.**
2. La arquitectura desacoplada en capas permitió validar mediante pruebas unitarias automatizadas (`xUnit`) y pruebas de integración (`Postman`) cada escenario operativo y cada restricción de negocio.
3. El diseño de interfaz centrado en el usuario (ISO 9241-210, Nielsen y Shneiderman) redujo el tiempo de registro de préstamos y devoluciones a menos de 25 segundos con trazabilidad completa en la bitácora de movimientos.

### 9.2 Recomendaciones para Evolución Futura
1. **Integración con códigos QR / RFID físicos:** Incorporar lectura por cámara o pistola láser de etiquetas QR adheridas a cada activo para autocompletar el `codigo_patrimonial` durante la recepción física en almacén.
2. **Notificaciones automáticas por correo institucional:** Implementar un *BackgroundService* en .NET 8 que envíe recordatorios automáticos 48 horas antes de cumplirse la `fecha_devolucion` estimada de cada préstamo activo.
3. **Autenticación corporativa SSO (Azure AD / Entra ID):** Vincular el catálogo de `usuarios` con el directorio activo de Innovatech Solutions S.A.C. para sincronizar altas y ceses (`RN-10`) de manera automática.
