# 03. Reutilización de Componentes, POO, Principios SOLID y Refactorización

**Sistema:** TechAsset — Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos  
**Organización:** Innovatech Solutions S.A.C.  
**Curso / Evaluación:** Construcción de Software — Caso Práctico Integral (Criterio 3)

---

## 1. Catálogo de Componentes Reutilizables y Hooks en el Frontend

Para evitar la duplicación de código visual y de comportamiento entre los módulos de **Usuarios**, **Equipos**, **Préstamos**, **Dashboard** y **Reportes**, se diseñó una biblioteca interna de **13 componentes UI desacoplados** y **2 custom hooks** ubicados en `frontend/src/components/ui/` y `frontend/src/hooks/`:

### 1.1 Los 13 Componentes de Interfaz Reutilizables

| # | Componente | Archivo | Responsabilidad y Parametrización (`Props`) | Dónde se Reutiliza |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **`Button`** | `ui/Button.tsx` | Botón accesible con variantes semánticas (`primary`, `secondary`, `danger`, `ghost`, `outline`), tamaños (`sm`, `md`, `lg`), estado `isLoading` e ícono izquierdo/derecho. | Todas las páginas y modales del sistema (más de 35 instancias). |
| 2 | **`FormField`** | `ui/FormField.tsx` | Contenedor declarativo de campo de formulario con etiqueta `<label>`, indicador de obligatoriedad `*`, texto de ayuda y mensaje de error vinculado por `aria-describedby`. | Formularios de Login, Alta/Edición de Usuario, Alta/Edición de Equipo, Nuevo Préstamo y Devolución. |
| 3 | **`SelectField`** | `ui/SelectField.tsx` | Selector desplegable tipado con soporte para opción vacía controlada, estado de error y deshabilitación. | Selección de Rol (`RN-09`), Área, Categoría de Equipo, Estado Operativo y Colaborador/Equipo en préstamos. |
| 4 | **`SearchFilterBar`** | `ui/SearchFilterBar.tsx` | Barra unificada de búsqueda instantánea con ícono de lupa, botón de limpieza rápida y ranura (`children`) para filtros adicionales por categoría, marca o estado. | `UsuariosPage`, `EquiposPage` (`RF-08`), `PrestamosPage` (`RF-11`, `RF-12`) y `ReportesPage`. |
| 5 | **`DataTable<T>`** | `ui/DataTable.tsx` | Tabla genérica fuertemente tipada en TypeScript (`ColumnDef<T>[]`) con ordenamiento por columna, paginación integrada, estado de carga y renderizado de celdas personalizadas. | Tablas de Usuarios, Inventario de Equipos, Préstamos Activos/Históricos y los 4 Reportes Gerenciales. |
| 6 | **`StatusBadge`** | `ui/StatusBadge.tsx` | Etiqueta semántica con código de color e indicador de punto para estados de equipo (`Disponible`, `Prestado`, `Mantenimiento`, `Baja`), préstamo (`Activo`, `Devuelto`) y usuario (`Activo`, `Inactivo`). | Inventario, Préstamos, Usuarios, Dashboard y Bitácora de Movimientos. |
| 7 | **`StatCard`** | `ui/StatCard.tsx` | Tarjeta ejecutiva de indicador clave (KPI) con título, valor numérico destacado, subtítulo porcentual, ícono y paleta cromática configurable. | `DashboardPage` (`RF-13`) y cabeceras de resumen en `EquiposPage`, `PrestamosPage` y `ReportesPage`. |
| 8 | **`Modal`** | `ui/Modal.tsx` | Ventana modal accesible (`role="dialog"`, `aria-modal="true"`) con cierre por tecla `Escape`, bloqueo de scroll de fondo y pie de acciones parametrizable. | Creación/edición de usuarios, alta/edición/cambio de estado de equipos, registro de préstamos y devoluciones. |
| 9 | **`ConfirmDialog`** | `ui/ConfirmDialog.tsx` | Diálogo de confirmación preventiva para acciones críticas o irreversibles (deshabilitar usuario `RF-03`, dar de baja o eliminar equipo `RN-06`). | `UsuariosPage` y `EquiposPage`. |
| 10 | **`AlertBanner`** | `ui/AlertBanner.tsx` | Banner contextual (`error`, `warning`, `success`, `info`) que presenta de forma destacada el código y detalle de cualquier regla de negocio infringida (`RN-01` a `RN-10`). | Todos los formularios transaccionales y vistas de listado. |
| 11 | **`EmptyState`** | `ui/EmptyState.tsx` | Vista informativa cuando una consulta o filtro no arroja resultados, ofreciendo un botón de acción directa para limpiar filtros o crear el primer registro. | Integrado en `DataTable<T>` y secciones de Dashboard. |
| 12 | **`LoadingSpinner`** | `ui/LoadingSpinner.tsx` | Indicador visual de progreso asíncrono con etiqueta accesible para lectores de pantalla. | `ProtectedRoute`, `DataTable` y botones en estado de envío. |
| 13 | **`PageHeader`** | `ui/PageHeader.tsx` | Encabezado estandarizado de página con migas de contexto, título principal, descripción operativa y barra de botones de acción primaria/exportación. | Las 5 páginas interiores del sistema. |

