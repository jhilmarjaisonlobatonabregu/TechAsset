import { Download, Pencil, Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import React, { useState } from 'react';
import { UsuarioFormModal } from '../components/usuarios/UsuarioFormModal';
import { Badge, Button, ConfirmDialog, DataTable, ErrorState, FormField, Input, Select, StatusBadge, useToast, type DataTableColumn } from '../components/ui';
import { AREAS_ORGANIZACION, ROLES_USUARIO } from '../constants/catalogos';
import { useAuth } from '../context/AuthContext';
import { useCarga, useDebounce } from '../hooks';
import { usuariosService } from '../services/usuariosService';
import type { UsuarioDto } from '../types';
import { exportarACsv } from '../utils/exportCsv';
import { notificarError } from '../utils/errores';
import { formatFechaCorta } from '../utils/formatters';

export interface UsuariosPageProps {
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

/** RF-01 a RF-04: gestión de usuarios. Solo el Administrador gestiona usuarios (RN-09). */
export function UsuariosPage({ accionInicial }: UsuariosPageProps) {
  const { usuario: usuarioActual } = useAuth();
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [area, setArea] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const busquedaDiferida = useDebounce(busqueda, 350);
  const [formAbierto, setFormAbierto] = useState(accionInicial === 'nuevo');
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioDto | null>(null);
  const [usuarioEstado, setUsuarioEstado] = useState<UsuarioDto | null>(null);
  const [procesando, setProcesando] = useState(false);

  const { datos: usuarios, cargando, error, recargar } = useCarga<UsuarioDto[]>(
    () => usuariosService.listar({ busqueda: busquedaDiferida, area, rol, estado }),
    [],
    [busquedaDiferida, area, rol, estado],
  );

  const confirmarCambioEstado = async () => {
    if (!usuarioEstado) return;
    setProcesando(true);
    try {
      const nuevo = !usuarioEstado.estado;
      await usuariosService.cambiarEstadoHabilitacion(usuarioEstado.id, { estado: nuevo });
      showToast({ title: nuevo ? 'Usuario habilitado' : 'Usuario deshabilitado', description: usuarioEstado.nombreCompleto, variant: 'success' });
      setUsuarioEstado(null);
      void recargar();
    } catch (err: unknown) {
      notificarError(showToast, err);
    } finally {
      setProcesando(false);
    }
  };

  const columnas: DataTableColumn<UsuarioDto>[] = [
    { key: 'nombre', header: 'Usuario', sortable: true, sortAccessor: (u) => u.nombreCompleto, render: (u) => (<div><p className="font-medium text-slate-900 dark:text-white">{u.nombreCompleto}</p><p className="text-sm text-slate-600 dark:text-slate-400">{u.correo}</p></div>) },
    { key: 'area', header: 'Área', sortable: true, sortAccessor: (u) => u.area, render: (u) => u.area },
    { key: 'rol', header: 'Rol', sortable: true, sortAccessor: (u) => u.rol, render: (u) => <StatusBadge status={u.rol} /> },
    { key: 'estado', header: 'Estado', sortable: true, sortAccessor: (u) => (u.estado ? 1 : 0), render: (u) => (u.estado ? <Badge variant="emerald" dot>Activo</Badge> : <Badge variant="slate" dot>Deshabilitado</Badge>) },
    { key: 'prestamos', header: 'Préstamos', sortable: true, sortAccessor: (u) => u.totalPrestamos, render: (u) => `${u.totalPrestamos} (${u.prestamosActivos} ${u.prestamosActivos === 1 ? 'activo' : 'activos'})` },
    { key: 'registro', header: 'Registro', render: (u) => formatFechaCorta(u.fechaRegistro) },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (u) => {
        const esPropiaCuenta = usuarioActual?.id === u.id;
        return (
          <div className="flex gap-1">
            <BotonIconoTabla
              etiqueta="Editar usuario"
              onAccion={() => { setUsuarioEditando(u); setFormAbierto(true); }}
              icono={<Pencil className="h-4 w-4" aria-hidden="true" />}
            />
            <BotonIconoTabla
              etiqueta={u.estado ? 'Deshabilitar usuario' : 'Habilitar usuario'}
              motivoDeshabilitado={u.estado && esPropiaCuenta ? 'No puede deshabilitar su propia cuenta' : undefined}
              onAccion={() => setUsuarioEstado(u)}
              icono={u.estado ? <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" /> : <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usuarios y Accesos</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Usuarios del sistema y sus roles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportarACsv('usuarios', usuarios, [
            { encabezado: 'Nombre', obtenerValor: (u) => u.nombreCompleto },
            { encabezado: 'Correo', obtenerValor: (u) => u.correo },
            { encabezado: 'Área', obtenerValor: (u) => u.area },
            { encabezado: 'Rol', obtenerValor: (u) => u.rol },
            { encabezado: 'Estado', obtenerValor: (u) => (u.estado ? 'Activo' : 'Deshabilitado') },
          ])}>Exportar CSV</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setUsuarioEditando(null); setFormAbierto(true); }}>Registrar usuario</Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <FormField label="Buscar" htmlFor="u-busqueda" className="lg:col-span-2"><Input id="u-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o correo…" prefixIcon={<Search className="h-4 w-4" />} /></FormField>
        <FormField label="Área" htmlFor="u-area"><Select id="u-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Todas" options={AREAS_ORGANIZACION.map((a) => ({ value: a, label: a }))} /></FormField>
        <FormField label="Rol" htmlFor="u-rol"><Select id="u-rol" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Todos" options={ROLES_USUARIO.map((r) => ({ value: r, label: r }))} /></FormField>
        <FormField label="Estado" htmlFor="u-estado"><Select id="u-estado" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos" options={[{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Deshabilitado' }]} /></FormField>
        <div className="sm:col-span-2 lg:col-span-5"><Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => { setBusqueda(''); setArea(''); setRol(''); setEstado(''); }}>Limpiar filtros</Button></div>
      </div>

      {error ? (
        <ErrorState
          title="No se pudieron cargar los usuarios"
          description={error}
          onRetry={() => void recargar()}
        />
      ) : (
        <DataTable data={usuarios} columns={columnas} rowKey={(u) => u.id} loading={cargando} emptyTitle="Sin usuarios para mostrar" emptyDescription="Ajuste los filtros de búsqueda." />
      )}

      <UsuarioFormModal open={formAbierto} usuario={usuarioEditando} onClose={() => { setFormAbierto(false); setUsuarioEditando(null); }} onGuardado={() => void recargar()} />

      <ConfirmDialog
        open={usuarioEstado !== null}
        onClose={() => setUsuarioEstado(null)}
        onConfirm={() => void confirmarCambioEstado()}
        loading={procesando}
        title={usuarioEstado?.estado ? 'Deshabilitar usuario' : 'Habilitar usuario'}
        description={usuarioEstado ? `${usuarioEstado.nombreCompleto} (${usuarioEstado.correo}) ${usuarioEstado.estado ? 'perderá el acceso al sistema.' : 'recuperará el acceso al sistema.'}` : ''}
        ruleExplanation="Solo el Administrador puede deshabilitar usuarios. La acción puede revertirse volviendo a habilitar la cuenta."
        confirmLabel={usuarioEstado?.estado ? 'Deshabilitar' : 'Habilitar'}
        confirmVariant={usuarioEstado?.estado ? 'danger' : 'success'}
      />
    </div>
  );
}
