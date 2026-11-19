# 03. Reutilización de Componentes, POO, Principios SOLID y Refactorización

**Sistema:** TechAsset — Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos  
**Organización:** Innovatech Solutions S.A.C.  
**Curso / Evaluación:** Construcción de Software — Caso Práctico Integral (Criterio 3)

---

## 1. Catálogo de Componentes Reutilizables y Hooks en el Frontend

Para evitar la duplicación de código visual y de comportamiento entre los módulos de **Usuarios**, **Equipos**, **Préstamos**, **Dashboard** y **Reportes**, se diseñó una biblioteca interna de **13 componentes UI desacoplados** y **4 custom hooks** (`useApi`, `useCarga`, `useDebounce`, `useForm`) ubicados en `frontend/src/components/ui/` y `frontend/src/hooks/`:

### 1.1 Los 13 Componentes de Interfaz Reutilizables

| # | Componente | Archivo | Responsabilidad y Parametrización (`Props`) | Dónde se Reutiliza |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **`Button`** | `ui/Button.tsx` | Botón accesible con variantes semánticas (`primary`, `secondary`, `danger`, `ghost`), tamaños, estado de carga e ícono izquierdo/derecho. | Todas las páginas y modales del sistema. |
| 2 | **`FormField`** | `ui/FormField.tsx` | Contenedor declarativo de campo de formulario con etiqueta `<label>`, indicador de obligatoriedad `*`, texto de ayuda y mensaje de error. | Formularios de Login, Usuario, Equipo, Préstamo y Devolución. |
| 3 | **`Select`** | `ui/Select.tsx` | Selector desplegable tipado con soporte para opción vacía controlada, estado de error y deshabilitación. | Selección de Rol (`RN-09`), Área, Categoría, Estado Operativo y Colaborador/Equipo. |
| 4 | **`Input`** | `ui/Input.tsx` | Campo de entrada tipado usado en filtros de búsqueda y captura de datos en formularios. | `UsuariosPage`, `EquiposPage` (`RF-08`), `PrestamosPage` y `ReportesPage`. |
| 5 | **`DataTable<T>`** | `ui/DataTable.tsx` | Tabla genérica fuertemente tipada en TypeScript con renderizado declarativo de columnas, estado vacío y carga. | Tablas de Usuarios, Inventario de Equipos, Préstamos y Reportes Gerenciales. |
| 6 | **`Badge`** | `ui/Badge.tsx` | Etiqueta semántica con código de color para estados de equipo (`Disponible`, `Prestado`, `Mantenimiento`, `Baja`), préstamo (`Pendiente`, `Activo`, `Devuelto`) y usuario (`Activo`, `Inactivo`). | Inventario, Préstamos, Usuarios, Dashboard y Bitácora de Movimientos. |
| 7 | **`Card`** | `ui/Card.tsx` | Tarjeta ejecutiva contenedora para indicadores clave (KPIs) y bloques de métricas y gráficos. | `DashboardPage` (`RF-13`) y cabeceras de resumen en módulos y reportes. |
| 8 | **`Modal`** | `ui/Modal.tsx` | Ventana modal accesible (`role="dialog"`, `aria-modal="true"`) con cierre por tecla `Escape` y pie de acciones parametrizable. | Creación/edición de usuarios, equipos, solicitud/registro de préstamos y devoluciones. |
| 9 | **`ConfirmDialog`** | `ui/ConfirmDialog.tsx` | Diálogo de confirmación preventiva para acciones críticas (deshabilitar usuario `RF-03`, baja lógica `RN-06` o aprobación de préstamo). | `UsuariosPage`, `EquiposPage` y `PrestamosPage`. |
| 10 | **`Toast`** | `ui/Toast.tsx` | Notificación contextual (`error`, `warning`, `success`, `info`) que presenta retroalimentación inmediata y el detalle de reglas (`RN-01` a `RN-10`). | Todos los formularios transaccionales y vistas de listado. |
| 11 | **`EmptyState`** | `ui/EmptyState.tsx` | Vista informativa cuando una consulta o filtro no arroja resultados. | Integrado en `DataTable<T>` y secciones sin datos. |
| 12 | **`Spinner`** | `ui/Spinner.tsx` | Indicador visual de progreso asíncrono accesible durante cargas de API. | `AppLayout`, `DataTable` y vistas con carga inicial. |
| 13 | **`DatePicker`** | `ui/DatePicker.tsx` | Selector de fechas controlado con soporte para límites mínimo/máximo (`RN-04`). | Formularios y filtros de rango en `PrestamosPage` y `ReportesPage`. |

