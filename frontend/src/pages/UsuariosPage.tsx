import { Download, Pencil, Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { UsuarioFormModal } from '../components/usuarios/UsuarioFormModal';
import { Badge, Button, ConfirmDialog, DataTable, FormField, Input, Select, StatusBadge, useToast, type DataTableColumn } from '../components/ui';
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

/** RF-01 a RF-04: gestión de usuarios. Solo el Administrador deshabilita (RN-09). */
export function UsuariosPage({ accionInicial }: UsuariosPageProps) {
  const { esAdmin } = useAuth();
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [area, setArea] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const busquedaDiferida = useDebounce(busqueda, 350);
  const [formAbierto, setFormAbierto] = useState(accionInicial === 'nuevo' && esAdmin);
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
    { key: 'nombre', header: 'Usuario', sortable: true, sortAccessor: (u) => u.nombreCompleto, render: (u) => (<div><p className="font-medium text-slate-900 dark:text-white">{u.nombreCompleto}</p><p className="text-xs text-slate-500">{u.correo}</p></div>) },
    { key: 'area', header: 'Área', sortable: true, sortAccessor: (u) => u.area, render: (u) => u.area },
    { key: 'rol', header: 'Rol', sortable: true, sortAccessor: (u) => u.rol, render: (u) => <StatusBadge status={u.rol} /> },
    { key: 'estado', header: 'Estado', sortable: true, sortAccessor: (u) => (u.estado ? 1 : 0), render: (u) => (u.estado ? <Badge variant="emerald" dot>Activo</Badge> : <Badge variant="slate" dot>Deshabilitado</Badge>) },
    { key: 'prestamos', header: 'Préstamos', sortable: true, sortAccessor: (u) => u.totalPrestamos, render: (u) => `${u.totalPrestamos} (${u.prestamosActivos} activos)` },
    { key: 'registro', header: 'Registro', render: (u) => formatFechaCorta(u.fechaRegistro) },
  ];
  if (esAdmin) {
    columnas.push({
      key: 'acciones',
      header: 'Acciones',
      render: (u) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" aria-label={`Editar ${u.nombreCompleto}`} title="Editar" onClick={() => { setUsuarioEditando(u); setFormAbierto(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" aria-label={u.estado ? `Deshabilitar ${u.nombreCompleto}` : `Habilitar ${u.nombreCompleto}`} title={u.estado ? 'Deshabilitar (RN-09)' : 'Habilitar'} onClick={() => setUsuarioEstado(u)}>
            {u.estado ? <UserX className="h-4 w-4 text-rose-600" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usuarios y Accesos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Padrón de colaboradores y roles (RF-01 a RF-04). {!esAdmin && 'Modo consulta: solo el Administrador gestiona usuarios (RN-09).'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportarACsv('usuarios', usuarios, [
            { encabezado: 'Nombre', obtenerValor: (u) => u.nombreCompleto },
            { encabezado: 'Correo', obtenerValor: (u) => u.correo },
            { encabezado: 'Área', obtenerValor: (u) => u.area },
            { encabezado: 'Rol', obtenerValor: (u) => u.rol },
            { encabezado: 'Estado', obtenerValor: (u) => (u.estado ? 'Activo' : 'Deshabilitado') },
          ])}>Exportar CSV</Button>
          {esAdmin && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setUsuarioEditando(null); setFormAbierto(true); }}>Registrar usuario</Button>}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <FormField label="Buscar" htmlFor="u-busqueda" className="lg:col-span-2"><Input id="u-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o correo…" prefixIcon={<Search className="h-4 w-4" />} /></FormField>
        <FormField label="Área" htmlFor="u-area"><Select id="u-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Todas" options={AREAS_ORGANIZACION.map((a) => ({ value: a, label: a }))} /></FormField>
        <FormField label="Rol" htmlFor="u-rol"><Select id="u-rol" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Todos" options={ROLES_USUARIO.map((r) => ({ value: r, label: r }))} /></FormField>
        <FormField label="Estado" htmlFor="u-estado"><Select id="u-estado" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos" options={[{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Deshabilitado' }]} /></FormField>
        <div className="sm:col-span-2 lg:col-span-5"><Button variant="secondary" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => { setBusqueda(''); setArea(''); setRol(''); setEstado(''); }}>Limpiar filtros</Button></div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" className="cursor-pointer font-semibold underline" onClick={() => void recargar()}>Reintentar</button></div>}

      <DataTable data={usuarios} columns={columnas} rowKey={(u) => u.id} loading={cargando} emptyTitle="Sin usuarios para mostrar" emptyDescription="Ajuste los filtros de búsqueda." />

      <UsuarioFormModal open={formAbierto} usuario={usuarioEditando} onClose={() => { setFormAbierto(false); setUsuarioEditando(null); }} onGuardado={() => void recargar()} />

      <ConfirmDialog
        open={usuarioEstado !== null}
        onClose={() => setUsuarioEstado(null)}
        onConfirm={() => void confirmarCambioEstado()}
        loading={procesando}
        title={usuarioEstado?.estado ? 'Deshabilitar usuario' : 'Habilitar usuario'}
        description={usuarioEstado ? `${usuarioEstado.nombreCompleto} (${usuarioEstado.correo}) ${usuarioEstado.estado ? 'perderá el acceso al sistema.' : 'recuperará el acceso al sistema.'}` : ''}
        ruleCode="RN-09"
        ruleExplanation="Solo el Administrador puede deshabilitar usuarios. La acción puede revertirse volviendo a habilitar la cuenta."
        confirmLabel={usuarioEstado?.estado ? 'Deshabilitar' : 'Habilitar'}
        confirmVariant={usuarioEstado?.estado ? 'danger' : 'success'}
      />
    </div>
  );
}
