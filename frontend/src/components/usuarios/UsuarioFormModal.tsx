import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormField, Input, Modal, Select, useToast } from '../ui';
import { AREAS_ORGANIZACION, ROLES_USUARIO } from '../../constants/catalogos';
import { usuariosService } from '../../services/usuariosService';
import type { RolUsuario, UsuarioDto } from '../../types';
import { mensajeError, notificarError } from '../../utils/errores';
import { crearUsuarioSchema, type UsuarioFormValues } from '../../utils/esquemas';

export interface UsuarioFormModalProps {
  open: boolean;
  usuario: UsuarioDto | null;
  onClose: () => void;
  onGuardado: () => void;
}

const VACIO: UsuarioFormValues = { nombres: '', apellidos: '', correo: '', area: '', rol: 'Colaborador', password: '' };

/** RF-01 / RF-02: registro y actualización de usuarios (RN-08: correo único). */
export function UsuarioFormModal({ open, usuario, onClose, onGuardado }: UsuarioFormModalProps) {
  const { showToast } = useToast();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const esEdicion = usuario !== null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormValues>({ resolver: zodResolver(crearUsuarioSchema(esEdicion)), defaultValues: VACIO });

  useEffect(() => {
    if (open) {
      setErrorServidor(null);
      reset(usuario ? { nombres: usuario.nombres, apellidos: usuario.apellidos, correo: usuario.correo, area: usuario.area, rol: usuario.rol, password: '' } : VACIO);
    }
  }, [open, usuario, reset]);

  const onSubmit = handleSubmit(async (v) => {
    setErrorServidor(null);
    try {
      if (usuario) {
        await usuariosService.actualizar(usuario.id, { nombres: v.nombres, apellidos: v.apellidos, correo: v.correo, area: v.area, rol: v.rol as RolUsuario, estado: usuario.estado });
        showToast({ title: 'Usuario actualizado', description: `${v.nombres} ${v.apellidos}`, variant: 'success' });
      } else {
        await usuariosService.crear({ nombres: v.nombres, apellidos: v.apellidos, correo: v.correo, area: v.area, rol: v.rol as RolUsuario, password: v.password });
        showToast({ title: 'Usuario registrado', description: `${v.nombres} ${v.apellidos} ya puede iniciar sesión.`, variant: 'success' });
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
      title={esEdicion ? 'Actualizar usuario' : 'Registrar usuario'}
      subtitle="RF-01 / RF-02 · El correo debe ser único (RN-08)"
      size="lg"
      footer={<><Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button><Button type="submit" form="form-usuario" loading={isSubmitting}>{esEdicion ? 'Guardar cambios' : 'Registrar usuario'}</Button></>}
    >
      <form id="form-usuario" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errorServidor && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{errorServidor}</div>}
        <FormField label="Nombres" htmlFor="us-nombres" required error={errors.nombres?.message}><Input id="us-nombres" hasError={Boolean(errors.nombres)} {...register('nombres')} /></FormField>
        <FormField label="Apellidos" htmlFor="us-apellidos" required error={errors.apellidos?.message}><Input id="us-apellidos" hasError={Boolean(errors.apellidos)} {...register('apellidos')} /></FormField>
        <FormField label="Correo institucional" htmlFor="us-correo" required ruleBadge="RN-08" error={errors.correo?.message}><Input id="us-correo" type="email" placeholder="usuario@innovatech.pe" hasError={Boolean(errors.correo)} {...register('correo')} /></FormField>
        <FormField label="Área" htmlFor="us-area" required error={errors.area?.message}><Select id="us-area" placeholder="Seleccione…" hasError={Boolean(errors.area)} options={AREAS_ORGANIZACION.map((a) => ({ value: a, label: a }))} {...register('area')} /></FormField>
        <FormField label="Rol" htmlFor="us-rol" required error={errors.rol?.message}><Select id="us-rol" hasError={Boolean(errors.rol)} options={ROLES_USUARIO.map((r) => ({ value: r, label: r }))} {...register('rol')} /></FormField>
        {!esEdicion && (
          <FormField label="Contraseña inicial" htmlFor="us-pass" error={errors.password?.message} helperText="Opcional. Si la deja vacía se asigna una contraseña inicial.">
            <Input id="us-pass" type="password" autoComplete="new-password" hasError={Boolean(errors.password)} {...register('password')} />
          </FormField>
        )}
      </form>
    </Modal>
  );
}