### 1.2 Custom Hooks Reutilizables
- **`useApi<T>` (`src/hooks/useApi.ts`):** Encapsula el ciclo de vida completo de peticiones HTTP asíncronas (`data`, `cargando`, `error`, `ejecutar`), extrayendo el mensaje estructurado enviado por el backend cuando se activa una regla de negocio (`RN-01`..`RN-10`).
- **`useCarga`, `useDebounce` y `useForm` (`src/hooks/`):** Gestionan la carga inicial, búsqueda diferida y formularios con **React Hook Form + Zod** (`src/utils/esquemas.ts`, validando `RN-04`, `RN-05`, `RN-07`, `RN-08` y `RN-10` con `mode: 'onTouched'`).

---

## 2. Aplicación de Programación Orientada a Objetos (POO) y Principios SOLID

### 2.1 Pilares de POO Aplicados en TechAsset
1. **Encapsulamiento y Modelo de Dominio Rico:** Las entidades `Equipo`, `Prestamo` y `Usuario` no son simples contenedores pasivos de datos; incluyen métodos de comportamiento de dominio (`Equipo.ValidarDisponibleParaPrestamo()`, `Equipo.MarcarComoPrestado()`, `Equipo.DarDeBajaLogica()`, `Prestamo.Crear()`, `Prestamo.CrearSolicitud()`, `Prestamo.Aprobar()`, `Prestamo.RegistrarDevolucion()`, `Usuario.CambiarEstado()`) que protegen las invariantes de negocio.
2. **Abstracción y Centralización de Catálogos:** La capa de Aplicación define contratos claros (`IAuthService`, `IUsuarioService`, `IEquipoService`, `IPrestamoService`, `IReporteService`) y `CatalogosDominio.cs` centraliza roles, estados, categorías, áreas (`Areas.InfraestructuraSoporte`), credenciales por defecto y mensajes `RN-xx` sin literales repetidos.
3. **Polimorfismo e Inyección de Dependencias:** Los servicios consumen abstracciones inyectadas en el contenedor IoC de ASP.NET Core 8, lo que permite sustituir PostgreSQL por bases de datos en memoria durante las 39 pruebas unitarias en `TechAsset.Tests`.

### 2.2 Los 5 Principios SOLID en la Arquitectura del Proyecto

| Principio SOLID | Implementación Concreta en TechAsset | Beneficio Obtenido |
| :--- | :--- | :--- |
| **S — Single Responsibility Principle (Responsabilidad Única)** | Cada controlador reside en su propio archivo (6 controladores delgados); `PrestamoService` delega validaciones y creación en métodos privados (`< 40` líneas) y entidades; `DatabaseSeeder` separa usuarios, equipos, préstamos y movimientos; `ManejoErroresMiddleware` centraliza errores HTTP. | Facilita localizar y modificar reglas de negocio sin afectar el transporte HTTP ni la seguridad. |
| **O — Open/Closed Principle (Abierto/Cerrado)** | El componente `DataTable<T>` y las políticas/validadores FluentValidation están abiertos a extensión (nuevas columnas con `render` personalizado o nuevos validadores) sin alterar el motor base. | Se agregaron los 4 reportes (`RF-14` a `RF-17`) y el flujo `Pendiente`/aprobación reutilizando la arquitectura base. |
| **L — Liskov Substitution Principle (Sustitución de Liskov)** | Las implementaciones de servicios cumplen estrictamente las precondiciones y postcondiciones de sus interfaces (`IEquipoService`, `IPrestamoService`), respondiendo contratos `ErrorRespuestaDto` uniformes ante `ReglaNegocioException`. | Comportamiento predecible tanto contra PostgreSQL en producción como en las pruebas unitarias con `xUnit`. |
| **I — Interface Segregation Principle (Segregación de Interfaces)** | En lugar de un único servicio monolítico, los contratos están segregados por cohesión funcional: `IAuthService` (sin el código muerto `/api/auth/demo-users`), `IUsuarioService`, `IEquipoService`, `IPrestamoService` e `IReporteService`. | Cada controlador o consumidor depende exclusivamente de los métodos que realmente utiliza. |
| **D — Dependency Inversion Principle (Inversión de Dependencias)** | Los controladores de `TechAsset.API` y validadores dependen de las interfaces y DTOs definidos en `TechAsset.Application.Interfaces`, nunca de clases concretas de infraestructura. | Permite probar todas las reglas `RN-01` a `RN-10` en segundos mediante 39 pruebas unitarias aisladas. |

