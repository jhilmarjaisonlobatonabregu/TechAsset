import { Check, Download, Printer, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button, DataTable, DatePicker, ErrorState, FormField, Input, Select, StatusBadge, type DataTableColumn } from '../components/ui';
import { TIPOS_MOVIMIENTO } from '../constants/catalogos';
import { useCarga, useDebounce } from '../hooks';
import { reportesService } from '../services/reportesService';
import type { EquipoDto, EquipoMasUtilizadoDto, MovimientoInventarioDto, PrestamoPorAreaDto, ReporteEquiposPorEstadoDto } from '../types';
import { exportarACsv } from '../utils/exportCsv';
import { formatFechaHora, formatTipoMovimiento } from '../utils/formatters';

export interface ReportesPageProps {
  accionInicial?: string;
}

type Pestana = 'estado' | 'top' | 'area' | 'movimientos';

const PESTANAS: ReadonlyArray<{ id: Pestana; label: string }> = [
  { id: 'estado', label: 'Equipos por estado' },
  { id: 'top', label: 'Más utilizados' },
  { id: 'area', label: 'Préstamos por área' },
  { id: 'movimientos', label: 'Historial de movimientos' },
];

interface TarjetaEstadoConfig {
  valor: string;
  label: string;
  dot: string;
  borderLeft: string;
  activeClasses: string;
  checkClass: string;
}

const TARJETAS_ESTADO: readonly TarjetaEstadoConfig[] = [
  {
    valor: '',
    label: 'Todos',
    dot: 'bg-slate-500',
    borderLeft: 'border-l-slate-500',
    activeClasses: 'border-2 border-slate-600 bg-slate-100/90 dark:border-slate-400 dark:bg-slate-800/80',
    checkClass: 'text-slate-700 dark:text-slate-200',
  },
  {
    valor: 'Disponible',
    label: 'Disponibles',
    dot: 'bg-emerald-500',
    borderLeft: 'border-l-emerald-500',
    activeClasses: 'border-2 border-emerald-500 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40',
    checkClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    valor: 'Prestado',
    label: 'Prestados',
    dot: 'bg-blue-500',
    borderLeft: 'border-l-blue-600',
    activeClasses: 'border-2 border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40',
    checkClass: 'text-blue-700 dark:text-blue-300',
  },
  {
    valor: 'Mantenimiento',
    label: 'En mantenimiento',
    dot: 'bg-amber-500',
    borderLeft: 'border-l-amber-500',
    activeClasses: 'border-2 border-amber-500 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/40',
    checkClass: 'text-amber-800 dark:text-amber-300',
  },
  {
    valor: 'Baja',
    label: 'De baja',
    dot: 'bg-rose-500',
    borderLeft: 'border-l-rose-500',
    activeClasses: 'border-2 border-rose-500 bg-rose-50/70 dark:border-rose-500 dark:bg-rose-950/40',
    checkClass: 'text-rose-700 dark:text-rose-300',
  },
];

