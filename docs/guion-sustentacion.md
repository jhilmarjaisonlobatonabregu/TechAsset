# Guion de Sustentación — TechAsset (Innovatech Solutions S.A.C.)

> **Duración estimada:** 6 minutos (rango objetivo: 5 – 7 minutos)  
> **Evaluación:** Caso Práctico Integrador — Construcción de Software (Semanas 01–12)  
> **URLs de demostración:** Frontend `http://localhost:5173` · Backend Swagger `http://localhost:5080/swagger`

---

## Preparación previa a la sustentación (30 segundos antes)

1. Confirmar PostgreSQL activo con la base `techasset_db`.
2. Iniciar Backend: `dotnet run --project backend/TechAsset.API` (`http://localhost:5080`).
3. Iniciar Frontend: `npm run dev` en `frontend/` (`http://localhost:5173`).
4. Tener abiertas dos pestañas en el navegador:
   - Pestaña 1: **TechAsset Web (`http://localhost:5173`)** en la Landing Page pública (con botón **Iniciar sesión** hacia el Login).
   - Pestaña 2: **Swagger UI (`http://localhost:5080/swagger`)** para mostrar la documentación REST.

---

## Estructura Minuto a Minuto

### 1. Introducción y Contexto del Problema (0:00 – 0:45)
- **Discurso:**
  *"Buenos días. Presento **TechAsset**, el Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos diseñado para **Innovatech Solutions S.A.C.**, una empresa con más de 500 colaboradores. Antes de TechAsset, el control de laptops, monitores, proyectores y equipos de red se llevaba en hojas de cálculo manuales, provocando pérdida de información, duplicidad de códigos, desconocimiento de ubicación y lentitud en préstamos y devoluciones."*
- **En pantalla:** Mostrar primero la **Landing Page** (`http://localhost:5173`) y pulsar **Iniciar sesión** para pasar al Login, destacando el acceso JWT y los 3 roles institucionales definidos en el caso práctico: **Administrador**, **Responsable de Tecnología** y **Colaborador**.

---

### 2. Arquitectura y Estándares Aplicados (0:45 – 1:15)
- **Discurso:**
  *"Construimos el sistema bajo **Clean Architecture** en **ASP.NET Core 8** (`Domain`, `Application`, `Infrastructure`, `API`), **Entity Framework Core** con **PostgreSQL**, validación con **FluentValidation** y pruebas unitarias en **xUnit**. En el frontend usamos **React 19, TypeScript, Vite y Tailwind CSS**, con **React Hook Form + Zod** y 13 componentes UI reutilizables. Además, aplicamos principios de usabilidad DCU (ISO 9241-210), Shneiderman, Nielsen y Norman."*
- **En pantalla:** Mostrar brevemente Swagger (`http://localhost:5080/swagger`) y regresar al Frontend.

---

### 3. Demostración en Vivo de los 7 Escenarios Mínimos (1:15 – 5:15)

#### Escenario 1: Registrar usuario (`RF-01`, `RN-08`, `RN-09`) — *(1:15 – 1:50)*
- **Acción:** Iniciar sesión como **Administrador** (`cmendoza@innovatech.pe` / `Admin2026!`) mediante el formulario de inicio de sesión. Ir a **Usuarios y Accesos** → **Registrar usuario**.
- **Datos demo:** Nombres: *Sofía*, Apellidos: *Huamán Pérez*, Correo: *shuaman@innovatech.pe*, Área: *Desarrollo de Software*, Rol: *Colaborador*.
- **Regla a destacar:** Si ingresamos un correo existente (`atorres@innovatech.pe`), el backend responde `409 Conflict` con `RN-08`. Al cerrar sesión e ingresar como *Responsable de Tecnología* (`lquispe@innovatech.pe` / `Soporte2026!`), mostrar que el botón de deshabilitar usuario está restringido por `RN-09` (`403 Forbidden` en API). Volver a ingresar como *Administrador*.

#### Escenario 2: Registrar equipo (`RF-05`, `RN-07`) — *(1:50 – 2:25)*
- **Acción:** Ir a **Inventario de Equipos** → **Registrar equipo**.
- **Datos demo:** Código Patrimonial: `INV-LAP-2026`, Nombre: *Laptop Lenovo ThinkPad T14*, Categoría: *Laptops*, Marca: *Lenovo*, Estado: *Disponible*.
- **Regla a destacar:** Validar en el acto que el código patrimonial es único (`RN-07`).

