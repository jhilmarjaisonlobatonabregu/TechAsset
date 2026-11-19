# 01. Análisis de Requerimientos, Reglas de Negocio y Planificación del Desarrollo

**Sistema:** TechAsset — Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos  
**Organización:** Innovatech Solutions S.A.C. (+500 colaboradores)  
**Curso / Evaluación:** Construcción de Software — Caso Práctico Integral (Criterio 1)

---

## 1. Contexto Organizacional y Diagnóstico del Problema

### 1.1 Perfil de Innovatech Solutions S.A.C.
**Innovatech Solutions S.A.C.** es una empresa peruana de servicios de tecnología, desarrollo de software e integración de infraestructura corporativa que cuenta con **más de 500 colaboradores** distribuidos en múltiples áreas operativas: *Ingeniería de Software*, *Consultoría y Proyectos*, *Soporte e Infraestructura TI*, *Finanzas y Contabilidad*, *Comercial y Marketing*, *Operaciones y Logística* y *Talento Humano*.

Para el desarrollo de sus operaciones diarias, la organización administra un parque tecnológico compuesto por siete categorías críticas de activos:
1. **Laptops** corporativas de alto rendimiento.
2. **Computadoras de escritorio** (Workstations y estaciones SFF/Tiny).
3. **Monitores** profesionales 4K y UltraWide.
4. **Impresoras** multifuncionales láser y de inyección en red.
5. **Tablets** empresariales para trabajo de campo y almacenes.
6. **Proyectores multimedia** para directorios y presentaciones comerciales.
7. **Equipos de red** (switches administrables PoE+ y puntos de acceso Wi-Fi 6E).

### 1.2 Las 7 Problemáticas del Control Manual en Hojas de Cálculo
Hasta antes de la implantación de **TechAsset**, el área de Soporte e Infraestructura TI registraba las asignaciones, préstamos y mantenimientos utilizando hojas de cálculo compartidas y actas físicas no vinculadas. El diagnóstico técnico identificó **siete problemáticas estructurales**:

| Código | Problemática Detectada en Hojas de Cálculo | Impacto Operativo y Financiero en Innovatech Solutions S.A.C. | Solución en TechAsset |
| :--- | :--- | :--- | :--- |
| **PROB-01** | **Pérdida de trazabilidad sobre la ubicación y poseedor actual del activo** | Imposibilidad de saber en tiempo real qué colaborador tiene asignada una laptop o proyector, generando demoras de hasta 48 horas en auditorías internas. | Consulta en tiempo real de préstamos activos (`RF-11`) e historial por equipo y colaborador (`RF-12`). |
| **PROB-02** | **Doble asignación accidental de un mismo equipo** | Dos responsables de TI comprometían simultáneamente el mismo equipo en pestañas distintas del Excel al no existir bloqueo transaccional. | Regla **RN-01** reforzada en servicio y mediante índice único parcial en PostgreSQL (`ix_prestamos_equipo_activo`). |
| **PROB-03** | **Entrega de equipos en mantenimiento o dados de baja** | Equipos con fallas eléctricas o pendientes de reparación eran entregados por desconocimiento de su estado técnico real. | Reglas **RN-02** y **RN-03** que bloquean con HTTP `422 Unprocessable Entity` cualquier intento de préstamo si el estado no es `Disponible`. |
| **PROB-04** | **Duplicidad y errores de digitación en códigos patrimoniales y correos** | Códigos patrimoniales repetidos (`INV-LAP-001` asignado a dos activos) y usuarios duplicados con el mismo correo institucional. | Reglas **RN-07** y **RN-08** con restricciones `UNIQUE` e inspección previa en la capa de aplicación. |
| **PROB-05** | **Eliminación accidental de filas con historial de préstamos** | Al dar de baja un equipo antiguo en el Excel, se borraba la fila completa perdiendo la auditoría histórica de quiénes lo utilizaron. | Regla **RN-06** y bitácora inmutable `movimientos_inventario` (`RF-17`) con restricción `ON DELETE RESTRICT`. |
| **PROB-06** | **Préstamos asignados a personal cesado o inactivo** | Falta de cruce entre la planilla activa y el registro de préstamos permitía registrar entregas a usuarios deshabilitados. | Validación `USR-INACTIVO` (`usuario.Estado == true`, HTTP `422`) antes de autorizar o solicitar el préstamo. |
| **PROB-07** | **Ausencia de indicadores gerenciales en tiempo real** | Generar reportes sobre equipos más demandados o préstamos por área requería consolidar tablas dinámicas manualmente cada fin de mes. | Dashboard ejecutivo (`RF-13`) y motor de 4 reportes analíticos en línea (`RF-14` a `RF-17`). |

