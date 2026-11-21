import { ArrowLeftRight, CheckCircle2, Clock, Download, Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import React, { useState } from 'react';
import { DevolucionModal } from '../components/prestamos/DevolucionModal';
import { PrestamoFormModal } from '../components/prestamos/PrestamoFormModal';
import { Button, ConfirmDialog, DataTable, DatePicker, ErrorState, FormField, Input, Select, StatusBadge, useToast, type DataTableColumn } from '../components/ui';
import { AREAS_ORGANIZACION, ESTADO_PRESTAMO, ESTADOS_PRESTAMO } from '../constants/catalogos';
import { useAuth } from '../context/AuthContext';
import { useCarga, useDebounce } from '../hooks';
import { prestamosService } from '../services/prestamosService';
import type { PrestamoDto } from '../types';
import { notificarError } from '../utils/errores';
import { exportarACsv } from '../utils/exportCsv';
import { esPrestamoVencido, formatFechaCorta } from '../utils/formatters';

export interface PrestamosPageProps {
  accionInicial?: string;
}

type Pestana = 'activos' | 'pendientes' | 'historial';

/** RF-09 a RF-12: préstamos activos, solicitudes pendientes e historial completo con filtros, orden y paginación. */
export function PrestamosPage({ accionInicial }: PrestamosPageProps) {
  const { puedeOperarInventario, esResponsableTI } = useAuth();
  const { showToast } = useToast();
  const pestanaInicial: Pestana =
    accionInicial === 'historial'
      ? 'historial'
      : accionInicial === 'activos'
        ? 'activos'
        : accionInicial === 'pendientes' && puedeOperarInventario
          ? 'pendientes'
          : esResponsableTI
            ? 'pendientes'
            : 'activos';
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [area, setArea] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const busquedaDiferida = useDebounce(busqueda, 350);

  const [formAbierto, setFormAbierto] = useState(accionInicial === 'nuevo');
  const [prestamoDevolucion, setPrestamoDevolucion] = useState<PrestamoDto | null>(null);
  const [prestamoAprobar, setPrestamoAprobar] = useState<PrestamoDto | null>(null);
  const [aprobando, setAprobando] = useState(false);

  const estadoFiltroActual = !puedeOperarInventario
    ? ''
    : pestana === 'activos'
      ? ESTADO_PRESTAMO.ACTIVO
      : pestana === 'pendientes'
        ? ESTADO_PRESTAMO.PENDIENTE
        : estado;

  const { datos: prestamos, cargando, error, recargar } = useCarga<PrestamoDto[]>(
    () =>
      prestamosService.listar({
        busqueda: busquedaDiferida,
        estadoPrestamo: estadoFiltroActual,
        area: puedeOperarInventario ? area : '',
        fechaDesde,
        fechaHasta,
      }),
    [],
    [busquedaDiferida, pestana, estado, area, fechaDesde, fechaHasta, puedeOperarInventario],
  );

  const limpiar = () => { setBusqueda(''); setEstado(''); setArea(''); setFechaDesde(''); setFechaHasta(''); };

  const confirmarAprobacion = async () => {
    if (!prestamoAprobar) return;
    setAprobando(true);
    try {
      await prestamosService.aprobarPrestamo(prestamoAprobar.id);
      showToast({
        title: 'Préstamo aprobado',
        description: `La solicitud para el equipo ${prestamoAprobar.equipoCodigo} pasó a «Activo» y el equipo quedó «Prestado».`,
        variant: 'success',
      });
      setPrestamoAprobar(null);
      await recargar();
    } catch (err: unknown) {
      notificarError(showToast, err, 'No se pudo aprobar la solicitud');
    } finally {
      setAprobando(false);
    }
  };

  const columnas: DataTableColumn<PrestamoDto>[] = [
    { key: 'equipo', header: 'Equipo', sortable: true, sortAccessor: (p) => p.equipoCodigo, render: (p) => (<div><p className="font-mono text-[13px] font-semibold">{p.equipoCodigo}</p><p className="text-sm text-slate-700 dark:text-slate-200">{p.equipoNombre}</p></div>) },
  ];
  if (puedeOperarInventario) {
    columnas.push({ key: 'usuario', header: 'Colaborador', sortable: true, sortAccessor: (p) => p.usuarioNombre, render: (p) => (<div><p>{p.usuarioNombre}</p><p className="text-sm text-slate-600 dark:text-slate-400">{p.usuarioArea}</p></div>) });
  }
  columnas.push(
    { key: 'fp', header: 'Préstamo', sortable: true, sortAccessor: (p) => p.fechaPrestamo, render: (p) => formatFechaCorta(p.fechaPrestamo) },
    { key: 'fd', header: 'Devolución prevista', sortable: true, sortAccessor: (p) => p.fechaDevolucion, render: (p) => (<span className={esPrestamoVencido(p.fechaDevolucion, p.estadoPrestamo) ? 'font-semibold text-rose-600 dark:text-rose-400' : ''}>{formatFechaCorta(p.fechaDevolucion)}{esPrestamoVencido(p.fechaDevolucion, p.estadoPrestamo) ? ' · vencido' : ''}</span>) },
  );
  if (!puedeOperarInventario || pestana === 'historial') {
    columnas.push({ key: 'fr', header: 'Devuelto', render: (p) => formatFechaCorta(p.fechaDevolucionReal) });
  }
  columnas.push(
    {
      key: 'resp',
      header: 'Responsable',
      sortable: true,
      sortAccessor: (p) => p.responsableNombre,
      render: (p) =>
        p.responsableNombre || (
          <span className="text-sm italic text-slate-600 dark:text-slate-400">
            {p.estadoPrestamo === ESTADO_PRESTAMO.PENDIENTE ? 'Por asignar' : 'Pendiente'}
          </span>
        ),
    },
    { key: 'estado', header: 'Estado', sortable: true, sortAccessor: (p) => p.estadoPrestamo, render: (p) => <StatusBadge status={p.estadoPrestamo} /> },
  );
  if (puedeOperarInventario) {
    columnas.push({
      key: 'acciones',
      header: 'Acción',
      render: (p) =>
        p.estadoPrestamo === ESTADO_PRESTAMO.PENDIENTE ? (
          <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => setPrestamoAprobar(p)}>Aprobar</Button>
        ) : p.estadoPrestamo === ESTADO_PRESTAMO.ACTIVO ? (
          <Button size="sm" variant="success" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setPrestamoDevolucion(p)}>Devolver</Button>
        ) : (
          <span className="text-sm text-slate-600 dark:text-slate-400" title={p.observacionDevolucion ?? ''}>Cerrado</span>
        ),
    });
  }

  const pestanasDisponibles: readonly (readonly [Pestana, string])[] = [
    ['activos', 'Préstamos activos'],
    ['pendientes', 'Solicitudes pendientes'],
    ['historial', 'Historial completo'],
  ];

  const manejarTeclaPestana = (e: React.KeyboardEvent<HTMLButtonElement>, indiceActual: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const total = pestanasDisponibles.length;
    const siguienteIndice =
      e.key === 'ArrowRight' ? (indiceActual + 1) % total : (indiceActual - 1 + total) % total;
    const [siguienteId] = pestanasDisponibles[siguienteIndice];
    setPestana(siguienteId);
    document.getElementById(`tab-prestamos-${siguienteId}`)?.focus();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {puedeOperarInventario ? 'Préstamos y Devoluciones' : 'Mis préstamos'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {puedeOperarInventario
              ? 'Registro, aprobación, devolución e historial de préstamos.'
              : 'Solicite equipos y consulte su historial de préstamos.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() =>
              exportarACsv(
                !puedeOperarInventario
                  ? 'mis-prestamos'
                  : pestana === 'activos'
                    ? 'prestamos-activos'
                    : pestana === 'pendientes'
                      ? 'solicitudes-pendientes'
                      : 'historial-prestamos',
                prestamos,
                puedeOperarInventario
                  ? [
                      { encabezado: 'Equipo', obtenerValor: (p) => p.equipoCodigo },
                      { encabezado: 'Nombre', obtenerValor: (p) => p.equipoNombre },
                      { encabezado: 'Colaborador', obtenerValor: (p) => p.usuarioNombre },
                      { encabezado: 'Área', obtenerValor: (p) => p.usuarioArea },
                      { encabezado: 'Fecha préstamo', obtenerValor: (p) => p.fechaPrestamo },
                      { encabezado: 'Devolución prevista', obtenerValor: (p) => p.fechaDevolucion },
                      { encabezado: 'Devuelto', obtenerValor: (p) => p.fechaDevolucionReal },
                      { encabezado: 'Responsable', obtenerValor: (p) => p.responsableNombre || 'Por asignar' },
                      { encabezado: 'Estado', obtenerValor: (p) => p.estadoPrestamo },
                    ]
                  : [
                      { encabezado: 'Equipo', obtenerValor: (p) => p.equipoCodigo },
                      { encabezado: 'Nombre', obtenerValor: (p) => p.equipoNombre },
                      { encabezado: 'Fecha préstamo', obtenerValor: (p) => p.fechaPrestamo },
                      { encabezado: 'Devolución prevista', obtenerValor: (p) => p.fechaDevolucion },
                      { encabezado: 'Devuelto', obtenerValor: (p) => p.fechaDevolucionReal },
                      { encabezado: 'Responsable', obtenerValor: (p) => p.responsableNombre || 'Por asignar' },
                      { encabezado: 'Estado', obtenerValor: (p) => p.estadoPrestamo },
                    ],
              )
            }
          >
            Exportar CSV
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormAbierto(true)}>{puedeOperarInventario ? 'Registrar préstamo' : 'Solicitar préstamo'}</Button>
        </div>
      </div>

      {puedeOperarInventario && (
        <div role="tablist" aria-label="Vistas de préstamos" className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {pestanasDisponibles.map(([id, label], idx) => (
            <button
              key={id}
              id={`tab-prestamos-${id}`}
              role="tab"
              aria-selected={pestana === id}
              aria-controls={`tabpanel-prestamos-${id}`}
              tabIndex={pestana === id ? 0 : -1}
              type="button"
              onClick={() => setPestana(id)}
              onKeyDown={(e) => manejarTeclaPestana(e, idx)}
              className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${pestana === id ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {id === 'pendientes' ? <Clock className="mr-1.5 inline h-4 w-4" /> : <ArrowLeftRight className="mr-1.5 inline h-4 w-4" />}{label}
            </button>
          ))}
        </div>
      )}

      <div
        id={puedeOperarInventario ? `tabpanel-prestamos-${pestana}` : undefined}
        role={puedeOperarInventario ? 'tabpanel' : undefined}
        aria-labelledby={puedeOperarInventario ? `tab-prestamos-${pestana}` : undefined}
        className="space-y-5"
      >
        <div className={`grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 ${puedeOperarInventario ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} dark:border-slate-800 dark:bg-slate-900`}>
          <FormField label="Buscar" htmlFor="p-busqueda" className="lg:col-span-2">
            <Input
              id="p-busqueda"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={puedeOperarInventario ? 'Equipo, colaborador, código…' : 'Equipo o código...'}
              prefixIcon={<Search className="h-4 w-4" />}
            />
          </FormField>
          {puedeOperarInventario && pestana === 'historial' && (
            <FormField label="Estado" htmlFor="p-estado">
              <Select id="p-estado" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos" options={ESTADOS_PRESTAMO.map((est) => ({ value: est, label: est }))} />
            </FormField>
          )}
          {puedeOperarInventario && (
            <FormField label="Área" htmlFor="p-area">
              <Select id="p-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Todas" options={AREAS_ORGANIZACION.map((a) => ({ value: a, label: a }))} />
            </FormField>
          )}
          <FormField label="Desde" htmlFor="p-desde"><DatePicker id="p-desde" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></FormField>
          <FormField label="Hasta" htmlFor="p-hasta"><DatePicker id="p-hasta" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></FormField>
          <div className="flex items-end"><Button variant="outline" fullWidth leftIcon={<RefreshCw className="h-4 w-4" />} onClick={limpiar}>Limpiar</Button></div>
        </div>

        {error ? (
          <ErrorState
            title="No se pudieron cargar los préstamos"
            description={error}
            onRetry={() => void recargar()}
          />
        ) : (
          <DataTable
            data={prestamos}
            columns={columnas}
            rowKey={(p) => p.id}
            loading={cargando}
            emptyTitle={
              !puedeOperarInventario
                ? 'Sin préstamos para mostrar'
                : pestana === 'activos'
                  ? 'No hay préstamos activos'
                  : pestana === 'pendientes'
                    ? 'No hay solicitudes pendientes de aprobación.'
                    : 'Sin préstamos para mostrar'
            }
            emptyDescription={
              !puedeOperarInventario
                ? 'Solicite un equipo o ajuste los filtros.'
                : pestana === 'pendientes'
                  ? 'Todas las solicitudes han sido atendidas o no coinciden con los filtros aplicados.'
                  : 'Registre un nuevo préstamo o ajuste los filtros.'
            }
            emptyActionLabel={puedeOperarInventario ? 'Registrar préstamo' : 'Solicitar préstamo'}
            onEmptyAction={() => setFormAbierto(true)}
          />
        )}
      </div>

      <PrestamoFormModal
        open={formAbierto}
        onClose={() => setFormAbierto(false)}
        onGuardado={() => {
          void recargar();
        }}
      />
      <DevolucionModal prestamo={prestamoDevolucion} onClose={() => setPrestamoDevolucion(null)} onGuardado={() => void recargar()} />
      <ConfirmDialog
        open={Boolean(prestamoAprobar)}
        onClose={() => setPrestamoAprobar(null)}
        onConfirm={() => void confirmarAprobacion()}
        title="Aprobar solicitud de préstamo"
        description={
          prestamoAprobar
            ? `¿Confirma la aprobación del préstamo del equipo ${prestamoAprobar.equipoCodigo} (${prestamoAprobar.equipoNombre}) solicitado por ${prestamoAprobar.usuarioNombre}? El préstamo pasará a «Activo» y el equipo a «Prestado».`
            : ''
        }
        ruleExplanation="Usted quedará registrado como responsable del préstamo y se verificará que el equipo continúe disponible."
        confirmLabel="Aprobar préstamo"
        confirmVariant="primary"
        loading={aprobando}
      />
    </div>
  );
}
