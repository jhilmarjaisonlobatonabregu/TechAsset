import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormField, Input, Modal, Select, useToast } from '../ui';
import { CATEGORIAS_EQUIPO, ESTADOS_EQUIPO, MARCAS_SUGERIDAS } from '../../constants/catalogos';
import { equiposService } from '../../services/equiposService';
import type { EquipoDto, EstadoEquipo } from '../../types';
import { mensajeError, notificarError } from '../../utils/errores';
import { equipoSchema, type EquipoFormValues } from '../../utils/esquemas';

export interface EquipoFormModalProps {
  open: boolean;
  equipo: EquipoDto | null;
  onClose: () => void;
  onGuardado: () => void;
}

const VALORES_VACIOS: EquipoFormValues = { codigoPatrimonial: '', nombre: '', categoria: CATEGORIAS_EQUIPO[0], marca: '', estado: 'Disponible' };

/** RF-05 / RF-06: alta y actualización de equipos con validación Zod + reglas del backend (RN-07). */
export function EquipoFormModal({ open, equipo, onClose, onGuardado }: EquipoFormModalProps) {
  const { showToast } = useToast();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const esEdicion = equipo !== null;
  const esEquipoPrestado = equipo?.estado === 'Prestado';
  const opcionesEstado = esEquipoPrestado
    ? ESTADOS_EQUIPO
    : ESTADOS_EQUIPO.filter((e) => e !== 'Prestado');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EquipoFormValues>({
    resolver: zodResolver(equipoSchema),
    defaultValues: VALORES_VACIOS,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      setErrorServidor(null);
      reset(
        equipo
          ? { codigoPatrimonial: equipo.codigoPatrimonial, nombre: equipo.nombre, categoria: equipo.categoria, marca: equipo.marca, estado: equipo.estado }
          : VALORES_VACIOS,
      );
    }
  }, [open, equipo, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    const payload = { ...valores, estado: valores.estado as EstadoEquipo };
    try {
      if (equipo) {
        await equiposService.actualizar(equipo.id, payload);
        showToast({ title: 'Equipo actualizado', description: `${valores.codigoPatrimonial} se actualizó correctamente.`, variant: 'success' });
      } else {
        await equiposService.crear(payload);
        showToast({ title: 'Equipo registrado', description: `${valores.codigoPatrimonial} se agregó al inventario.`, variant: 'success' });
      }
      onGuardado();
      onClose();
    } catch (err: unknown) {
      setErrorServidor(mensajeError(err));
      notificarError(showToast, err);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Actualizar equipo' : 'Registrar equipo'}
      subtitle="El código patrimonial debe ser único"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" form="form-equipo" loading={isSubmitting}>{esEdicion ? 'Guardar cambios' : 'Registrar equipo'}</Button>
        </>
      }
    >
      <form id="form-equipo" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errorServidor && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {errorServidor}
          </div>
        )}
        <FormField label="Código patrimonial" htmlFor="eq-codigo" required error={errors.codigoPatrimonial?.message}>
          <Input id="eq-codigo" placeholder="INV-LAP-001" hasError={Boolean(errors.codigoPatrimonial)} {...register('codigoPatrimonial')} />
        </FormField>
        <FormField label="Nombre del equipo" htmlFor="eq-nombre" required error={errors.nombre?.message}>
          <Input id="eq-nombre" placeholder="Ej. Latitude 5540 Core i7" hasError={Boolean(errors.nombre)} {...register('nombre')} />
        </FormField>
        <FormField label="Categoría" htmlFor="eq-categoria" required error={errors.categoria?.message}>
          <Select id="eq-categoria" options={CATEGORIAS_EQUIPO.map((c) => ({ value: c, label: c }))} hasError={Boolean(errors.categoria)} {...register('categoria')} />
        </FormField>
        <FormField label="Marca" htmlFor="eq-marca" required error={errors.marca?.message}>
          <Input id="eq-marca" list="marcas-sugeridas" placeholder="Dell, HP, Lenovo…" hasError={Boolean(errors.marca)} {...register('marca')} />
          <datalist id="marcas-sugeridas">
            {MARCAS_SUGERIDAS.map((m) => (<option key={m} value={m} />))}
          </datalist>
        </FormField>
        <FormField label="Estado" htmlFor="eq-estado" required error={errors.estado?.message} helperText="Un equipo «Prestado» solo cambia mediante la devolución del préstamo.">
          <Select id="eq-estado" disabled={esEquipoPrestado} options={opcionesEstado.map((e) => ({ value: e, label: e }))} hasError={Boolean(errors.estado)} {...register('estado')} />
        </FormField>
      </form>
    </Modal>
  );
}