### 1.2 Custom Hooks Reutilizables
- **`useApi<T>` (`src/hooks/useApi.ts`):** Encapsula el ciclo de vida completo de peticiones HTTP asíncronas (`data`, `loading`, `error`, `execute`, `reset`), extrayendo automáticamente el mensaje estructurado de error enviado por el backend cuando se activa una regla de negocio (`RN-01`..`RN-10`).
- **`useFormValidation<T>` (`src/hooks/useFormValidation.ts`):** Integra esquemas declarativos de validación (`Zod`) con el estado del formulario, permitiendo validar reglas como `RN-04` (`fechaDevolucion > fechaPrestamo`), formato de correo (`RN-08`) y código patrimonial (`RN-07`) antes de invocar la red.

---

## 2. Aplicación de Programación Orientada a Objetos (POO) y Principios SOLID

### 2.1 Pilares de POO Aplicados en TechAsset
1. **Encapsulamiento y Modelo de Dominio Rico:** Las entidades `Equipo`, `Prestamo` y `Usuario` no son simples contenedores pasivos de datos; incluyen métodos de comportamiento de dominio (`Equipo.PuedeSerPrestado()`, `Equipo.RegistrarSalidaPrestamo()`, `Prestamo.CerrarDevolucion()`, `Usuario.EstaHabilitadoParaPrestamo()`) que protegen las invariantes de negocio.
2. **Abstracción:** La capa de Aplicación define contratos claros (`IUsuarioService`, `IEquipoService`, `IPrestamoService`, `IReporteService`) desacoplando qué hace el negocio de cómo se persiste en PostgreSQL/EF Core.
3. **Polimorfismo e Inyección de Dependencias:** Los servicios consumen abstracciones inyectadas en el contenedor IoC de ASP.NET Core 8, lo que permite sustituir la infraestructura real por bases de datos en memoria durante la ejecución de las pruebas unitarias en `TechAsset.Tests`.

### 2.2 Los 5 Principios SOLID en la Arquitectura del Proyecto