---

## 2. Catálogo de Actores y Matriz de Control de Acceso (RBAC + JWT)

El sistema implementa autenticación basada en **JSON Web Tokens (JWT HMAC-SHA256)** y autorización basada en roles (**RBAC**) conforme a la regla de negocio **RN-09**:

### 2.1 Definición de los 3 Actores del Sistema
1. **Administrador (`Administrador`):**
   - Máxima autoridad administrativa del sistema.
   - Gestiona el ciclo completo de usuarios (`RF-01` a `RF-04`), el catálogo patrimonial de equipos (`RF-05` a `RF-08`), las operaciones de préstamo y devolución (`RF-09` a `RF-12`), el Dashboard (`RF-13`) y todos los reportes gerenciales (`RF-14` a `RF-17`).
2. **Responsable de Tecnología (`Responsable de Tecnología`):**
   - Especialista del área de Soporte e Infraestructura TI encargado de la custodia física del almacén tecnológico.
   - Administra el inventario de equipos (`RF-05` a `RF-08`), autoriza y ejecuta préstamos y devoluciones figurando como responsable verificador (`RF-09` a `RF-12`, `RN-05`), consulta el padrón de usuarios para asignación y accede al Dashboard y reportes operativos (`RF-13` a `RF-17`). No puede crear, modificar roles ni deshabilitar usuarios corporativos.
3. **Colaborador (`Colaborador`):**
   - Personal de las distintas áreas de Innovatech Solutions S.A.C. que solicita y recibe equipos en calidad de préstamo.
   - Cuenta con acceso de lectura al catálogo de equipos disponibles (`RF-08`), visualización de indicadores generales (`RF-13`), solicitud de préstamos propios en estado `Pendiente` (`RF-09`) y consulta de su propio historial de préstamos (`RF-11`, `RF-12`). Tiene restringidas las operaciones de escritura sobre usuarios, alta/edición/baja de activos, aprobación de préstamos y devoluciones.

### 2.2 Matriz de Permisos por Módulo y Endpoint

| Módulo / Caso de Uso | Requerimientos | Administrador | Responsable de Tecnología | Colaborador |
| :--- | :---: | :---: | :---: | :---: |
| **Autenticación JWT** (`POST /api/auth/login`, `GET /api/auth/me`) | Transversal | Permitido | Permitido | Permitido |
| **Crear / Editar / Deshabilitar Usuarios** | `RF-01`, `RF-02`, `RF-03` | **Permitido** | Denegado (`403`) | Denegado (`403`) |
| **Consultar y Filtrar Usuarios** | `RF-04` | **Permitido** | **Permitido** | Denegado (`403`) |
| **Registrar / Editar / Cambiar Estado de Equipos** | `RF-05`, `RF-06`, `RF-07` | **Permitido** | **Permitido** | Denegado (`403`) |
| **Consultar y Filtrar Inventario de Equipos** | `RF-08` | **Permitido** | **Permitido** | **Permitido** (Lectura) |
| **Solicitar / Aprobar Préstamo y Devolución de Equipos** | `RF-09`, `RF-10` | **Permitido** | **Permitido** | Solo solicita (`Pendiente`); aprobar/devolver denegado (`403`) |
| **Consultar Préstamos Activos e Historial** | `RF-11`, `RF-12` | **Permitido** | **Permitido** | **Permitido** (Lectura) |
| **Visualizar Dashboard de Indicadores** | `RF-13` | **Permitido** | **Permitido** | **Permitido** |
| **Generar Reportes Analíticos y de Movimientos** | `RF-14` a `RF-17` | **Permitido** | **Permitido** | Denegado (`403`) |

---

## 3. Especificación Detallada de los 17 Requerimientos Funcionales (RF-01 a RF-17)

### 3.1 Módulo de Gestión de Usuarios (`RF-01` a `RF-04`)

