import { Download, Printer, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, DataTable, DatePicker, FormField, Input, Select, StatusBadge, type DataTableColumn } from '../components/ui';
import { useCarga, useDebounce } from '../hooks';
import { reportesService } from '../services/reportesService';
import type { EquipoDto, EquipoMasUtilizadoDto, MovimientoInventarioDto, PrestamoPorAreaDto, ReporteEquiposPorEstadoDto } from '../types';
import { exportarACsv } from '../utils/exportCsv';
import { formatFechaHora } from '../utils/formatters';

type Pestana = 'estado' | 'top' | 'area' | 'movimientos';

const PESTANAS: ReadonlyArray<{ id: Pestana; label: string }> = [
  { id: 'estado', label: 'Equipos por estado (RF-14)' },
  { id: 'top', label: 'Más utilizados (RF-15)' },
  { id: 'area', label: 'Préstamos por área (RF-16)' },
  { id: 'movimientos', label: 'Historial de movimientos (RF-17)' },
];

const PRESETS: ReadonlyArray<{ valor: string; label: string }> = [
  { valor: '', label: 'Todos' },
  { valor: 'Disponible', label: 'Equipos disponibles' },
  { valor: 'Prestado', label: 'Equipos prestados' },
  { valor: 'Mantenimiento', label: 'En mantenimiento' },
  { valor: 'Baja', label: 'De baja' },
];

const TIPOS_MOV = ['AltaEquipo', 'ActualizacionEquipo', 'Prestamo', 'Devolucion', 'CambioEstado', 'BajaLogica'];

