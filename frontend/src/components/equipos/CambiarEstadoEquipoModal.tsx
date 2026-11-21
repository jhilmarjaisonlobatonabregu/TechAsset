import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ESTADOS_EQUIPO } from '../../constants/catalogos';
import { equiposService } from '../../services/equiposService';
import type { EquipoDto, EstadoEquipo } from '../../types';
import { notificarError } from '../../utils/errores';
import { cambioEstadoSchema, type CambioEstadoFormValues } from '../../utils/esquemas';
import { Button, FormField, Input, Modal, Select, useToast } from '../ui';

export interface CambiarEstadoEquipoModalProps {
  equipo: EquipoDto | null;
  onClose: () => void;
  onGuardado: () => void;
}

/** RF-08: actualizar estado del equipo con observación obligatoria y registro en movimientos. */
export function CambiarEstadoEquipoModal({
  equipo,
  onClose,
  onGuardado,
}: CambiarEstadoEquipoModalProps) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CambioEstadoFormValues>({
    resolver: zodResolver(cambioEstadoSchema),
    defaultValues: { estado: 'Disponible', observacion: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (equipo) {
      reset({ estado: equipo.estado, observacion: '' });
    }
  }, [equipo, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    if (!equipo) return;
    try {
      await equiposService.cambiarEstado(equipo.id, {
        estado: valores.estado as EstadoEquipo,
        observacion: valores.observacion,
      });
      showToast({
        title: 'Estado actualizado',
        description: `${equipo.codigoPatrimonial} ahora está «${valores.estado}».`,
        variant: 'success',
      });
      onClose();
      onGuardado();
    } catch (err: unknown) {
      notificarError(showToast, err);
    }
  });

  return (
    <Modal
      open={equipo !== null}
      onClose={onClose}
      title="Actualizar estado del equipo"
      subtitle={equipo ? `${equipo.codigoPatrimonial} — ${equipo.nombre}` : undefined}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-estado" loading={isSubmitting}>
            Guardar estado
          </Button>
        </>
      }
    >
      <form id="form-estado" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Nuevo estado" htmlFor="ce-estado" required error={errors.estado?.message}>
          <Select
            id="ce-estado"
            options={ESTADOS_EQUIPO.filter((e) => e !== 'Prestado').map((e) => ({
              value: e,
              label: e,
            }))}
            {...register('estado')}
          />
        </FormField>
        <FormField
          label="Motivo / observación"
          htmlFor="ce-obs"
          required
          error={errors.observacion?.message}
        >
          <Input
            id="ce-obs"
            placeholder="Ej. Falla en teclado, enviado a mantenimiento"
            hasError={Boolean(errors.observacion)}
            {...register('observacion')}
          />
        </FormField>
      </form>
    </Modal>
  );
}