---

## 3. Cinco Casos Reales de Refactorización (Antes vs. Después)

A continuación se documentan **5 refactorizaciones estructurales** ejecutadas durante la **Actividad 3** para eliminar *code smells* (controladores obesos y archivo monolítico, validaciones duplicadas y métodos largos, modelo anémico, formularios repetitivos y tablas acopladas) además de retirar código muerto (`/api/auth/demo-users`) y literales repetidos.

---

### Refactorización 1: Extracción de Reglas (`RN-01`..`RN-05`, `RN-10`) desde el Controlador hacia `Validadores`, `PrestamoService` y Entidades de Dominio

- **Problema detectado (*Code Smell: Fat Controller, Métodos Largos & Validaciones Duplicadas*):** Inicialmente los controladores se concentraban en un solo archivo `Controllers.cs`, acoplaban lógica repetida y métodos largos (`RegistrarPrestamoAsync`, `AprobarPrestamoAsync`, `ValidarCamposEquipo`, `ValidarCamposBasicos`) duplicando reglas entre validadores, servicios y entidades.
- **Técnica aplicada:** *Extract Controller Files + Extract Method (< 40 líneas) + FluentValidation + Rich Domain Validation*.

#### Antes de la Refactorización
```csharp
// ANTES: Controlador en archivo único con validaciones dispersas y códigos HTTP inconsistentes
[HttpPost]
public async Task<IActionResult> CrearPrestamo([FromBody] CrearPrestamoDto dto)
{
    var equipo = await _db.Equipos.FindAsync(dto.EquipoId);
    if (equipo == null) return NotFound("Equipo no existe");
    if (equipo.Estado == "Prestado") return Conflict("Ya está prestado"); // RN-01 incompleto
    if (equipo.Estado == "Mantenimiento") return Conflict("En mantenimiento"); // RN-02
    if (equipo.Estado == "Baja") return Conflict("Dado de baja"); // RN-03

    var usuario = await _db.Usuarios.FindAsync(dto.UsuarioId);
    if (usuario == null || !usuario.Estado) return UnprocessableEntity("Usuario inactivo");

    if (dto.FechaDevolucion <= dto.FechaPrestamo) return BadRequest("Fechas inválidas"); // RN-04

    equipo.Estado = "Prestado";
    _db.Prestamos.Add(new Prestamo { /* asignación manual sin movimiento de auditoría */ });
    await _db.SaveChangesAsync();
    return Ok();
}
```

#### Después de la Refactorización
```csharp
// DESPUÉS: PrestamosController.cs (archivo propio) delgado + FluentValidation + ManejoErroresMiddleware
[HttpPost]
public async Task<ActionResult<PrestamoDto>> Registrar([FromBody] CrearPrestamoDto dto, CancellationToken ct)
{
    if (EsColaborador && ActorId.HasValue)
    {
        dto.UsuarioId = ActorId.Value;
        dto.ResponsableId = null;
    }
    await ValidarAsync(_crearValidator, dto, ct);
    var creado = await _prestamos.RegistrarPrestamoAsync(dto, ActorRol, ct);
    return CreatedAtAction(nameof(Listar), new { id = creado.Id }, creado);
}
```

```csharp
// En PrestamoService.cs: orquestación en métodos privados (< 40 líneas) sin duplicar RN-04 ni formato
public async Task<PrestamoDto> RegistrarPrestamoAsync(
    CrearPrestamoDto dto, string? rolActor = null, CancellationToken ct = default)
{
    var esSolicitudColaborador = string.Equals(rolActor, Roles.Colaborador, StringComparison.OrdinalIgnoreCase);

    Usuario? responsable = esSolicitudColaborador
        ? null
        : await ObtenerResponsableDelPrestamoAsync(dto.ResponsableId, ct);

    var usuario = await ObtenerUsuarioReceptorAsync(dto.UsuarioId, ct);   // Valida existencia y USR-INACTIVO (422)
    var equipo = await ObtenerEquipoPrestableAsync(dto.EquipoId, ct);     // Invoca equipo.ValidarDisponibleParaPrestamo() y RN-01

    return esSolicitudColaborador
        ? await CrearSolicitudPendienteAsync(dto, usuario, equipo, ct)    // Estado Pendiente; Prestamo.CrearSolicitud valida RN-04
        : await CrearPrestamoActivoAsync(dto, usuario, equipo, responsable!, ct); // Estado Activo + MovimientoInventario
}
```

---

### Refactorización 2: Encapsulamiento Rico en la Entidad `Equipo` para Transiciones de Estado y Protección de Historial (`RN-06`)

