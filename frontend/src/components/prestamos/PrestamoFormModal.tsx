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
import type { EquipoDto, UsuarioDto, UsuarioMinimoDto } from '../../types';
import { mensajeError, notificarError } from '../../utils/errores';
import { crearPrestamoSchema, type PrestamoFormValues } from '../../utils/esquemas';
import { obtenerFechaInputHoy } from '../../utils/formatters';

export interface PrestamoFormModalProps {
  open: boolean;
  equipoIdInicial?: string;
  onClose: () => void;
  onGuardado: () => void;
}

/** RF-09: registrar o solicitar préstamo. Muestra advertencias de RN-01/02/03 y deja que el backend siempre valide. */
export function PrestamoFormModal({ open, equipoIdInicial, onClose, onGuardado }: PrestamoFormModalProps) {
  const { usuario, puedeOperarInventario } = useAuth();
  const { showToast } = useToast();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const { datos: equipos } = useCarga<EquipoDto[]>(() => (open ? equiposService.listar() : Promise.resolve([])), [], [open]);
  const { datos: colaboradores } = useCarga<UsuarioMinimoDto[]>(
    () => (open && puedeOperarInventario ? usuariosService.listarColaboradores() : Promise.resolve([])),
    [],
    [open, puedeOperarInventario],
  );
  const { datos: responsables } = useCarga<UsuarioDto[]>(
    () => (open && puedeOperarInventario ? usuariosService.listarResponsables() : Promise.resolve([])),
    [],
    [open, puedeOperarInventario],
  );

  const valoresIniciales = (): PrestamoFormValues => ({
    equipoId: equipoIdInicial ?? '',
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrestamoFormValues>({
    resolver: zodResolver(crearPrestamoSchema(puedeOperarInventario)),
    defaultValues: valoresIniciales(),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      setErrorServidor(null);
      setMostrarTodos(false);
      reset(valoresIniciales());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, equipoIdInicial]);

  useEffect(() => {
    if (open && equipoIdInicial && equipos.some((e) => e.id === equipoIdInicial)) {
      setValue('equipoId', equipoIdInicial, { shouldValidate: false });
    }
  }, [open, equipoIdInicial, equipos, setValue]);

  const equipoSeleccionado = equipos.find((e) => e.id === watch('equipoId'));
  const equiposVisibles = puedeOperarInventario
    ? equipos.filter((e) => mostrarTodos || e.estado === 'Disponible')
    : equipos.filter((e) => e.estado === 'Disponible');
  const advertencia =
    puedeOperarInventario && equipoSeleccionado && equipoSeleccionado.estado !== 'Disponible'
      ? equipoSeleccionado.estado === 'Mantenimiento'
        ? 'Un equipo en «Mantenimiento» no se puede prestar.'
        : equipoSeleccionado.estado === 'Baja'
          ? 'Un equipo en «Baja» no se puede prestar.'
          : 'Este equipo ya tiene un préstamo activo.'
      : null;

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    try {
      await prestamosService.registrarPrestamo(valores);
      if (puedeOperarInventario) {
        showToast({ title: 'Préstamo registrado', description: 'El equipo quedó asignado y su estado cambió a «Prestado».', variant: 'success' });
      } else {
        showToast({ title: 'Solicitud registrada', description: 'La solicitud de préstamo quedó pendiente de aprobación.', variant: 'success' });
      }
      onGuardado();
      onClose();
    } catch (err: unknown) {
      setErrorServidor(mensajeError(err));
      notificarError(showToast, err, puedeOperarInventario ? 'Préstamo rechazado' : 'Solicitud rechazada');
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={puedeOperarInventario ? 'Registrar préstamo' : 'Solicitar préstamo'}
      subtitle={puedeOperarInventario ? 'Complete los datos del préstamo' : 'Solicitud sujeta a aprobación del Responsable de Tecnología'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" form="form-prestamo" loading={isSubmitting}>{puedeOperarInventario ? 'Registrar préstamo' : 'Solicitar préstamo'}</Button>
        </>
      }
    >
      <form id="form-prestamo" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errorServidor && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{errorServidor}</div>
        )}
        <FormField
          label="Equipo"
          htmlFor="pr-equipo"
          required
          error={errors.equipoId?.message}
          className="sm:col-span-2"
          helperText={puedeOperarInventario ? 'Por defecto solo se listan equipos disponibles.' : undefined}
        >
          <Select
            id="pr-equipo"
            placeholder="Seleccione un equipo…"
            hasError={Boolean(errors.equipoId)}
            options={equiposVisibles.map((e) => ({ value: e.id, label: `${e.codigoPatrimonial} — ${e.nombre} [${e.estado}]` }))}
            {...register('equipoId')}
          />
          {puedeOperarInventario && (
            <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" checked={mostrarTodos} onChange={(e) => setMostrarTodos(e.target.checked)} />
              Mostrar también equipos no disponibles
            </label>
          )}
        </FormField>
        {advertencia && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {advertencia}
          </div>
        )}
        {puedeOperarInventario ? (
          <>
            <FormField label="Colaborador receptor" htmlFor="pr-usuario" required error={errors.usuarioId?.message}>
              <Select id="pr-usuario" placeholder="Seleccione…" hasError={Boolean(errors.usuarioId)} options={colaboradores.map((u) => ({ value: u.id, label: `${u.nombreCompleto} — ${u.area}` }))} {...register('usuarioId')} />
            </FormField>
            <FormField label="Responsable de Tecnología" htmlFor="pr-responsable" required error={errors.responsableId?.message}>
              <Select id="pr-responsable" placeholder="Seleccione…" hasError={Boolean(errors.responsableId)} options={responsables.map((u) => ({ value: u.id, label: u.nombreCompleto }))} {...register('responsableId')} />
            </FormField>
          </>
        ) : (
          <div className="sm:col-span-2">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              Solicitante: <span className="font-medium text-slate-900 dark:text-white">{usuario?.nombreCompleto ?? ''}</span>. El responsable se asigna cuando la solicitud sea aprobada.
            </p>
            <input type="hidden" {...register('usuarioId')} />
            <input type="hidden" {...register('responsableId')} />
          </div>
        )}
        <FormField label="Fecha de préstamo" htmlFor="pr-fp" required error={errors.fechaPrestamo?.message}>
          <DatePicker id="pr-fp" hasError={Boolean(errors.fechaPrestamo)} {...register('fechaPrestamo')} />
        </FormField>
        <FormField label="Fecha de devolución prevista" htmlFor="pr-fd" required error={errors.fechaDevolucion?.message}>
          <DatePicker id="pr-fd" hasError={Boolean(errors.fechaDevolucion)} {...register('fechaDevolucion')} />
        </FormField>
        <FormField label="Motivo / observación" htmlFor="pr-obs" required error={errors.observacion?.message} className="sm:col-span-2">
          <Input id="pr-obs" placeholder="Ej. Trabajo remoto del proyecto Alfa" hasError={Boolean(errors.observacion)} {...register('observacion')} />
        </FormField>
      </form>
    </Modal>
  );
}
