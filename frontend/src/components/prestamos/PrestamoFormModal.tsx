import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, DatePicker, FormField, Input, Modal, Select, useToast } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks';
import { equiposService } from '../../services/equiposService';
import { prestamosService } from '../../services/prestamosService';
import { usuariosService } from '../../services/usuariosService';
import type { EquipoDto, UsuarioDto } from '../../types';
import { mensajeError, notificarError } from '../../utils/errores';
import { prestamoSchema, type PrestamoFormValues } from '../../utils/esquemas';
import { obtenerFechaInputHoy } from '../../utils/formatters';

export interface PrestamoFormModalProps {
  open: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

/** RF-09: registrar préstamo. Muestra advertencias de RN-01/02/03 y deja que el backend siempre valide. */
export function PrestamoFormModal({ open, onClose, onGuardado }: PrestamoFormModalProps) {
  const { usuario, puedeOperarInventario } = useAuth();
  const { showToast } = useToast();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const { datos: equipos } = useCarga<EquipoDto[]>(() => (open ? equiposService.listar() : Promise.resolve([])), [], [open]);
  const { datos: colaboradores } = useCarga<UsuarioDto[]>(
    () => (open && puedeOperarInventario ? usuariosService.listar({ estado: 'true' }) : Promise.resolve([])),
    [],
    [open, puedeOperarInventario],
  );
  const { datos: responsables } = useCarga<UsuarioDto[]>(() => (open ? usuariosService.listarResponsables() : Promise.resolve([])), [], [open]);

  const valoresIniciales = (): PrestamoFormValues => ({
    equipoId: '',
    usuarioId: puedeOperarInventario ? '' : (usuario?.id ?? ''),
    responsableId: '',
    fechaPrestamo: obtenerFechaInputHoy(),
    fechaDevolucion: obtenerFechaInputHoy(7),
    observacion: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrestamoFormValues>({ resolver: zodResolver(prestamoSchema), defaultValues: valoresIniciales() });

  useEffect(() => {
    if (open) {
      setErrorServidor(null);
      reset(valoresIniciales());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const equipoSeleccionado = equipos.find((e) => e.id === watch('equipoId'));
  const equiposVisibles = equipos.filter((e) => mostrarTodos || e.estado === 'Disponible');
  const advertencia =
    equipoSeleccionado && equipoSeleccionado.estado !== 'Disponible'
      ? equipoSeleccionado.estado === 'Mantenimiento'
        ? 'RN-02: un equipo en «Mantenimiento» no puede prestarse.'
        : equipoSeleccionado.estado === 'Baja'
          ? 'RN-03: un equipo en «Baja» no puede prestarse.'
          : 'RN-01: este equipo ya tiene un préstamo activo.'
      : null;

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    try {
      await prestamosService.registrarPrestamo(valores);
      showToast({ title: 'Préstamo registrado', description: 'El equipo quedó asignado y su estado cambió a «Prestado».', variant: 'success' });
      onGuardado();
      onClose();
    } catch (err: unknown) {
      setErrorServidor(mensajeError(err));
      notificarError(showToast, err, 'Préstamo rechazado');
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar préstamo"
      subtitle="RF-09 · Reglas RN-01 a RN-05 validadas en servidor"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" form="form-prestamo" loading={isSubmitting}>Registrar préstamo</Button>
        </>
      }
    >
      <form id="form-prestamo" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errorServidor && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{errorServidor}</div>
        )}
        <FormField label="Equipo" htmlFor="pr-equipo" required error={errors.equipoId?.message} className="sm:col-span-2" helperText="Por defecto solo se listan equipos disponibles.">
          <Select
            id="pr-equipo"
            placeholder="Seleccione un equipo…"
            hasError={Boolean(errors.equipoId)}
            options={equiposVisibles.map((e) => ({ value: e.id, label: `${e.codigoPatrimonial} — ${e.nombre} [${e.estado}]` }))}
            {...register('equipoId')}
          />
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={mostrarTodos} onChange={(e) => setMostrarTodos(e.target.checked)} />
            Mostrar también equipos no disponibles (para comprobar RN-01/02/03)
          </label>
        </FormField>
        {advertencia && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {advertencia}
          </div>
        )}
        {puedeOperarInventario ? (
          <FormField label="Colaborador receptor" htmlFor="pr-usuario" required error={errors.usuarioId?.message}>
            <Select id="pr-usuario" placeholder="Seleccione…" hasError={Boolean(errors.usuarioId)} options={colaboradores.map((u) => ({ value: u.id, label: `${u.nombreCompleto} — ${u.area}` }))} {...register('usuarioId')} />
          </FormField>
        ) : (
          <FormField label="Colaborador receptor" htmlFor="pr-usuario-ro" helperText="Las solicitudes se registran a su nombre.">
            <Input id="pr-usuario-ro" readOnly value={usuario?.nombreCompleto ?? ''} />
            <input type="hidden" {...register('usuarioId')} />
          </FormField>
        )}
        <FormField label="Responsable de Tecnología" htmlFor="pr-responsable" required ruleBadge="RN-05" error={errors.responsableId?.message}>
          <Select id="pr-responsable" placeholder="Seleccione…" hasError={Boolean(errors.responsableId)} options={responsables.map((u) => ({ value: u.id, label: u.nombreCompleto }))} {...register('responsableId')} />
        </FormField>
        <FormField label="Fecha de préstamo" htmlFor="pr-fp" required error={errors.fechaPrestamo?.message}>
          <DatePicker id="pr-fp" hasError={Boolean(errors.fechaPrestamo)} {...register('fechaPrestamo')} />
        </FormField>
        <FormField label="Fecha de devolución prevista" htmlFor="pr-fd" required ruleBadge="RN-04" error={errors.fechaDevolucion?.message}>
          <DatePicker id="pr-fd" hasError={Boolean(errors.fechaDevolucion)} {...register('fechaDevolucion')} />
        </FormField>
        <FormField label="Motivo / observación" htmlFor="pr-obs" required error={errors.observacion?.message} className="sm:col-span-2">
          <Input id="pr-obs" placeholder="Ej. Trabajo remoto del proyecto Alfa" hasError={Boolean(errors.observacion)} {...register('observacion')} />
        </FormField>
      </form>
    </Modal>
  );
}