| Código | Nombre del Requerimiento | Actor(es) | Entradas Principales | Salidas / Postcondición | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **RF-01** | **Registrar nuevos usuarios** | Administrador | `nombres`, `apellidos`, `correo`, `area`, `rol`, `password` | Usuario persistido con `Id` UUID, `Estado = true`, `FechaRegistro` UTC y contraseña cifrada. Valida `RN-08` y `RN-09`. | Alta |
| **RF-02** | **Editar información de usuarios** | Administrador | `id`, `nombres`, `apellidos`, `correo`, `area`, `rol`, `estado` | Datos del usuario actualizados manteniendo unicidad de correo (`RN-08`) y validez de rol (`RN-09`). | Alta |
| **RF-03** | **Deshabilitar usuarios del sistema** | Administrador | `id` del usuario | Cambio lógico `Estado = false` (baja lógica sin borrar historial de préstamos). El usuario queda impedido de recibir nuevos préstamos (`USR-INACTIVO`) e iniciar sesión (`AUTH-02`). | Alta |
| **RF-04** | **Consultar lista de usuarios registrados** | Administrador, Responsable TI | Filtros opcionales: `busqueda` (nombre/correo), `area`, `rol`, `estado` | Listado estructurado de usuarios (`UsuarioDto[]`) con indicador de estado activo/inactivo y área organizacional. | Media |

### 3.2 Módulo de Gestión de Equipos Tecnológicos (`RF-05` a `RF-08`)

| Código | Nombre del Requerimiento | Actor(es) | Entradas Principales | Salidas / Postcondición | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **RF-05** | **Registrar nuevos equipos tecnológicos** | Administrador, Responsable TI | `codigoPatrimonial`, `nombre`, `categoria`, `marca` | Equipo creado con estado inicial `Disponible` y registro automático de movimiento tipo `AltaEquipo` en `movimientos_inventario`. Valida `RN-07`. | Alta |
| **RF-06** | **Editar datos de equipos registrados** | Administrador, Responsable TI | `id`, `codigoPatrimonial`, `nombre`, `categoria`, `marca` | Metadatos técnicos del equipo actualizados garantizando que el código patrimonial no colisione con otro activo (`RN-07`). | Alta |
| **RF-07** | **Cambiar el estado del equipo** | Administrador, Responsable TI | `id`, `nuevoEstado` (`Disponible`, `Prestado`, `Mantenimiento`, `Baja`), `observacion` | Transición de estado ejecutada y auditada en `movimientos_inventario`. Impide cambio manual arbitrario si tiene préstamo activo (`RN-01`) y protege baja con historial (`RN-06`). | Alta |
| **RF-08** | **Consultar y filtrar equipos por categoría, marca o estado** | Administrador, Responsable TI, Colaborador | `busqueda` (código/nombre), `categoria`, `marca`, `estado` | Catálogo filtrado en tiempo real con semáforo de disponibilidad y conteo total de coincidencias. | Alta |

### 3.3 Módulo de Gestión de Préstamos y Devoluciones (`RF-09` a `RF-12`)

| Código | Nombre del Requerimiento | Actor(es) | Entradas Principales | Salidas / Postcondición | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **RF-09** | **Registrar y aprobar préstamos de equipos a usuarios** | Administrador, Responsable TI, Colaborador | `equipoId`, `usuarioId`, `responsableId` (opcional en solicitud), `fechaPrestamo`, `fechaDevolucion`, `observacion` | Si solicita un Colaborador, se crea en estado `Pendiente` (el equipo permanece `Disponible`). Si registra o aprueba (`PATCH /api/prestamos/{id}/aprobar`) Administrador o Responsable TI, pasa a `Activo`, cambia el equipo a `Prestado`, asigna responsable (`RN-05`) y registra movimiento tipo `Prestamo`. Valida `RN-01` a `RN-05`. | Crítica |
| **RF-10** | **Registrar la devolución de equipos prestados** | Administrador, Responsable TI | `prestamoId`, `observacion`, `fechaDevolucionReal`, `estadoEquipoDestino` (`Disponible` o `Mantenimiento`) | Transacción atómica: valida `RN-10` (observaciones obligatorias), marca el préstamo como `Devuelto`, actualiza el equipo a `Disponible` (o `Mantenimiento` si retornó con avería) e inserta movimiento tipo `Devolucion`. | Crítica |
| **RF-11** | **Consultar préstamos activos** | Administrador, Responsable TI, Colaborador | Filtros opcionales de búsqueda por código patrimonial o colaborador | Listado de todos los préstamos vigentes (`"EstadoPrestamo" = 'Activo'`) con cálculo visual de días restantes o vencimiento. | Alta |
| **RF-12** | **Consultar historial de préstamos por usuario o por equipo** | Administrador, Responsable TI, Colaborador | `usuarioId`, `equipoId`, `estadoPrestamo` (`Pendiente` / `Activo` / `Devuelto`) | Cronología completa de préstamos con fechas de entrega, devolución estimada, devolución real, responsable TI y observaciones de recepción. | Alta |