| Principio SOLID | Implementación Concreta en TechAsset | Beneficio Obtenido |
| :--- | :--- | :--- |
| **S — Single Responsibility Principle (Responsabilidad Única)** | `PrestamosController` solo gestiona el transporte HTTP; `PrestamoService` coordina el caso de uso de préstamo/devolución; `JwtTokenGenerator` solo firma tokens JWT; `ExceptionHandlingMiddleware` centraliza el formateo de errores HTTP. | Facilita localizar y modificar reglas de negocio sin afectar el transporte HTTP ni la seguridad. |
| **O — Open/Closed Principle (Abierto/Cerrado)** | El componente `DataTable<T>` y el patrón `Result<T>` están abiertos a la extensión (nuevas entidades, nuevas columnas con `render` personalizado o nuevos tipos de reporte) pero cerrados a la modificación de su motor interno. | Se agregaron los 4 reportes (`RF-14` a `RF-17`) reutilizando `DataTable<T>` sin tocar una sola línea de su implementación. |
| **L — Liskov Substitution Principle (Sustitución de Liskov)** | Las implementaciones de servicios e infraestructura cumplen estrictamente las precondiciones y postcondiciones de sus interfaces (`IEquipoService`, `IPrestamoService`), devolviendo siempre objetos `Result<T>` consistentes sin lanzar excepciones inesperadas para flujos de negocio controlados. | Comportamiento predecible tanto en producción como en las pruebas automatizadas con `xUnit`. |
| **I — Interface Segregation Principle (Segregación de Interfaces)** | En lugar de un único servicio monolítico `IInventarioGeneralService`, los contratos están segregados por cohesión funcional: `IAuthService`, `IUsuarioService`, `IEquipoService`, `IPrestamoService` e `IReporteService`. | Cada controlador o consumidor depende exclusivamente de los métodos que realmente utiliza. |
| **D — Dependency Inversion Principle (Inversión de Dependencias)** | Los controladores de `TechAsset.API` y casos de uso dependen de las interfaces definidas en `TechAsset.Application.Interfaces`, nunca de implementaciones concretas de infraestructura. | Permite probar todas las reglas `RN-01` a `RN-10` en menos de 2 segundos mediante pruebas unitarias aisladas. |

---

## 3. Cinco Casos Reales de Refactorización (Antes vs. Después)

A continuación se documentan **5 refactorizaciones estructurales** ejecutadas durante la **Actividad 3** para eliminar *code smells* (controladores obesos, consultas duplicadas, modelo anémico, formularios repetitivos y tablas acopladas).

---

### Refactorización 1: Extracción de Reglas de Negocio (`RN-01`..`RN-05`, `RN-10`) desde el Controlador hacia el Servicio con Patrón `Result<T>`

- **Problema detectado (*Code Smell: Fat Controller & Spaghetti Validation*):** Inicialmente el controlador `PrestamosController` consultaba directamente el `DbContext`, encadenaba condicionales `if` anidados para validar `RN-01` a `RN-05` y `RN-10`, y no garantizaba atomicidad entre el cambio de estado del equipo y la inserción de la bitácora.
- **Técnica aplicada:** *Extract Service + Result Pattern + Rich Domain Validation*.

#### Antes de la Refactorización
```csharp
// ANTES: Controlador acoplado a EF Core con validaciones dispersas y sin bitácora atómica
[HttpPost]
public async Task<IActionResult> CrearPrestamo([FromBody] CrearPrestamoDto dto)
{
    var equipo = await _db.Equipos.FindAsync(dto.EquipoId);
    if (equipo == null) return NotFound("Equipo no existe");
    if (equipo.Estado == "Prestado") return Conflict("Ya está prestado"); // RN-01 incompleto
    if (equipo.Estado == "Mantenimiento") return Conflict("En mantenimiento"); // RN-02
    if (equipo.Estado == "Baja") return Conflict("Dado de baja"); // RN-03

    var usuario = await _db.Usuarios.FindAsync(dto.UsuarioId);
    if (usuario == null || !usuario.Estado) return UnprocessableEntity("Usuario inactivo"); // RN-10

    if (dto.FechaDevolucion <= dto.FechaPrestamo) return BadRequest("Fechas inválidas"); // RN-04

    equipo.Estado = "Prestado";
    _db.Prestamos.Add(new Prestamo { /* asignación manual sin movimiento de auditoría */ });
    await _db.SaveChangesAsync();
    return Ok();
}
```

#### Después de la Refactorización
```csharp
// DESPUÉS: Thin Controller limpio + Servicio transaccional con Result<PrestamoDto>
[HttpPost]
[Authorize(Roles = "Administrador,Responsable de Tecnología")] // RN-09
public async Task<IActionResult> RegistrarPrestamo([FromBody] CrearPrestamoDto dto)
{
    var resultado = await _prestamoService.RegistrarPrestamoAsync(dto);
    if (!resultado.IsSuccess)
        return StatusCode(resultado.StatusCode, new { error = resultado.Error, codigoRegla = resultado.RuleCode });

    return CreatedAtAction(nameof(ObtenerPorId), new { id = resultado.Value!.Id }, resultado.Value);
}
```