/** RF-14 a RF-17: reportes con exportación CSV e impresión / PDF. */
export function ReportesPage() {
  const [pestana, setPestana] = useState<Pestana>('estado');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const busquedaDiferida = useDebounce(busqueda, 350);

  const porEstado = useCarga<ReporteEquiposPorEstadoDto | null>(() => reportesService.obtenerEquiposPorEstado(estado), null, [estado]);
  const top = useCarga<EquipoMasUtilizadoDto[]>(() => reportesService.obtenerEquiposMasUtilizados(10), [], []);
  const areas = useCarga<PrestamoPorAreaDto[]>(() => reportesService.obtenerPrestamosPorArea(), [], []);
  const movimientos = useCarga<MovimientoInventarioDto[]>(
    () => reportesService.obtenerMovimientos({ tipo, busqueda: busquedaDiferida, fechaDesde: desde, fechaHasta: hasta }),
    [],
    [tipo, busquedaDiferida, desde, hasta],
  );

  const colEquipos: DataTableColumn<EquipoDto>[] = [
    { key: 'c', header: 'Código', sortable: true, sortAccessor: (e) => e.codigoPatrimonial, render: (e) => <span className="font-mono text-xs font-semibold">{e.codigoPatrimonial}</span> },
    { key: 'n', header: 'Equipo', sortable: true, sortAccessor: (e) => e.nombre, render: (e) => e.nombre },
    { key: 'cat', header: 'Categoría', sortable: true, sortAccessor: (e) => e.categoria, render: (e) => e.categoria },
    { key: 'm', header: 'Marca', render: (e) => e.marca },
    { key: 'e', header: 'Estado', render: (e) => <StatusBadge status={e.estado} /> },
    { key: 'u', header: 'Asignado a', render: (e) => e.usuarioActual ?? '—' },
  ];
  const colTop: DataTableColumn<EquipoMasUtilizadoDto>[] = [
    { key: 'pos', header: '#', render: (e) => top.datos.indexOf(e) + 1 },
    { key: 'c', header: 'Código', render: (e) => <span className="font-mono text-xs font-semibold">{e.codigoPatrimonial}</span> },
    { key: 'n', header: 'Equipo', sortable: true, sortAccessor: (e) => e.nombre, render: (e) => `${e.nombre} · ${e.marca}` },
    { key: 'cat', header: 'Categoría', render: (e) => e.categoria },
    { key: 'e', header: 'Estado actual', render: (e) => <StatusBadge status={e.estadoActual} /> },
    { key: 't', header: 'Préstamos', sortable: true, sortAccessor: (e) => e.totalPrestamos, render: (e) => <span className="font-bold">{e.totalPrestamos}</span> },
    { key: 'u', header: 'Último usuario', render: (e) => e.ultimoUsuario ?? '—' },
  ];
  const colAreas: DataTableColumn<PrestamoPorAreaDto>[] = [
    { key: 'a', header: 'Área', sortable: true, sortAccessor: (a) => a.area, render: (a) => a.area },
    { key: 't', header: 'Total', sortable: true, sortAccessor: (a) => a.totalPrestamos, render: (a) => <span className="font-bold">{a.totalPrestamos}</span> },
    { key: 'ac', header: 'Activos', render: (a) => a.prestamosActivos },
    { key: 'd', header: 'Devueltos', render: (a) => a.prestamosDevueltos },
    { key: 'p', header: '% del total', sortable: true, sortAccessor: (a) => a.porcentaje ?? 0, render: (a) => `${(a.porcentaje ?? 0).toFixed(1)}%` },
    { key: 'co', header: 'Colaboradores', render: (a) => a.colaboradoresActivos ?? '—' },
  ];
  const colMov: DataTableColumn<MovimientoInventarioDto>[] = [
    { key: 'f', header: 'Fecha', sortable: true, sortAccessor: (m) => m.fecha, render: (m) => formatFechaHora(m.fecha) },
    { key: 't', header: 'Tipo', sortable: true, sortAccessor: (m) => m.tipoMovimiento, render: (m) => <span className="font-semibold">{m.tipoMovimiento}</span> },
    { key: 'e', header: 'Equipo', render: (m) => `${m.equipoCodigo} — ${m.equipoNombre}` },
    { key: 'tr', header: 'Transición', render: (m) => (<span className="flex items-center gap-1.5"><StatusBadge status={m.estadoAnterior} /> → <StatusBadge status={m.estadoNuevo} /></span>) },
    { key: 'u', header: 'Usuario / Responsable', render: (m) => (<div><p className="text-sm">{m.usuarioInvolucrado ?? '—'}</p><p className="text-xs text-slate-500">{m.responsableNombre ?? ''}</p></div>) },
    { key: 'o', header: 'Observación', render: (m) => m.observacion },
  ];

  const exportar = () => {
    if (pestana === 'estado') {
      exportarACsv('reporte-equipos-por-estado', porEstado.datos?.equipos ?? [], [
        { encabezado: 'Código', obtenerValor: (e) => e.codigoPatrimonial }, { encabezado: 'Equipo', obtenerValor: (e) => e.nombre },
        { encabezado: 'Categoría', obtenerValor: (e) => e.categoria }, { encabezado: 'Marca', obtenerValor: (e) => e.marca }, { encabezado: 'Estado', obtenerValor: (e) => e.estado },
      ]);
    } else if (pestana === 'top') {
      exportarACsv('reporte-equipos-mas-utilizados', top.datos, [
        { encabezado: 'Código', obtenerValor: (e) => e.codigoPatrimonial }, { encabezado: 'Equipo', obtenerValor: (e) => e.nombre }, { encabezado: 'Préstamos', obtenerValor: (e) => e.totalPrestamos },
      ]);
    } else if (pestana === 'area') {
      exportarACsv('reporte-prestamos-por-area', areas.datos, [
        { encabezado: 'Área', obtenerValor: (a) => a.area }, { encabezado: 'Total', obtenerValor: (a) => a.totalPrestamos },
        { encabezado: 'Activos', obtenerValor: (a) => a.prestamosActivos }, { encabezado: 'Devueltos', obtenerValor: (a) => a.prestamosDevueltos },
      ]);
    } else {
      exportarACsv('reporte-movimientos', movimientos.datos, [
        { encabezado: 'Fecha', obtenerValor: (m) => m.fecha }, { encabezado: 'Tipo', obtenerValor: (m) => m.tipoMovimiento },
        { encabezado: 'Equipo', obtenerValor: (m) => m.equipoCodigo }, { encabezado: 'Estado anterior', obtenerValor: (m) => m.estadoAnterior },
        { encabezado: 'Estado nuevo', obtenerValor: (m) => m.estadoNuevo }, { encabezado: 'Observación', obtenerValor: (m) => m.observacion },
      ]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reportes y Movimientos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consultas gerenciales del inventario (RF-14 a RF-17).</p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportar}>Exportar CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimir / PDF</Button>
        </div>
      </div>

      <div role="tablist" aria-label="Reportes" className="no-print flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {PESTANAS.map((p) => (
          <button key={p.id} role="tab" aria-selected={pestana === p.id} type="button" onClick={() => setPestana(p.id)} className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold ${pestana === p.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'estado' && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap gap-2" role="group" aria-label="Accesos directos por estado">
            {PRESETS.map((p) => (
              <button key={p.valor} type="button" onClick={() => setEstado(p.valor)} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${estado === p.valor ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>{p.label}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {(porEstado.datos?.resumen ?? []).map((r) => (
              <Card key={r.estado} className="text-center"><p className="text-2xl font-bold">{r.cantidad}</p><p className="text-xs text-slate-500">{r.estado} · {r.porcentaje.toFixed(0)}%</p></Card>
            ))}
          </div>
          <DataTable data={porEstado.datos?.equipos ?? []} columns={colEquipos} rowKey={(e) => e.id} loading={porEstado.cargando} emptyTitle="Sin equipos en este estado" emptyDescription="Seleccione otro filtro." />
        </div>
      )}

      {pestana === 'top' && <DataTable data={top.datos} columns={colTop} rowKey={(e) => e.equipoId} loading={top.cargando} emptyTitle="Aún no hay préstamos" emptyDescription="El ranking se genera con el historial de préstamos." />}
      {pestana === 'area' && <DataTable data={areas.datos} columns={colAreas} rowKey={(a) => a.area} loading={areas.cargando} emptyTitle="Sin datos por área" emptyDescription="Registre préstamos para ver el consumo por área." />}

      {pestana === 'movimientos' && (
        <div className="space-y-4">
          <div className="no-print grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
            <FormField label="Buscar" htmlFor="m-busqueda" className="lg:col-span-2"><Input id="m-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Equipo u observación…" /></FormField>
            <FormField label="Tipo" htmlFor="m-tipo"><Select id="m-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Todos" options={TIPOS_MOV.map((t) => ({ value: t, label: t }))} /></FormField>
            <FormField label="Desde" htmlFor="m-desde"><DatePicker id="m-desde" value={desde} onChange={(e) => setDesde(e.target.value)} /></FormField>
            <FormField label="Hasta" htmlFor="m-hasta"><DatePicker id="m-hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} /></FormField>
            <div className="sm:col-span-2 lg:col-span-5"><Button size="sm" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => { setTipo(''); setBusqueda(''); setDesde(''); setHasta(''); }}>Limpiar filtros</Button></div>
          </div>
          <DataTable data={movimientos.datos} columns={colMov} rowKey={(m) => m.id} loading={movimientos.cargando} emptyTitle="Sin movimientos" emptyDescription="No hay movimientos con los filtros aplicados." />
        </div>
      )}
    </div>
  );
}