- **Problema detectado (*Code Smell: Anemic Domain Model*):** Las transiciones de estado del equipo (`Disponible`, `Prestado`, `Mantenimiento`, `Baja`) se realizaban asignando cadenas sueltas desde el servicio, duplicando en `EquipoService.EliminarOBajaLogicaAsync` las comprobaciones de `RN-01` y `RN-06`.
- **Técnica aplicada:** *Encapsulate State Transition & Domain Invariants*.

#### Antes de la Refactorización
```csharp
// ANTES: Cambio directo de propiedad sin proteger invariantes ni auditar el estado previo
equipo.Estado = dto.NuevoEstado;
await _context.SaveChangesAsync();
```

#### Después de la Refactorización
```csharp
// DESPUÉS: Validación y baja lógica encapsuladas en Equipo.cs con ReglaNegocioException
public void ValidarDisponibleParaPrestamo()
{
    if (string.Equals(Estado, EstadosEquipo.Mantenimiento, StringComparison.OrdinalIgnoreCase))
        throw new ReglaNegocioException("RN-02", "RN-02: No se puede prestar un equipo en estado 'Mantenimiento'.", 422);

    if (string.Equals(Estado, EstadosEquipo.Baja, StringComparison.OrdinalIgnoreCase))
        throw new ReglaNegocioException("RN-03", "RN-03: No se puede prestar un equipo en estado 'Baja'.", 422);

    if (string.Equals(Estado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase))
        throw new ReglaNegocioException("RN-01", MensajesRegla.Rn01EquipoConPrestamoActivo, 409);
}

// Protección estricta RN-01 y RN-06 centralizada en Equipo.DarDeBajaLogica():
public void DarDeBajaLogica(bool aplicarBajaLogica)
{
    var tienePrestamoActivo = Prestamos.Any(p => p.EstadoPrestamo == EstadosPrestamo.Activo) ||
                              string.Equals(Estado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase);
    if (tienePrestamoActivo)
        throw new ReglaNegocioException("RN-01", "RN-01: No se puede eliminar ni dar de baja un equipo que tiene un préstamo activo.", 409);

    if (Prestamos.Count > 0 && !aplicarBajaLogica)
        throw new ReglaNegocioException("RN-06", "RN-06: No se puede eliminar un equipo con historial de préstamos. Utilice la baja lógica cambiando su estado a 'Baja'.", 409);

    Estado = EstadosEquipo.Baja;
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

### Refactorización 4: Estandarización de Formularios en React con `FormField`, `Select` y Validación Declarativa (`RN-04`, `RN-07`, `RN-08`)

- **Problema detectado (*Code Smell: Repetitive Form Markup & Imperative Validation*):** Cada ventana modal repetía más de 25 líneas de etiquetas `<label>`, clases de borde condicionales y mensajes de error manuales por cada input.
- **Técnica aplicada:** *Component Extraction (`FormField` / `Select`) + Schema Validation (`useForm` + `Zod`)*.

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
// DESPUÉS: FormField y Select con React Hook Form + Zod
<FormField
  label="Código Patrimonial (RN-07)"
  required
  error={errors.codigoPatrimonial?.message}
>
  <Input
    placeholder="Ej. INV-LAP-007"
    {...register('codigoPatrimonial')}
  />
</FormField>

<FormField
  label="Categoría Tecnológica"
  required
  error={errors.categoria?.message}
>
  <Select
    options={CATEGORIAS_EQUIPO.map((c) => ({ valor: c, etiqueta: c }))}
    {...register('categoria')}
  />
</FormField>
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
    render: (equipo) => <Badge ...>{equipo.estado}</Badge>,
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
| **Líneas promedio por Controlador REST (.NET 8)** | ~145 líneas | ~45 líneas (6 archivos) | **-69.0%** (Controladores delgados) |
| **Duplicación de marcado en Tablas y Formularios React** | ~520 líneas repetidas | 0 líneas (centralizado en `ui/`) | **100%** reutilizado en 13 componentes |
| **Cobertura de las 10 Reglas de Negocio (`RN-01`..`RN-10`)** | Parcial y dispersa en UI/Controlador | 100% centralizada y probada en `xUnit` | **39/39 pruebas xUnit y 52/52 peticiones Postman (81 aserciones)** |
| **Consistencia de respuestas de error HTTP** | Textos planos heterogéneos | Contrato JSON uniforme `{ exito, codigo, mensaje, errores }` | **Trazabilidad directa en UI y Postman** |