### 3.4 Módulo de Dashboard y Reportes Gerenciales (`RF-13` a `RF-17`)

| Código | Nombre del Requerimiento | Actor(es) | Entradas Principales | Salidas / Postcondición | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **RF-13** | **Visualizar dashboard con indicadores del inventario** | Todos los roles autenticados | Token de sesión activa | KPIs consolidados: total de equipos, disponibles, prestados, en mantenimiento, dados de baja, préstamos activos, usuarios activos y distribución por categorías. | Alta |
| **RF-14** | **Generar reporte de equipos por estado** | Administrador, Responsable TI | Filtro opcional `estado` | Agrupación cuantitativa y porcentual de activos según su estado operativo (`Disponible`, `Prestado`, `Mantenimiento`, `Baja`) más detalle tabular exportable. | Media |
| **RF-15** | **Generar reporte de equipos más utilizados** | Administrador, Responsable TI | Parámetro opcional `top` (ej. Top 10) | Ranking descendente de equipos según cantidad total de préstamos históricos y activos, detallando código patrimonial, categoría, marca y último préstamo. | Media |
| **RF-16** | **Generar reporte de préstamos por área** | Administrador, Responsable TI | Rango opcional de fechas | Consolidado por área organizacional (*Ingeniería de Software*, *Consultoría*, *Finanzas*, etc.) indicando total de préstamos, activos, devueltos y porcentaje de demanda. | Media |
| **RF-17** | **Generar reporte de historial de movimientos de equipos** | Administrador, Responsable TI | Filtros opcionales: `equipoId`, `tipoMovimiento` | Bitácora cronológica auditable con fecha/hora exacta, código patrimonial, tipo de movimiento, transición `EstadoAnterior → EstadoNuevo`, colaborador y responsable TI. | Alta |

---

## 4. Catálogo de las 10 Reglas de Negocio (RN-01 a RN-10)

Cada regla de negocio ha sido implementada con **defensa en profundidad** en tres niveles: validación preventiva en Frontend (React + Zod), validación de negocio en la capa de Aplicación/Dominio (.NET 8) y restricción declarativa en el motor PostgreSQL (`CHECK`, `UNIQUE`, `FOREIGN KEY`).