```csharp
// En PrestamoService.cs: Validación sistemática de RN-01 a RN-05 y RN-10 + Bitácora RF-17
public async Task<Result<PrestamoDto>> RegistrarPrestamoAsync(CrearPrestamoDto dto)
{
    if (dto.FechaDevolucion <= dto.FechaPrestamo)
        return Result<PrestamoDto>.Failure(
            "RN-04: La fecha estimada de devolución debe ser estrictamente posterior a la fecha de préstamo.",
            statusCode: 400, ruleCode: "RN-04");

    if (dto.ResponsableId == Guid.Empty)
        return Result<PrestamoDto>.Failure(
            "RN-05: Todo préstamo debe tener un usuario responsable asignado.",
            statusCode: 400, ruleCode: "RN-05");

    var equipo = await _context.Equipos.FirstOrDefaultAsync(e => e.Id == dto.EquipoId);
    if (equipo is null)
        return Result<PrestamoDto>.Failure("El equipo solicitado no existe.", 404, "EQ-404");

    var validacionEquipo = equipo.ValidarDisponibilidadParaPrestamo(); // Verifica RN-01, RN-02, RN-03
    if (!validacionEquipo.IsSuccess)
        return Result<PrestamoDto>.Failure(validacionEquipo.Error!, validacionEquipo.StatusCode, validacionEquipo.RuleCode);

    var tienePrestamoActivo = await _context.Prestamos
        .AnyAsync(p => p.EquipoId == dto.EquipoId && p.EstadoPrestamo == "Activo");
    if (tienePrestamoActivo)
        return Result<PrestamoDto>.Failure(
            "RN-01: El equipo seleccionado ya cuenta con un préstamo activo.", 409, "RN-01");

    var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.UsuarioId);
    if (usuario is null || !usuario.Estado)
        return Result<PrestamoDto>.Failure(
            "RN-10: Un usuario inactivo no puede recibir préstamos de equipos.", 422, "RN-10");

    equipo.MarcarComoPrestado();
    // Persistencia conjunta de Préstamo + MovimientoInventario ("Prestamo") en un único SaveChangesAsync()
}
```

---

### Refactorización 2: Encapsulamiento Rico en la Entidad `Equipo` para Transiciones de Estado y Protección de Historial (`RN-06`)

- **Problema detectado (*Code Smell: Anemic Domain Model*):** Las transiciones de estado del equipo (`Disponible`, `Prestado`, `Mantenimiento`, `Baja`) se realizaban asignando cadenas sueltas desde distintos lugares, permitiendo que un equipo actualmente `Prestado` fuera pasado manualmente a `Baja` sin cerrar su préstamo o que se eliminara físicamente perdiendo trazabilidad (`RN-06`).
- **Técnica aplicada:** *Encapsulate State Transition & Domain Invariants*.

#### Antes de la Refactorización
```csharp
// ANTES: Cambio directo de propiedad sin proteger invariantes ni auditar el estado previo
equipo.Estado = dto.NuevoEstado;
await _context.SaveChangesAsync();
```