#### Escenario 3: Registrar préstamo (`RF-09`, `RN-01`..`RN-05`) — *(2:25 – 3:10)*
- **Acción:** Ir a **Préstamos y Devoluciones** → **Registrar préstamo**.
- **Regla a destacar antes de guardar:**
  1. Activar *"Mostrar también equipos no disponibles"* y seleccionar un equipo en `Mantenimiento` para mostrar la alerta `RN-02` (y rechazo `422` en backend).
  2. Seleccionar una fecha de devolución anterior a la de préstamo para mostrar la validación instantánea de `RN-04`.
- **Registro válido:** Seleccionar el equipo `INV-LAP-2026`, colaborador *Alejandro Torres Mejía*, responsable *Lucía Quispe* (`RN-05`), fecha préstamo hoy y devolución +7 días, observación *"Asignación para sprint de desarrollo"*. Confirmar. El equipo pasa automáticamente a estado **Prestado** (`RN-01`). (Si la solicitud la envía un **Colaborador**, se registra en estado **Pendiente** manteniendo el equipo **Disponible** hasta su aprobación en `PATCH /api/prestamos/{id}/aprobar`.)

#### Escenario 4: Registrar devolución (`RF-10`, `RN-10`) — *(3:10 – 3:50)*
- **Acción:** En la pestaña **Préstamos activos (`RF-12`)**, pulsar **Devolver** sobre el préstamo recién creado.
- **Regla a destacar:** Intentar confirmar sin observación para evidenciar `RN-10` (*Toda devolución deberá registrar observaciones*).
- **Registro válido:** Ingresar *"Equipo devuelto con cargador original y sin daños"*, estado destino **Disponible**, y confirmar. El equipo vuelve a estar disponible y se registra el movimiento en auditoría.

#### Escenario 5: Consultar inventario (`RF-07`, `RF-14`, `RN-06`) — *(3:50 – 4:20)*
- **Acción:** Ir a **Inventario de Equipos**. Aplicar los chips rápidos (*Disponible*, *Prestado*, *Mantenimiento*, *Baja*) y buscar `INV-LAP-2026`.
- **Regla a destacar:** Intentar eliminar el equipo `INV-LAP-2026` (que ya tiene historial de préstamo) para mostrar que **`RN-06`** impide el borrado físico (`409 Conflict`) y aplica **baja lógica** conservando el historial. Exportar CSV.

#### Escenario 6: Consultar historial de préstamos (`RF-11`, `RF-12`, `RF-17`) — *(4:20 – 4:45)*
- **Acción:** Ir a **Préstamos y Devoluciones** → pestaña **Historial completo (`RF-11`)**. Filtrar por área (*Desarrollo de Software*) y rango de fechas. Luego abrir **Reportes y Movimientos** → **Historial de movimientos (`RF-17`)** para mostrar la bitácora exacta de `AltaEquipo`, `Prestamo`, `Devolucion` y `BajaLogica`.

#### Escenario 7: Consultar dashboard (`RF-13`, `RF-15`, `RF-16`) — *(4:45 – 5:15)*
- **Acción:** Ir a **Dashboard General**. Señalar los **6 indicadores mínimos obligatorios**:
  1. Total de equipos
  2. Equipos disponibles
  3. Equipos prestados
  4. Equipos en mantenimiento
  5. Total de préstamos
  6. Área con mayor uso (*Desarrollo de Software*)
- Mostrar los gráficos de **Equipos por estado**, **Préstamos por área** y **Top equipos más usados**.

---

### 4. Respuesta a la Pregunta de Reflexión y Cierre (5:15 – 6:15)
- **Discurso:**
  *"Para concluir, respondo a la pregunta de reflexión: la aplicación de **estándares de construcción** (`PascalCase`/`camelCase`, commits convencionales y estructura limpia) hace que cualquier desarrollador entienda el código rápidamente; la **validación en doble capa** (React Hook Form + Zod en frontend y FluentValidation + dominio en backend) garantiza que ninguna regla de negocio como `RN-01` o `RN-04` pueda ser vulnerada ni siquiera desde Postman; la **reutilización de componentes** (`DataTable`, `Modal`, `FormField`, `useCarga`) y el **refinamiento de código** eliminaron duplicación en todas las vistas; y la **POO junto a Clean Architecture** desacopló la lógica de negocio de PostgreSQL y de React, permitiendo escalar el sistema añadiendo nuevos reportes o módulos sin romper los existentes. Muchas gracias, quedo atento a sus preguntas."*