| Código | Enunciado Oficial de la Regla de Negocio | Código HTTP | Capa de Validación y Mecanismo Técnico | Mensaje de Error Estándar al Usuario |
| :--- | :--- | :---: | :--- | :--- |
| **RN-01** | Un equipo no puede prestarse si ya se encuentra prestado. | `409 Conflict` | `PrestamoService.RegistrarPrestamoAsync` + Índice único parcial `ix_prestamos_equipo_activo` en PostgreSQL. | `RN-01: El equipo seleccionado ya cuenta con un préstamo activo y no puede prestarse simultáneamente.` |
| **RN-02** | Un equipo en estado de mantenimiento no puede ser prestado. | `422 Unprocessable Entity` | `Equipo.ValidarDisponibleParaPrestamo()` + `PrestamoService.RegistrarPrestamoAsync` / `AprobarPrestamoAsync`. | `RN-02: No se puede prestar un equipo en estado 'Mantenimiento'.` |
| **RN-03** | Un equipo dado de baja no puede ser asignado a ningún préstamo. | `422 Unprocessable Entity` | `Equipo.ValidarDisponibleParaPrestamo()` + `PrestamoService.RegistrarPrestamoAsync` / `AprobarPrestamoAsync`. | `RN-03: No se puede prestar un equipo en estado 'Baja'.` |
| **RN-04** | La fecha de devolución debe ser posterior a la fecha de préstamo. | `400 Bad Request` | Esquema `Zod` en formulario React + `CrearPrestamoValidator` + `Prestamo.Crear`/`CrearSolicitud` + `CHECK ("FechaDevolucion" > "FechaPrestamo")` en SQL. | `RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo.` |
| **RN-05** | Todo préstamo aprobado/activo debe tener un usuario responsable asignado. | `400 Bad Request` | Validación de `ResponsableId` válido y activo (`Prestamo.ValidarResponsableId` + `PrestamoService`) + `CHECK ck_prestamos_responsable_activo` (`NULL` en `Pendiente`, obligatorio en `Activo` y `Devuelto`). | `RN-05: Todo préstamo debe tener un usuario responsable registrado.` |
| **RN-06** | No se puede eliminar un equipo que tenga historial de préstamos. | `409 Conflict` | `EquipoService.EliminarOBajaLogicaAsync` + `Equipo.DarDeBajaLogica()` + `ON DELETE RESTRICT` en SQL. | `RN-06: No se puede eliminar un equipo con historial de préstamos. Utilice la baja lógica cambiando su estado a 'Baja'.` |
| **RN-07** | Cada equipo debe contar con un código patrimonial único. | `409 Conflict` | `EquipoService` valida unicidad normalizada (`Trim().ToUpperInvariant()`) + índice único `"IX_Equipos_CodigoPatrimonial"` sobre `"CodigoPatrimonial"`. | `RN-07: El código patrimonial del equipo debe ser único.` |
| **RN-08** | No pueden existir dos usuarios con el mismo correo electrónico. | `409 Conflict` | `UsuarioService` valida unicidad case-insensitive (`ToLowerInvariant()`) + índice único `"IX_Usuarios_Correo"` sobre `"Correo"`. | `RN-08: El correo electrónico del usuario debe ser único.` |
| **RN-09** | Solo el Administrador podrá deshabilitar usuarios; RBAC por rol en endpoints. | `403 Forbidden` | Middleware JWT + políticas `[Authorize(Roles = ...)]` + `Usuario.CambiarEstado()` + `CHECK ck_usuarios_rol`. | `RN-09: Solo el Administrador podrá deshabilitar usuarios.` |
| **RN-10** | Toda devolución deberá registrar observaciones (y usuarios inactivos bloqueados por `USR-INACTIVO` / `422`). | `400 Bad Request` | `RegistrarDevolucionValidator` + `Prestamo.RegistrarDevolucion()` (`RN-10`); `PrestamoService` valida `usuario.Estado == true` (`USR-INACTIVO`, `422`). | `RN-10: Toda devolución deberá registrar observaciones.` |

---

## 5. Matriz de Trazabilidad Completa (RF ↔ RN ↔ API REST ↔ Backend ↔ Frontend)

| RF | Reglas Asociadas | Endpoint REST | Método y Servicio Backend (.NET 8) | Página y Componentes Frontend (React + TS) |
| :---: | :---: | :--- | :--- | :--- |
| **RF-01** | `RN-08`, `RN-09` | `POST /api/usuarios` | `UsuarioService.CrearAsync` | `UsuariosPage.tsx` → `Modal`, `FormField`, `Button` |
| **RF-02** | `RN-08`, `RN-09` | `PUT /api/usuarios/{id}` | `UsuarioService.ActualizarAsync` | `UsuariosPage.tsx` → `Modal` de edición |
| **RF-03** | `RN-09`, `USR-INACTIVO` | `PATCH /api/usuarios/{id}/deshabilitar` | `UsuarioService.CambiarEstadoAsync` | `UsuariosPage.tsx` → `ConfirmDialog`, `Badge` |
| **RF-04** | `RN-09` | `GET /api/usuarios` | `UsuarioService.ListarAsync` | `UsuariosPage.tsx` → `Input` (búsqueda/filtros), `DataTable` |
| **RF-05** | `RN-07`, `RN-09` | `POST /api/equipos` | `EquipoService.CrearAsync` | `EquiposPage.tsx` → `Modal` alta de activo |
| **RF-06** | `RN-07`, `RN-09` | `PUT /api/equipos/{id}` | `EquipoService.ActualizarAsync` | `EquiposPage.tsx` → `Modal` edición de activo |
| **RF-07** | `RN-01`, `RN-06`, `RN-09` | `PATCH /api/equipos/{id}/estado` y `DELETE /api/equipos/{id}` | `EquipoService.CambiarEstadoAsync` / `EliminarOBajaLogicaAsync` | `EquiposPage.tsx` → `Badge`, `ConfirmDialog` |
| **RF-08** | — | `GET /api/equipos` | `EquipoService.ListarAsync` | `EquiposPage.tsx` → filtros, `DataTable` |
| **RF-09** | `RN-01` a `RN-05`, `USR-INACTIVO` | `POST /api/prestamos` y `PATCH /api/prestamos/{id}/aprobar` | `PrestamoService.RegistrarPrestamoAsync` / `AprobarPrestamoAsync` | `PrestamosPage.tsx` → `PrestamoFormModal` |
| **RF-10** | `RN-10` | `POST /api/prestamos/{id}/devolucion` | `PrestamoService.RegistrarDevolucionAsync` | `PrestamosPage.tsx` → `DevolucionModal` |
| **RF-11** | — | `GET /api/prestamos/activos` | `PrestamoService.ListarActivosAsync` | `PrestamosPage.tsx` (Pestaña Activos) |
| **RF-12** | — | `GET /api/prestamos` | `PrestamoService.ListarAsync` | `PrestamosPage.tsx` (Pestañas Pendientes / Historial) |
| **RF-13** | — | `GET /api/dashboard` | `ReporteService.ObtenerDashboardAsync` | `DashboardPage.tsx` → `Card`, 6 KPIs y gráficos |
| **RF-14** | — | `GET /api/reportes/equipos-por-estado` | `ReporteService.ObtenerEquiposPorEstadoAsync` | `ReportesPage.tsx` (Tab 1: Equipos por Estado) |
| **RF-15** | — | `GET /api/reportes/equipos-mas-utilizados` | `ReporteService.ObtenerEquiposMasUtilizadosAsync` | `ReportesPage.tsx` (Tab 2: Ranking de Uso) |
| **RF-16** | — | `GET /api/reportes/prestamos-por-area` | `ReporteService.ObtenerPrestamosPorAreaAsync` | `ReportesPage.tsx` (Tab 3: Préstamos por Área) |
| **RF-17** | `RN-06` | `GET /api/reportes/movimientos` | `ReporteService.ObtenerMovimientosAsync` | `ReportesPage.tsx` (Tab 4: Bitácora de Movimientos) |

