import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Pencil, Plus, RefreshCw, Repeat, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EquipoFormModal } from '../components/equipos/EquipoFormModal';
import { Button, ConfirmDialog, DataTable, FormField, Input, Modal, Select, StatusBadge, useToast, type DataTableColumn } from '../components/ui';
import { CATEGORIAS_EQUIPO, ESTADOS_EQUIPO } from '../constants/catalogos';
import { useAuth } from '../context/AuthContext';
import { useCarga, useDebounce } from '../hooks';
import { equiposService } from '../services/equiposService';
import type { EquipoDto, EstadoEquipo } from '../types';
import { exportarACsv } from '../utils/exportCsv';
import { notificarError } from '../utils/errores';
import { cambioEstadoSchema, type CambioEstadoFormValues } from '../utils/esquemas';
import { formatFechaCorta } from '../utils/formatters';

export interface EquiposPageProps {
  accionInicial?: string;
}

/** RF-05 a RF-08 + RF-14: inventario de equipos con búsqueda, filtros, orden y paginación. */
export function EquiposPage({ accionInicial }: EquiposPageProps) {
  const { puedeOperarInventario } = useAuth();
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const busquedaDiferida = useDebounce(busqueda, 350);

  const [formAbierto, setFormAbierto] = useState(accionInicial === 'nuevo' && puedeOperarInventario);
  const [equipoEditando, setEquipoEditando] = useState<EquipoDto | null>(null);
  const [equipoEstado, setEquipoEstado] = useState<EquipoDto | null>(null);
  const [equipoBaja, setEquipoBaja] = useState<EquipoDto | null>(null);
  const [procesando, setProcesando] = useState(false);

  const { datos: equipos, cargando, error, recargar } = useCarga<EquipoDto[]>(
    () => equiposService.listar({ busqueda: busquedaDiferida, estado, categoria, marca }),
    [],
    [busquedaDiferida, estado, categoria, marca],
  );
  const { datos: catalogoCompleto, recargar: recargarCatalogo } = useCarga<EquipoDto[]>(() => equiposService.listar(), [], []);

  const marcas = useMemo(() => [...new Set(catalogoCompleto.map((e) => e.marca))].sort(), [catalogoCompleto]);
  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    catalogoCompleto.forEach((e) => { c[e.estado] = (c[e.estado] ?? 0) + 1; });
    return c;
  }, [catalogoCompleto]);

  const refrescar = () => { void recargar(); void recargarCatalogo(); };

  const formEstado = useForm<CambioEstadoFormValues>({ resolver: zodResolver(cambioEstadoSchema), defaultValues: { estado: 'Disponible', observacion: '' } });
  useEffect(() => {
    if (equipoEstado) formEstado.reset({ estado: equipoEstado.estado, observacion: '' });
  }, [equipoEstado, formEstado]);

  const guardarEstado = formEstado.handleSubmit(async (valores) => {
    if (!equipoEstado) return;
    try {
      await equiposService.cambiarEstado(equipoEstado.id, { estado: valores.estado as EstadoEquipo, observacion: valores.observacion });
      showToast({ title: 'Estado actualizado', description: `${equipoEstado.codigoPatrimonial} ahora está «${valores.estado}».`, variant: 'success' });
      setEquipoEstado(null);
      refrescar();
    } catch (err: unknown) {
      notificarError(showToast, err);
    }
  });

  const confirmarBaja = async () => {
    if (!equipoBaja) return;
    setProcesando(true);
    try {
      await equiposService.eliminarOBajaLogica(equipoBaja.id, equipoBaja.totalPrestamos > 0);
      showToast({
        title: equipoBaja.totalPrestamos > 0 ? 'Baja lógica aplicada (RN-06)' : 'Equipo dado de baja',
        description: `${equipoBaja.codigoPatrimonial} quedó en estado «Baja». El historial se conserva.`,
        variant: 'success',
      });
      setEquipoBaja(null);
      refrescar();
    } catch (err: unknown) {
      notificarError(showToast, err);
    } finally {
      setProcesando(false);
    }
  };

  const columnas: DataTableColumn<EquipoDto>[] = [
    { key: 'codigo', header: 'Código', sortable: true, sortAccessor: (e) => e.codigoPatrimonial, render: (e) => <span className="font-mono text-xs font-semibold">{e.codigoPatrimonial}</span> },
    { key: 'nombre', header: 'Equipo', sortable: true, sortAccessor: (e) => e.nombre, render: (e) => (<div><p className="font-medium text-slate-900 dark:text-white">{e.nombre}</p><p className="text-xs text-slate-500">{e.marca}</p></div>) },
    { key: 'categoria', header: 'Categoría', sortable: true, sortAccessor: (e) => e.categoria, render: (e) => e.categoria },
    { key: 'estado', header: 'Estado', sortable: true, sortAccessor: (e) => e.estado, render: (e) => <StatusBadge status={e.estado} /> },
    { key: 'actual', header: 'Asignado a', render: (e) => (e.usuarioActual ? (<div><p className="text-sm">{e.usuarioActual}</p><p className="text-xs text-slate-500">{e.areaActual}</p></div>) : <span className="text-slate-400">—</span>) },
    { key: 'usos', header: 'Préstamos', sortable: true, sortAccessor: (e) => e.totalPrestamos, render: (e) => e.totalPrestamos },
    { key: 'registro', header: 'Registro', sortable: true, sortAccessor: (e) => e.fechaRegistro, render: (e) => formatFechaCorta(e.fechaRegistro) },
  ];
  if (puedeOperarInventario) {
    columnas.push({
      key: 'acciones',
      header: 'Acciones',
      render: (e) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" aria-label={`Editar ${e.codigoPatrimonial}`} title="Editar" onClick={() => { setEquipoEditando(e); setFormAbierto(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" aria-label={`Cambiar estado de ${e.codigoPatrimonial}`} title="Cambiar estado" onClick={() => setEquipoEstado(e)} disabled={e.estado === 'Prestado'}><Repeat className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" aria-label={`Dar de baja ${e.codigoPatrimonial}`} title="Baja (RN-06)" onClick={() => setEquipoBaja(e)} disabled={e.estado === 'Prestado' || e.estado === 'Baja'}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inventario de Equipos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consulta y gestión del inventario tecnológico (RF-05 a RF-08, RF-14).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportarACsv('inventario-equipos', equipos, [
            { encabezado: 'Código', obtenerValor: (e) => e.codigoPatrimonial },
            { encabezado: 'Nombre', obtenerValor: (e) => e.nombre },
            { encabezado: 'Categoría', obtenerValor: (e) => e.categoria },
            { encabezado: 'Marca', obtenerValor: (e) => e.marca },
            { encabezado: 'Estado', obtenerValor: (e) => e.estado },
            { encabezado: 'Préstamos', obtenerValor: (e) => e.totalPrestamos },
          ])}>Exportar CSV</Button>
          {puedeOperarInventario && (
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEquipoEditando(null); setFormAbierto(true); }}>Registrar equipo</Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro rápido por estado">
        <button type="button" onClick={() => setEstado('')} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${estado === '' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
          Todos ({catalogoCompleto.length})
        </button>
        {ESTADOS_EQUIPO.map((e) => (
          <button key={e} type="button" onClick={() => setEstado(e)} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${estado === e ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
            {e} ({conteo[e] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <FormField label="Buscar" htmlFor="f-busqueda" className="lg:col-span-2">
          <Input id="f-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Código, nombre o marca…" prefixIcon={<Search className="h-4 w-4" />} />
        </FormField>
        <FormField label="Categoría" htmlFor="f-categoria">
          <Select id="f-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Todas" options={CATEGORIAS_EQUIPO.map((c) => ({ value: c, label: c }))} />
        </FormField>
        <FormField label="Marca" htmlFor="f-marca">
          <Select id="f-marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Todas" options={marcas.map((m) => ({ value: m, label: m }))} />
        </FormField>
        <div className="flex items-end">
          <Button variant="secondary" fullWidth leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => { setBusqueda(''); setEstado(''); setCategoria(''); setMarca(''); }}>Limpiar</Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" className="cursor-pointer font-semibold underline" onClick={refrescar}>Reintentar</button></div>}

      <DataTable data={equipos} columns={columnas} rowKey={(e) => e.id} loading={cargando} emptyTitle="Sin equipos para mostrar" emptyDescription="Ajuste los filtros o registre un nuevo equipo." />

      <EquipoFormModal open={formAbierto} equipo={equipoEditando} onClose={() => { setFormAbierto(false); setEquipoEditando(null); }} onGuardado={refrescar} />

      <Modal
        open={equipoEstado !== null}
        onClose={() => setEquipoEstado(null)}
        title="Actualizar estado del equipo"
        subtitle={equipoEstado ? `${equipoEstado.codigoPatrimonial} — ${equipoEstado.nombre} (RF-08)` : undefined}
        footer={<><Button variant="ghost" onClick={() => setEquipoEstado(null)}>Cancelar</Button><Button type="submit" form="form-estado" loading={formEstado.formState.isSubmitting}>Guardar estado</Button></>}
      >
        <form id="form-estado" onSubmit={guardarEstado} noValidate className="space-y-4">
          <FormField label="Nuevo estado" htmlFor="ce-estado" required error={formEstado.formState.errors.estado?.message}>
            <Select id="ce-estado" options={ESTADOS_EQUIPO.filter((e) => e !== 'Prestado').map((e) => ({ value: e, label: e }))} {...formEstado.register('estado')} />
          </FormField>
          <FormField label="Motivo / observación" htmlFor="ce-obs" required error={formEstado.formState.errors.observacion?.message}>
            <Input id="ce-obs" placeholder="Ej. Falla en teclado, enviado a mantenimiento" hasError={Boolean(formEstado.formState.errors.observacion)} {...formEstado.register('observacion')} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={equipoBaja !== null}
        onClose={() => setEquipoBaja(null)}
        onConfirm={() => void confirmarBaja()}
        loading={procesando}
        title="Dar de baja el equipo"
        description={equipoBaja ? `${equipoBaja.codigoPatrimonial} — ${equipoBaja.nombre} pasará a estado «Baja» y no podrá prestarse.` : ''}
        ruleCode="RN-06"
        ruleExplanation="Un equipo con historial de préstamos no se elimina físicamente: se aplica baja lógica y el historial se conserva."
        confirmLabel="Aplicar baja"
        confirmVariant="danger"
      />
    </div>
  );
}
