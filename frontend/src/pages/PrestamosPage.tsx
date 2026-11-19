import { ArrowLeftRight, CheckCircle2, Clock, Download, Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { DevolucionModal } from '../components/prestamos/DevolucionModal';
import { PrestamoFormModal } from '../components/prestamos/PrestamoFormModal';
import { Button, ConfirmDialog, DataTable, DatePicker, FormField, Input, Select, StatusBadge, useToast, type DataTableColumn } from '../components/ui';
import { AREAS_ORGANIZACION } from '../constants/catalogos';
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
  const { puedeOperarInventario } = useAuth();
  const { showToast } = useToast();
  const [pestana, setPestana] = useState<Pestana>('activos');
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

  const estadoFiltroActual =
    pestana === 'activos' ? 'Activo' : pestana === 'pendientes' ? 'Pendiente' : estado;

  const { datos: prestamos, cargando, error, recargar } = useCarga<PrestamoDto[]>(
    () =>
      prestamosService.listar({
        busqueda: busquedaDiferida,
        estadoPrestamo: estadoFiltroActual,
        area,
        fechaDesde,
        fechaHasta,
      }),
    [],
    [busquedaDiferida, pestana, estado, area, fechaDesde, fechaHasta],
  );

  const limpiar = () => { setBusqueda(''); setEstado(''); setArea(''); setFechaDesde(''); setFechaHasta(''); };

  const confirmarAprobacion = async () => {
    if (!prestamoAprobar) return;
    setAprobando(true);
    try {
      await prestamosService.aprobarPrestamo(prestamoAprobar.id);
      showToast({
        title: 'Préstamo aprobado',
        description: `La solicitud para el equipo ${prestamoAprobar.equipoCodigo} pasó a «Activo» y el activo quedó «Prestado».`,
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
    { key: 'equipo', header: 'Equipo', sortable: true, sortAccessor: (p) => p.equipoCodigo, render: (p) => (<div><p className="font-mono text-xs font-semibold">{p.equipoCodigo}</p><p className="text-sm text-slate-700 dark:text-slate-200">{p.equipoNombre}</p></div>) },
    { key: 'usuario', header: 'Colaborador', sortable: true, sortAccessor: (p) => p.usuarioNombre, render: (p) => (<div><p>{p.usuarioNombre}</p><p className="text-xs text-slate-500">{p.usuarioArea}</p></div>) },
    { key: 'fp', header: 'Préstamo', sortable: true, sortAccessor: (p) => p.fechaPrestamo, render: (p) => formatFechaCorta(p.fechaPrestamo) },
    { key: 'fd', header: 'Devolución prevista', sortable: true, sortAccessor: (p) => p.fechaDevolucion, render: (p) => (<span className={esPrestamoVencido(p.fechaDevolucion, p.estadoPrestamo) ? 'font-semibold text-rose-600' : ''}>{formatFechaCorta(p.fechaDevolucion)}{esPrestamoVencido(p.fechaDevolucion, p.estadoPrestamo) ? ' · vencido' : ''}</span>) },
    { key: 'fr', header: 'Devuelto', render: (p) => formatFechaCorta(p.fechaDevolucionReal) },
    { key: 'resp', header: 'Responsable', sortable: true, sortAccessor: (p) => p.responsableNombre, render: (p) => p.responsableNombre || <span className="text-xs italic text-slate-400">Pendiente</span> },
    { key: 'estado', header: 'Estado', sortable: true, sortAccessor: (p) => p.estadoPrestamo, render: (p) => <StatusBadge status={p.estadoPrestamo} /> },
  ];
  if (puedeOperarInventario) {
    columnas.push({
      key: 'acciones',
      header: 'Acción',
      render: (p) =>
        p.estadoPrestamo === 'Pendiente' ? (
          <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => setPrestamoAprobar(p)}>Aprobar</Button>
        ) : p.estadoPrestamo === 'Activo' ? (
          <Button size="sm" variant="success" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setPrestamoDevolucion(p)}>Devolver</Button>
        ) : (
          <span className="text-xs text-slate-400" title={p.observacionDevolucion ?? ''}>Cerrado</span>
        ),
    });
  }

  const pestanasDisponibles: readonly (readonly [Pestana, string])[] = puedeOperarInventario
    ? [
        ['activos', 'Préstamos activos (RF-12)'],
        ['pendientes', 'Solicitudes pendientes'],
        ['historial', 'Historial completo (RF-11)'],
      ]
    : [
        ['activos', 'Préstamos activos (RF-12)'],
        ['historial', 'Historial completo (RF-11)'],
      ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Préstamos y Devoluciones</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registro, aprobación, seguimiento e historial (RF-09 a RF-12).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportarACsv(pestana === 'activos' ? 'prestamos-activos' : pestana === 'pendientes' ? 'solicitudes-pendientes' : 'historial-prestamos', prestamos, [
            { encabezado: 'Equipo', obtenerValor: (p) => p.equipoCodigo },
            { encabezado: 'Nombre', obtenerValor: (p) => p.equipoNombre },
            { encabezado: 'Colaborador', obtenerValor: (p) => p.usuarioNombre },
            { encabezado: 'Área', obtenerValor: (p) => p.usuarioArea },
            { encabezado: 'Fecha préstamo', obtenerValor: (p) => p.fechaPrestamo },
            { encabezado: 'Devolución prevista', obtenerValor: (p) => p.fechaDevolucion },
            { encabezado: 'Devuelto', obtenerValor: (p) => p.fechaDevolucionReal },
            { encabezado: 'Responsable', obtenerValor: (p) => p.responsableNombre },
            { encabezado: 'Estado', obtenerValor: (p) => p.estadoPrestamo },
          ])}>Exportar CSV</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormAbierto(true)}>{puedeOperarInventario ? 'Registrar préstamo' : 'Solicitar préstamo'}</Button>
        </div>
      </div>

      <div role="tablist" aria-label="Vistas de préstamos" className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {pestanasDisponibles.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={pestana === id} type="button" onClick={() => setPestana(id)} className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold ${pestana === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {id === 'pendientes' ? <Clock className="mr-1.5 inline h-4 w-4" /> : <ArrowLeftRight className="mr-1.5 inline h-4 w-4" />}{label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-900">
        <FormField label="Buscar" htmlFor="p-busqueda" className="lg:col-span-2">
          <Input id="p-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Equipo, colaborador, código…" prefixIcon={<Search className="h-4 w-4" />} />
        </FormField>
        {pestana === 'historial' && (
          <FormField label="Estado" htmlFor="p-estado">
            <Select id="p-estado" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos" options={[{ value: 'Pendiente', label: 'Pendiente' }, { value: 'Activo', label: 'Activo' }, { value: 'Devuelto', label: 'Devuelto' }]} />
          </FormField>
        )}
        <FormField label="Área" htmlFor="p-area">
          <Select id="p-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Todas" options={AREAS_ORGANIZACION.map((a) => ({ value: a, label: a }))} />
        </FormField>
        <FormField label="Desde" htmlFor="p-desde"><DatePicker id="p-desde" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></FormField>
        <FormField label="Hasta" htmlFor="p-hasta"><DatePicker id="p-hasta" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></FormField>
        <div className="flex items-end"><Button variant="secondary" fullWidth leftIcon={<RefreshCw className="h-4 w-4" />} onClick={limpiar}>Limpiar</Button></div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" className="cursor-pointer font-semibold underline" onClick={() => void recargar()}>Reintentar</button></div>}

      <DataTable
        data={prestamos}
        columns={columnas}
        rowKey={(p) => p.id}
        loading={cargando}
        emptyTitle={pestana === 'activos' ? 'No hay préstamos activos' : pestana === 'pendientes' ? 'No hay solicitudes pendientes' : 'Sin préstamos para mostrar'}
        emptyDescription="Registre un nuevo préstamo o ajuste los filtros."
        emptyActionLabel={puedeOperarInventario ? 'Registrar préstamo' : 'Solicitar préstamo'}
        onEmptyAction={() => setFormAbierto(true)}
      />

      <PrestamoFormModal open={formAbierto} onClose={() => setFormAbierto(false)} onGuardado={() => void recargar()} />
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
        ruleCode="RN-05 / RN-01"
        ruleExplanation="Usted quedará registrado como usuario responsable del préstamo (RN-05) y el sistema verificará que el equipo continúe Disponible (RN-01, RN-02, RN-03)."
        confirmLabel="Aprobar préstamo"
        confirmVariant="primary"
        loading={aprobando}
      />
    </div>
  );
}