---

## 6. Selección y Justificación del Ciclo de Vida del Software

### 6.1 Enfoque Seleccionado: Ágil Iterativo e Incremental (Híbrido Scrum / Kanban)
Para la construcción de **TechAsset** se seleccionó un **Ciclo de Vida Iterativo e Incremental basado en marcos ágiles (Scrum con tablero Kanban de flujo continuo)** estructurado en **6 Sprints de 2 semanas cada uno (12 semanas académicas)**, alineados de forma biunívoca con las **6 Actividades del Caso Práctico**.

### 6.2 Justificación Técnica frente a Otros Modelos
1. **Entregas funcionales tempranas y verificables:** A diferencia del modelo en Cascada puro, el enfoque iterativo-incremental permite disponer desde el Sprint 2 de los módulos de entrada (`Usuarios`, `Equipos`, `Préstamos`) operando contra una base de datos relacional real, facilitando la validación temprana de las reglas `RN-01` a `RN-10`.
2. **Capacidad de refactorización continua (Actividad 3):** El ciclo incremental incorpora una fase explícita de mejora de diseño interno (POO, principios SOLID y componentes UI genéricos en React) sin romper los contratos de la API REST previamente estabilizados.
3. **Mitigación temprana de riesgos de integración Full-Stack (Actividad 4):** Al integrar progresivamente el cliente React + TypeScript con los controladores ASP.NET Core 8 y el esquema PostgreSQL, se eliminan los cuellos de botella de integración tardía.
4. **Alineación pedagógica y trazabilidad de entregables:** Cada iteración culmina con un incremento de software probado, versionado en Git bajo *Conventional Commits* y respaldado por pruebas unitarias automatizadas en `xUnit`.

### 6.3 Planificación del Desarrollo en 6 Sprints (Semanas 01 a 12)