/** RF-14 a RF-17: reportes con exportación CSV e impresión / PDF. */
export function ReportesPage({ accionInicial }: ReportesPageProps) {
  const pestanaInicial: Pestana =
    accionInicial === 'area' || accionInicial === 'top' || accionInicial === 'movimientos'
      ? accionInicial
      : 'estado';
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);
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
    { key: 'c', header: 'Código', sortable: true, sortAccessor: (e) => e.codigoPatrimonial, render: (e) => <span className="font-mono text-[13px] font-semibold">{e.codigoPatrimonial}</span> },
    { key: 'n', header: 'Equipo', sortable: true, sortAccessor: (e) => e.nombre, render: (e) => e.nombre },
    { key: 'cat', header: 'Categoría', sortable: true, sortAccessor: (e) => e.categoria, render: (e) => e.categoria },
    { key: 'm', header: 'Marca', render: (e) => e.marca },
    { key: 'e', header: 'Estado', render: (e) => <StatusBadge status={e.estado} /> },
    { key: 'u', header: 'Asignado a', render: (e) => e.usuarioActual ?? '—' },
  ];
  const colTop: DataTableColumn<EquipoMasUtilizadoDto>[] = [
    { key: 'pos', header: '#', render: (e) => top.datos.indexOf(e) + 1 },
    { key: 'c', header: 'Código', render: (e) => <span className="font-mono text-[13px] font-semibold">{e.codigoPatrimonial}</span> },
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
    { key: 't', header: 'Tipo', sortable: true, sortAccessor: (m) => formatTipoMovimiento(m.tipoMovimiento), render: (m) => <span className="font-semibold">{formatTipoMovimiento(m.tipoMovimiento)}</span> },
    { key: 'e', header: 'Equipo', render: (m) => `${m.equipoCodigo} — ${m.equipoNombre}` },
    { key: 'tr', header: 'Cambio de estado', render: (m) => (<span className="flex items-center gap-1.5"><StatusBadge status={m.estadoAnterior} /> → <StatusBadge status={m.estadoNuevo} /></span>) },
    { key: 'u', header: 'Usuario / Responsable', render: (m) => (<div><p className="text-sm">{m.usuarioInvolucrado ?? '—'}</p><p className="text-sm text-slate-600 dark:text-slate-400">{m.responsableNombre ?? ''}</p></div>) },
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
        { encabezado: 'Fecha', obtenerValor: (m) => m.fecha }, { encabezado: 'Tipo', obtenerValor: (m) => formatTipoMovimiento(m.tipoMovimiento) },
        { encabezado: 'Equipo', obtenerValor: (m) => m.equipoCodigo }, { encabezado: 'Estado anterior', obtenerValor: (m) => m.estadoAnterior },
        { encabezado: 'Estado nuevo', obtenerValor: (m) => m.estadoNuevo }, { encabezado: 'Observación', obtenerValor: (m) => m.observacion },
      ]);
    }
  };

  const manejarTeclaPestana = (e: React.KeyboardEvent<HTMLButtonElement>, indiceActual: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const total = PESTANAS.length;
    const siguienteIndice =
      e.key === 'ArrowRight' ? (indiceActual + 1) % total : (indiceActual - 1 + total) % total;
    const siguienteId = PESTANAS[siguienteIndice].id;
    setPestana(siguienteId);
    document.getElementById(`tab-reportes-${siguienteId}`)?.focus();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reportes y Movimientos</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Consultas del inventario.</p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportar}>Exportar CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimir / PDF</Button>
        </div>
      </div>

      <div role="tablist" aria-label="Reportes" className="no-print flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {PESTANAS.map((p, idx) => (
          <button
            key={p.id}
            id={`tab-reportes-${p.id}`}
            role="tab"
            aria-selected={pestana === p.id}
            aria-controls={`tabpanel-reportes-${p.id}`}
            tabIndex={pestana === p.id ? 0 : -1}
            type="button"
            onClick={() => setPestana(p.id)}
            onKeyDown={(e) => manejarTeclaPestana(e, idx)}
            className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${pestana === p.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        id={`tabpanel-reportes-${pestana}`}
        role="tabpanel"
        aria-labelledby={`tab-reportes-${pestana}`}
      >
        {pestana === 'estado' && (() => {
          const resumen = porEstado.datos?.resumen ?? [];
          const totalEquipos = resumen.reduce((acc, r) => acc + r.cantidad, 0);
          const sinDatosEstado = !porEstado.cargado || !porEstado.datos || Boolean(porEstado.error);
          return (
            <div className="space-y-4">
              <div className="no-print space-y-2.5">
                <p
                  id="titulo-filtro-estado"
                  className="text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Filtrar por estado
                </p>
                <div
                  role="group"
                  aria-labelledby="titulo-filtro-estado"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
                >
                  {TARJETAS_ESTADO.map((t) => {
                    const activa = estado === t.valor;
                    const itemResumen =
                      t.valor === '' ? undefined : resumen.find((r) => r.estado === t.valor);
                    const cantidad = t.valor === '' ? totalEquipos : (itemResumen?.cantidad ?? 0);
                    const porcentaje =
                      t.valor === ''
                        ? totalEquipos > 0
                          ? 100
                          : 0
                        : Math.round(itemResumen?.porcentaje ?? 0);

                    return (
                      <button
                        key={t.label}
                        type="button"
                        aria-pressed={activa}
                        onClick={() => setEstado(t.valor)}
                        className={`relative flex cursor-pointer flex-col items-start rounded-xl border-l-4 ${t.borderLeft} p-4 text-left shadow-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                          activa
                            ? t.activeClasses
                            : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        {activa && (
                          <span className={`absolute top-3 right-3 ${t.checkClass}`}>
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {sinDatosEstado ? '—' : cantidad}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} aria-hidden="true" />
                          <span>
                            {t.label} · {sinDatosEstado ? '—' : `${porcentaje} %`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {porEstado.error ? (
                <ErrorState
                  title="No se pudo cargar el reporte de equipos"
                  description={porEstado.error}
                  onRetry={() => void porEstado.recargar()}
                />
              ) : (
                <DataTable
                  data={porEstado.datos?.equipos ?? []}
                  columns={colEquipos}
                  rowKey={(e) => e.id}
                  loading={porEstado.cargando}
                  emptyTitle="Sin equipos en este estado"
                  emptyDescription="Seleccione otro estado para ver los equipos registrados."
                />
              )}
            </div>
          );
        })()}

        {pestana === 'top' && (
          top.error ? (
            <ErrorState
              title="No se pudo cargar el reporte de equipos más utilizados"
              description={top.error}
              onRetry={() => void top.recargar()}
            />
          ) : (
            <DataTable data={top.datos} columns={colTop} rowKey={(e) => e.equipoId} loading={top.cargando} emptyTitle="Aún no hay préstamos" emptyDescription="Este listado se genera con el historial de préstamos." />
          )
        )}
        {pestana === 'area' && (
          areas.error ? (
            <ErrorState
              title="No se pudo cargar el reporte de préstamos por área"
              description={areas.error}
              onRetry={() => void areas.recargar()}
            />
          ) : (
            <DataTable data={areas.datos} columns={colAreas} rowKey={(a) => a.area} loading={areas.cargando} emptyTitle="Sin datos por área" emptyDescription="Registre préstamos para ver el consumo por área." />
          )
        )}

        {pestana === 'movimientos' && (
          <div className="space-y-4">
            <div className="no-print grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
              <FormField label="Buscar" htmlFor="m-busqueda" className="lg:col-span-2"><Input id="m-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Equipo u observación…" /></FormField>
              <FormField label="Tipo" htmlFor="m-tipo"><Select id="m-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Todos" options={TIPOS_MOVIMIENTO.map((t) => ({ value: t, label: formatTipoMovimiento(t) }))} /></FormField>
              <FormField label="Desde" htmlFor="m-desde"><DatePicker id="m-desde" value={desde} onChange={(e) => setDesde(e.target.value)} /></FormField>
              <FormField label="Hasta" htmlFor="m-hasta"><DatePicker id="m-hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} /></FormField>
              <div className="sm:col-span-2 lg:col-span-5"><Button size="sm" variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => { setTipo(''); setBusqueda(''); setDesde(''); setHasta(''); }}>Limpiar filtros</Button></div>
            </div>
            {movimientos.error ? (
              <ErrorState
                title="No se pudo cargar el historial de movimientos"
                description={movimientos.error}
                onRetry={() => void movimientos.recargar()}
              />
            ) : (
              <DataTable data={movimientos.datos} columns={colMov} rowKey={(m) => m.id} loading={movimientos.cargando} emptyTitle="Sin movimientos" emptyDescription="No hay movimientos con los filtros aplicados." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