#### Después de la Refactorización
```csharp
// DESPUÉS: Método de dominio encapsulado en Equipo.cs + verificación RN-06 en EquipoService.cs
public Result ValidarDisponibilidadParaPrestamo()
{
    return Estado switch
    {
        "Prestado" => Result.Failure(
            "RN-01: El equipo no puede prestarse porque ya se encuentra prestado.", 409, "RN-01"),
        "Mantenimiento" => Result.Failure(
            "RN-02: Un equipo en estado de mantenimiento no puede ser prestado.", 409, "RN-02"),
        "Baja" => Result.Failure(
            "RN-03: Un equipo dado de baja no puede ser asignado a ningún préstamo.", 409, "RN-03"),
        "Disponible" => Result.Success(),
        _ => Result.Failure("Estado de equipo no válido para préstamo.", 400, "RN-ESTADO")
    };
}

// Protección estricta RN-06 ante intento de borrado físico:
public async Task<Result> EliminarEquipoAsync(Guid id)
{
    var tieneHistorial = await _context.Prestamos.AnyAsync(p => p.EquipoId == id);
    if (tieneHistorial)
        return Result.Failure(
            "RN-06: No se puede eliminar un equipo que tenga historial de préstamos. Utilice el cambio de estado a 'Baja'.",
            statusCode: 409, ruleCode: "RN-06");
    // Solo permite eliminar si fue registrado por error y jamás tuvo préstamos
}
```

---

### Refactorización 3: Composición de Consultas y Eliminación de Duplicación en Filtros de Inventario (`RF-08`) y Reportes (`RF-14` a `RF-17`)

- **Problema detectado (*Code Smell: Duplicated LINQ Projections*):** El mapeo de `Equipo` a `EquipoDto` y el filtrado multicriterio (`busqueda`, `categoria`, `marca`, `estado`) estaban copiados en tres métodos distintos.
- **Técnica aplicada:** *Composable IQueryable Extensions & Projection Reuse*.

#### Antes de la Refactorización
```csharp
// ANTES: Condicionales repetidos y carga en memoria antes de filtrar
var lista = await _context.Equipos.ToListAsync();
if (!string.IsNullOrEmpty(categoria))
    lista = lista.Where(x => x.Categoria == categoria).ToList();
if (!string.IsNullOrEmpty(marca))
    lista = lista.Where(x => x.Marca == marca).ToList();
```

#### Después de la Refactorización
```csharp
// DESPUÉS: Consulta diferida IQueryable ejecutada íntegramente en el motor SQL con AsNoTracking()
public async Task<IReadOnlyList<EquipoDto>> ListarEquiposAsync(FiltroEquipoDto filtro)
{
    IQueryable<Equipo> query = _context.Equipos.AsNoTracking();

    if (!string.IsNullOrWhiteSpace(filtro.Busqueda))
    {
        var termino = filtro.Busqueda.Trim().ToLower();
        query = query.Where(e =>
            e.CodigoPatrimonial.ToLower().Contains(termino) ||
            e.Nombre.ToLower().Contains(termino) ||
            e.Marca.ToLower().Contains(termino));
    }

    if (!string.IsNullOrWhiteSpace(filtro.Categoria))
        query = query.Where(e => e.Categoria == filtro.Categoria);

    if (!string.IsNullOrWhiteSpace(filtro.Marca))
        query = query.Where(e => e.Marca == filtro.Marca);

    if (!string.IsNullOrWhiteSpace(filtro.Estado))
        query = query.Where(e => e.Estado == filtro.Estado);

    return await query
        .OrderBy(e => e.CodigoPatrimonial)
        .Select(EquipoMapper.ProjectToDto)
        .ToListAsync();
}
```

---

### Refactorización 4: Estandarización de Formularios en React con `FormField`, `SelectField` y Validación Declarativa (`RN-04`, `RN-07`, `RN-08`)

- **Problema detectado (*Code Smell: Repetitive Form Markup & Imperative Validation*):** Cada ventana modal repetía más de 25 líneas de etiquetas `<label>`, clases de borde condicionales y mensajes de error manuales por cada input.
- **Técnica aplicada:** *Component Extraction (`FormField` / `SelectField`) + Schema Validation Hook*.

#### Antes de la Refactorización
```tsx
// ANTES: HTML repetitivo y propenso a omitir atributos de accesibilidad (id, htmlFor, aria-invalid)
<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700">Código Patrimonial *</label>
  <input
    type="text"
    value={codigo}
    onChange={(e) => setCodigo(e.target.value)}
    className={`mt-1 w-full rounded border p-2 ${errorCodigo ? 'border-red-500' : 'border-slate-300'}`}
  />
  {errorCodigo && <span className="text-xs text-red-600">{errorCodigo}</span>}
</div>
```