| Sprint / Actividad del Caso | Semanas | Objetivo del Incremento | Requerimientos y Reglas Cubiertos | Entregables Verificables |
| :--- | :---: | :--- | :--- | :--- |
| **Sprint 1 — Actividad 1:** Análisis, Arquitectura y Estándares | Semanas 01 – 02 | Comprender la problemática de Innovatech Solutions S.A.C., definir el modelo de datos, arquitectura en capas y estándares de codificación. | Análisis de `RF-01` a `RF-17` y `RN-01` a `RN-10`. Diseño de tablas SQL. | `docs/01-analisis-y-planificacion.md`, `docs/02-estandares-y-arquitectura.md`, `database/init_techasset.sql`. |
| **Sprint 2 — Actividad 2:** Construcción de Módulos de Entrada | Semanas 03 – 04 | Implementar el registro, edición y validación de Usuarios, Equipos, Préstamos y Devoluciones con reglas de negocio. | `RF-01`, `RF-02`, `RF-03`, `RF-05`, `RF-06`, `RF-07`, `RF-09`, `RF-10` + `RN-01`..`RN-10`. | Controladores y servicios de entrada en `.NET 8` + formularios validados en React con `Zod`. |
| **Sprint 3 — Actividad 2 (Parte B):** Construcción de Módulos de Salida | Semanas 05 – 06 | Implementar las consultas filtradas, vistas de préstamos activos/históricos, Dashboard de indicadores y los 4 reportes analíticos. | `RF-04`, `RF-08`, `RF-11`, `RF-12`, `RF-13`, `RF-14`, `RF-15`, `RF-16`, `RF-17`. | `DashboardPage.tsx`, `ReportesPage.tsx`, `ReporteService.cs` y exportación CSV/impresión. |
| **Sprint 4 — Actividad 3:** Reutilización, POO, SOLID y Refactorización | Semanas 07 – 08 | Elevar la calidad interna del código mediante componentes UI reutilizables, custom hooks, FluentValidation/excepciones de dominio y encapsulamiento rico. | Transversal a los 17 RF y 10 RN. | 13 componentes UI reutilizables en `frontend/src/components/ui/`, hooks `useApi`/`useCarga`/`useForm` y `docs/refactorizacion.md`. |
| **Sprint 5 — Actividad 4 y 5:** Integración Full-Stack, UX/DCU y Pruebas | Semanas 09 – 10 | Integrar extremo a extremo Frontend + Backend + BD con seguridad JWT, aplicar heurísticas de usabilidad y ejecutar pruebas unitarias e integrales. | Verificación de los 7 escenarios mínimos y las 10 reglas de negocio. | Suite de pruebas `TechAsset.Tests` (xUnit), `postman/TechAsset.postman_collection.json`, `docs/usabilidad.md`. |
| **Sprint 6 — Actividad 6:** Documentación Final y Sustentación | Semanas 11 – 12 | Consolidar el informe técnico académico, validar todos los criterios de la rúbrica (20/20) y preparar el guion de demostración en vivo. | Cobertura integral del caso práctico y pregunta de reflexión (Sección 13). | `docs/informe-tecnico.md`, `docs/guion-sustentacion.md` y `README.md` principal. |

---

## 7. Comparativa de Cobertura: Enunciado Oficial del PDF vs. Implementación TechAsset

| Dimensión del Caso Práctico Oficial | Especificación Exigida en el PDF | Implementación Entregada en TechAsset | Estado |
| :--- | :--- | :--- | :---: |
| **Empresa y Escala** | Innovatech Solutions S.A.C. (+500 colaboradores, 7 categorías de activos) | Modelada con datos reales de las 7 categorías (`Laptops`, `Computadoras de escritorio`, `Monitores`, `Impresoras`, `Tablets`, `Proyectores multimedia`, `Equipos de red`). | **100% Logrado** |
| **Actores del Sistema** | 3 actores: `Administrador`, `Responsable de Tecnología`, `Colaborador` | Autenticación JWT y autorización RBAC para los 3 roles con cuentas listas para demostración. | **100% Logrado** |
| **Requerimientos Funcionales** | 17 requerimientos (`RF-01` al `RF-17`) divididos en 4 módulos | Todos los 17 RF implementados tanto en la API REST (.NET 8) como en la SPA (React 19 + TypeScript). | **100% Logrado** |
| **Reglas de Negocio** | 10 reglas (`RN-01` al `RN-10`) | Validadas en Frontend, Capa de Aplicación/Dominio y Base de Datos PostgreSQL, más pruebas automatizadas en xUnit. | **100% Logrado** |
| **Modelo de Datos** | 4 entidades principales: `Usuario`, `Equipo`, `Prestamo`, `MovimientoInventario` | Esquema EF Core + script DDL `database/init_techasset.sql` con todos los campos, llaves foráneas, `CHECK` e índices únicos. | **100% Logrado** |
| **Escenarios de Sustentación** | 7 escenarios mínimos obligatorios + Pregunta de reflexión (Sección 13) | Documentados paso a paso y verificados en `docs/informe-tecnico.md` y `docs/guion-sustentacion.md`. | **100% Logrado** |
