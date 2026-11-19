import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, DatePicker, FormField, Input, Modal, Select, StatusBadge, useToast } from '../ui';
import { prestamosService } from '../../services/prestamosService';
import type { EstadoEquipo, PrestamoDto } from '../../types';
import { mensajeError, notificarError } from '../../utils/errores';
import { devolucionSchema, type DevolucionFormValues } from '../../utils/esquemas';
import { formatFechaCorta, obtenerFechaInputHoy } from '../../utils/formatters';

export interface DevolucionModalProps {
  prestamo: PrestamoDto | null;
  onClose: () => void;
  onGuardado: () => void;
}

/** RF-10: registrar devolución. RN-10: la observación es obligatoria (front y back). */
export function DevolucionModal({ prestamo, onClose, onGuardado }: DevolucionModalProps) {
  const { showToast } = useToast();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const esquema = useMemo(() => devolucionSchema(prestamo?.fechaPrestamo ?? '1900-01-01'), [prestamo]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DevolucionFormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { observacion: '', fechaDevolucionReal: obtenerFechaInputHoy(), estadoEquipoDestino: 'Disponible' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (prestamo) {
      setErrorServidor(null);
      reset({ observacion: '', fechaDevolucionReal: obtenerFechaInputHoy(), estadoEquipoDestino: 'Disponible' });
    }
  }, [prestamo, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    if (!prestamo) return;
    setErrorServidor(null);
    try {
      await prestamosService.registrarDevolucion(prestamo.id, { ...valores, estadoEquipoDestino: valores.estadoEquipoDestino as EstadoEquipo });
      showToast({ title: 'Devolución registrada', description: `${prestamo.equipoCodigo} fue recibido y actualizado en inventario.`, variant: 'success' });
      onGuardado();
      onClose();
    } catch (err: unknown) {
      setErrorServidor(mensajeError(err));
      notificarError(showToast, err, 'Devolución rechazada');
    }
  });

  return (
    <Modal
      open={prestamo !== null}
      onClose={onClose}
      title="Registrar devolución"
      subtitle="RF-10 · Toda devolución exige observaciones (RN-10)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" form="form-devolucion" variant="success" loading={isSubmitting}>Confirmar devolución</Button>
        </>
      }
    >
      {prestamo && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <p className="font-semibold text-slate-900 dark:text-white">{prestamo.equipoCodigo} — {prestamo.equipoNombre}</p>
          <p className="text-slate-600 dark:text-slate-300">Colaborador: {prestamo.usuarioNombre} ({prestamo.usuarioArea})</p>
          <p className="text-slate-600 dark:text-slate-300">Préstamo: {formatFechaCorta(prestamo.fechaPrestamo)} · Devolución prevista: {formatFechaCorta(prestamo.fechaDevolucion)}</p>
          <StatusBadge status={prestamo.estadoPrestamo} />
        </div>
      )}
      <form id="form-devolucion" onSubmit={onSubmit} noValidate className="space-y-4">
        {errorServidor && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{errorServidor}</div>}
        <FormField label="Fecha real de devolución" htmlFor="dv-fecha" required error={errors.fechaDevolucionReal?.message}>
          <DatePicker id="dv-fecha" hasError={Boolean(errors.fechaDevolucionReal)} {...register('fechaDevolucionReal')} />
        </FormField>
        <FormField label="Estado del equipo recibido" htmlFor="dv-estado" required error={errors.estadoEquipoDestino?.message} helperText="Elija «Mantenimiento» si el equipo regresa con fallas.">
          <Select id="dv-estado" options={[{ value: 'Disponible', label: 'Disponible — en buen estado' }, { value: 'Mantenimiento', label: 'Mantenimiento — requiere revisión' }]} {...register('estadoEquipoDestino')} />
        </FormField>
        <FormField label="Observaciones de la devolución" htmlFor="dv-obs" required ruleBadge="RN-10" error={errors.observacion?.message}>
          <Input id="dv-obs" placeholder="Ej. Se entrega con cargador y sin daños visibles" hasError={Boolean(errors.observacion)} {...register('observacion')} />
        </FormField>
      </form>
    </Modal>
  );
}