#### Después de la Refactorización
```tsx
// DESPUÉS: Uso declarativo de FormField y SelectField con accesibilidad y validación integrada
<FormField
  id="codigoPatrimonial"
  label="Código Patrimonial (RN-07)"
  required
  placeholder="Ej. INV-LAP-0007"
  value={form.codigoPatrimonial}
  onChange={(e) => updateField('codigoPatrimonial', e.target.value.toUpperCase())}
  error={errors.codigoPatrimonial}
  helperText="Identificador único institucional en formato INV-CAT-0000"
/>

<SelectField
  id="categoria"
  label="Categoría Tecnológica"
  required
  value={form.categoria}
  onChange={(e) => updateField('categoria', e.target.value)}
  options={CATEGORIAS_EQUIPO_OPTIONS}
  error={errors.categoria}
/>
```

---

### Refactorización 5: Sustitución de Tablas HTML Manuales por el Componente Genérico `DataTable<T>`

- **Problema detectado (*Code Smell: Duplicated Table Scaffolding*):** Las vistas de Usuarios, Equipos, Préstamos y los 4 Reportes implementaban por separado su propio `<table>`, `<thead>`, manejo de estado vacío y controles de paginación.
- **Técnica aplicada:** *Generic UI Component (`DataTable<T>`) con Definición Declarativa de Columnas*.

#### Antes de la Refactorización
```tsx
// ANTES: Más de 90 líneas de marcado <table> duplicadas en cada una de las 7 tablas del sistema
<table className="min-w-full divide-y divide-slate-200">
  <thead>
    <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Estado</th></tr>
  </thead>
  <tbody>
    {equipos.map((eq) => (
      <tr key={eq.id}>
        <td>{eq.codigoPatrimonial}</td>
        <td>{eq.nombre}</td>
        <td>{eq.categoria}</td>
        <td>{eq.estado}</td>
      </tr>
    ))}
  </tbody>
</table>
```

#### Después de la Refactorización
```tsx
// DESPUÉS: Definición tipada y reutilización de DataTable<EquipoDto> con ordenamiento y paginación
const columnasEquipos: ColumnDef<EquipoDto>[] = [
  { key: 'codigoPatrimonial', header: 'Código Patrimonial', sortable: true },
  { key: 'nombre', header: 'Equipo Tecnológico', sortable: true },
  { key: 'categoria', header: 'Categoría', sortable: true },
  { key: 'marca', header: 'Marca', sortable: true },
  {
    key: 'estado',
    header: 'Estado Operativo',
    render: (equipo) => <StatusBadge status={equipo.estado} />,
  },
];

<DataTable
  data={equiposFiltrados}
  columns={columnasEquipos}
  keyExtractor={(item) => item.id}
  isLoading={cargando}
  emptyTitle="No se encontraron equipos con los filtros aplicados"
  emptyDescription="Modifique los criterios de búsqueda o registre un nuevo activo tecnológico."
/>
```

---

## 4. Impacto Cuantitativo de la Refactorización

| Métrica de Calidad de Software | Antes de Refactorizar | Después de Refactorizar | Mejora Lograda |
| :--- | :---: | :---: | :---: |
| **Líneas promedio por Controlador REST (.NET 8)** | ~145 líneas | ~48 líneas | **-66.9%** (Controladores delgados) |
| **Duplicación de marcado en Tablas y Formularios React** | ~520 líneas repetidas | 0 líneas (centralizado en `ui/`) | **100%** reutilizado en 13 componentes |
| **Cobertura de las 10 Reglas de Negocio (`RN-01`..`RN-10`)** | Parcial y dispersa en UI/Controlador | 100% centralizada y probada en `xUnit` | **10/10 reglas verificadas automáticamente** |
| **Consistencia de respuestas de error HTTP** | Textos planos heterogéneos | Contrato JSON uniforme `{ error, codigoRegla }` | **Trazabilidad directa en UI y Postman** |
