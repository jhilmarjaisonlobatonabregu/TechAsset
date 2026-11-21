import { Archive, Download, Pencil, Plus, RefreshCw, Repeat, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CambiarEstadoEquipoModal } from '../components/equipos/CambiarEstadoEquipoModal';
import { EquipoFormModal } from '../components/equipos/EquipoFormModal';
import { PrestamoFormModal } from '../components/prestamos/PrestamoFormModal';
import { Button, ConfirmDialog, DataTable, ErrorState, FormField, Input, Select, StatusBadge, useToast, type DataTableColumn } from '../components/ui';
import { CATEGORIAS_EQUIPO, ESTADOS_EQUIPO } from '../constants/catalogos';
import { useAuth } from '../context/AuthContext';
import { useCarga, useDebounce } from '../hooks';
import { equiposService } from '../services/equiposService';
import type { EquipoDto } from '../types';
import { exportarACsv } from '../utils/exportCsv';
import { notificarError } from '../utils/errores';
import { formatFechaCorta } from '../utils/formatters';

export interface EquiposPageProps {
  accionInicial?: string;
}

interface BotonIconoTablaProps {
  etiqueta: string;
  motivoDeshabilitado?: string;
  onAccion: () => void;
  icono: React.ReactNode;
}

function BotonIconoTabla({ etiqueta, motivoDeshabilitado, onAccion, icono }: BotonIconoTablaProps) {
  const estaDeshabilitado = Boolean(motivoDeshabilitado);
  const textoTooltip = motivoDeshabilitado ?? etiqueta;
  return (
    <span className="group relative inline-flex">
      <Button
        size="sm"
        variant="ghost"
        aria-label={estaDeshabilitado ? `${etiqueta}. ${motivoDeshabilitado}` : etiqueta}
        aria-disabled={estaDeshabilitado || undefined}
        title={textoTooltip}
        onClick={() => {
          if (!estaDeshabilitado) onAccion();
        }}
        className={estaDeshabilitado ? 'cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent' : ''}
      >
        {icono}
      </Button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[13px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-slate-700"
      >
        {textoTooltip}
      </span>
    </span>
  );
}

/** RF-05 a RF-08 + RF-14: inventario de equipos con búsqueda, filtros, orden y paginación. */
export function EquiposPage({ accionInicial }: EquiposPageProps) {
  const { puedeOperarInventario } = useAuth();
  const { showToast } = useToast();
  const estadoPorDefecto = puedeOperarInventario ? '' : 'Disponible';
  const estadoInicial = accionInicial?.startsWith('estado:') ? accionInicial.slice('estado:'.length) : estadoPorDefecto;
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState(estadoInicial);
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const busquedaDiferida = useDebounce(busqueda, 350);

  const [formAbierto, setFormAbierto] = useState(accionInicial === 'nuevo' && puedeOperarInventario);
  const [equipoEditando, setEquipoEditando] = useState<EquipoDto | null>(null);
  const [equipoEstado, setEquipoEstado] = useState<EquipoDto | null>(null);
  const [equipoBaja, setEquipoBaja] = useState<EquipoDto | null>(null);
  const [equipoSolicitarId, setEquipoSolicitarId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const { datos: equipos, cargando, error, recargar } = useCarga<EquipoDto[]>(
    () => equiposService.listar({ busqueda: busquedaDiferida, estado, categoria, marca }),
    [],
    [busquedaDiferida, estado, categoria, marca],
  );
  const {
    datos: catalogoCompleto,
    cargado: catalogoCargado,
    error: errorCatalogo,
    recargar: recargarCatalogo,
  } = useCarga<EquipoDto[]>(() => equiposService.listar(), [], []);
  const hayCatalogo = catalogoCargado && !errorCatalogo;

  const marcas = useMemo(() => [...new Set(catalogoCompleto.map((e) => e.marca))].sort(), [catalogoCompleto]);
  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    catalogoCompleto.forEach((e) => { c[e.estado] = (c[e.estado] ?? 0) + 1; });
    return c;
  }, [catalogoCompleto]);

  const refrescar = () => { void recargar(); void recargarCatalogo(); };

  const confirmarBaja = async () => {
    if (!equipoBaja) return;
    setProcesando(true);
    try {
      await equiposService.eliminarOBajaLogica(equipoBaja.id, equipoBaja.totalPrestamos > 0);
      showToast({
        title: 'Equipo dado de baja',
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
    { key: 'codigo', header: 'Código', sortable: true, sortAccessor: (e) => e.codigoPatrimonial, render: (e) => <span className="font-mono text-[13px] font-semibold">{e.codigoPatrimonial}</span> },
    { key: 'nombre', header: 'Equipo', sortable: true, sortAccessor: (e) => e.nombre, render: (e) => (<div><p className="font-medium text-slate-900 dark:text-white">{e.nombre}</p><p className="text-sm text-slate-600 dark:text-slate-400">{e.marca}</p></div>) },
    { key: 'categoria', header: 'Categoría', sortable: true, sortAccessor: (e) => e.categoria, render: (e) => e.categoria },
    { key: 'estado', header: 'Estado', sortable: true, sortAccessor: (e) => e.estado, render: (e) => <StatusBadge status={e.estado} /> },
  ];
  if (puedeOperarInventario) {
    columnas.push(
      { key: 'actual', header: 'Asignado a', render: (e) => (e.usuarioActual ? (<div><p className="text-sm">{e.usuarioActual}</p><p className="text-sm text-slate-600 dark:text-slate-400">{e.areaActual}</p></div>) : <span className="text-slate-600 dark:text-slate-400">—</span>) },
      { key: 'usos', header: 'Préstamos', sortable: true, sortAccessor: (e) => e.totalPrestamos, render: (e) => e.totalPrestamos },
      { key: 'registro', header: 'Registro', sortable: true, sortAccessor: (e) => e.fechaRegistro, render: (e) => formatFechaCorta(e.fechaRegistro) },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (e) => {
          const motivoPrestado = e.estado === 'Prestado' ? 'No disponible: el equipo está prestado' : undefined;
          const motivoBaja =
            e.estado === 'Prestado'
              ? 'No disponible: el equipo está prestado'
              : e.estado === 'Baja'
                ? 'No disponible: el equipo ya está dado de baja'
                : undefined;
          return (
            <div className="flex gap-1">
              <BotonIconoTabla
                etiqueta="Editar equipo"
                onAccion={() => { setEquipoEditando(e); setFormAbierto(true); }}
                icono={<Pencil className="h-4 w-4" aria-hidden="true" />}
              />
              <BotonIconoTabla
                etiqueta="Cambiar estado"
                motivoDeshabilitado={motivoPrestado}
                onAccion={() => setEquipoEstado(e)}
                icono={<Repeat className="h-4 w-4" aria-hidden="true" />}
              />
              <BotonIconoTabla
                etiqueta="Dar de baja"
                motivoDeshabilitado={motivoBaja}
                onAccion={() => setEquipoBaja(e)}
                icono={<Archive className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />}
              />
            </div>
          );
        },
      },
    );
  } else {
    columnas.push({
      key: 'accion-solicitar',
      header: 'Acción',
      render: (e) =>
        e.estado === 'Disponible' ? (
          <Button size="sm" variant="primary" onClick={() => setEquipoSolicitarId(e.id)}>
            Solicitar
          </Button>
        ) : null,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {puedeOperarInventario ? 'Inventario de Equipos' : 'Disponibilidad de equipos'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {puedeOperarInventario
              ? 'Consulta y gestión del inventario de equipos.'
              : 'Consulte qué equipos están disponibles para solicitar.'}
          </p>
        </div>
        {puedeOperarInventario && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportarACsv('inventario-equipos', equipos, [
              { encabezado: 'Código', obtenerValor: (e) => e.codigoPatrimonial },
              { encabezado: 'Nombre', obtenerValor: (e) => e.nombre },
              { encabezado: 'Categoría', obtenerValor: (e) => e.categoria },
              { encabezado: 'Marca', obtenerValor: (e) => e.marca },
              { encabezado: 'Estado', obtenerValor: (e) => e.estado },
              { encabezado: 'Préstamos', obtenerValor: (e) => e.totalPrestamos },
            ])}>Exportar CSV</Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEquipoEditando(null); setFormAbierto(true); }}>Registrar equipo</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro rápido por estado">
        <button
          type="button"
          aria-pressed={estado === ''}
          onClick={() => setEstado('')}
          className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${estado === '' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
        >
          Todos ({hayCatalogo ? catalogoCompleto.length : '—'})
        </button>
        {ESTADOS_EQUIPO.map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={estado === e}
            onClick={() => setEstado(e)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${estado === e ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
          >
            {e} ({hayCatalogo ? (conteo[e] ?? 0) : '—'})
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
          <Button variant="outline" fullWidth leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => { setBusqueda(''); setEstado(estadoPorDefecto); setCategoria(''); setMarca(''); }}>Limpiar</Button>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="No se pudo cargar el inventario de equipos"
          description={error}
          onRetry={refrescar}
        />
      ) : (
        <DataTable
          data={equipos}
          columns={columnas}
          rowKey={(e) => e.id}
          loading={cargando}
          emptyTitle="Sin equipos para mostrar"
          emptyDescription={puedeOperarInventario ? 'Ajuste los filtros o registre un nuevo equipo.' : 'Ajuste los filtros para consultar otros equipos.'}
        />
      )}

      <EquipoFormModal open={formAbierto} equipo={equipoEditando} onClose={() => { setFormAbierto(false); setEquipoEditando(null); }} onGuardado={refrescar} />

      <CambiarEstadoEquipoModal equipo={equipoEstado} onClose={() => setEquipoEstado(null)} onGuardado={refrescar} />

      {!puedeOperarInventario && (
        <PrestamoFormModal
          open={equipoSolicitarId !== null}
          equipoIdInicial={equipoSolicitarId ?? undefined}
          onClose={() => setEquipoSolicitarId(null)}
          onGuardado={refrescar}
        />
      )}

      <ConfirmDialog
        open={equipoBaja !== null}
        onClose={() => setEquipoBaja(null)}
        onConfirm={() => void confirmarBaja()}
        loading={procesando}
        title="Dar de baja el equipo"
        description={equipoBaja ? `${equipoBaja.codigoPatrimonial} — ${equipoBaja.nombre} pasará a estado «Baja» y no se podrá prestar.` : ''}
        ruleExplanation="Los equipos con historial de préstamos no se eliminan: pasan a estado «Baja» y su historial se conserva."
        confirmLabel="Dar de baja"
        confirmVariant="danger"
      />
    </div>
  );
}
