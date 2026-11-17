import { z } from 'zod';
import { CATEGORIAS_EQUIPO, ESTADOS_EQUIPO, ROLES_USUARIO } from '../constants/catalogos';

/** Esquemas Zod de los formularios: reflejan las reglas validadas también en el backend. */

export const loginSchema = z.object({
  correo: z
    .string()
    .min(1, 'El correo institucional es obligatorio.')
    .email('Ingrese un correo válido (ej. usuario@innovatech.pe).'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const crearUsuarioSchema = (esEdicion: boolean) =>
  z.object({
    nombres: z.string().trim().min(2, 'Los nombres son obligatorios (mínimo 2 caracteres).').max(100, 'Máximo 100 caracteres.'),
    apellidos: z.string().trim().min(2, 'Los apellidos son obligatorios (mínimo 2 caracteres).').max(100, 'Máximo 100 caracteres.'),
    correo: z
      .string()
      .trim()
      .min(1, 'El correo es obligatorio.')
      .max(150, 'Máximo 150 caracteres.')
      .email('Formato de correo no válido (RN-08: debe ser único).'),
    area: z.string().trim().min(1, 'Seleccione el área del colaborador.').max(100),
    rol: z.enum(ROLES_USUARIO as unknown as [string, ...string[]], { message: 'Seleccione un rol.' }),
    password: z
      .string()
      .max(100, 'Máximo 100 caracteres.')
      .refine((v) => (esEdicion ? true : v === '' || v.length >= 8), 'La contraseña debe tener al menos 8 caracteres.'),
  });
export type UsuarioFormValues = z.infer<ReturnType<typeof crearUsuarioSchema>>;

export const equipoSchema = z.object({
  codigoPatrimonial: z
    .string()
    .trim()
    .min(3, 'El código patrimonial es obligatorio (mínimo 3 caracteres).')
    .max(50, 'Máximo 50 caracteres.')
    .regex(/^[A-Za-z0-9\-_.]+$/, 'Use solo letras, números y guiones (RN-07: debe ser único).'),
  nombre: z.string().trim().min(3, 'El nombre es obligatorio (mínimo 3 caracteres).').max(100, 'Máximo 100 caracteres.'),
  categoria: z.enum(CATEGORIAS_EQUIPO as unknown as [string, ...string[]], { message: 'Seleccione una categoría.' }),
  marca: z.string().trim().min(2, 'La marca es obligatoria.').max(50, 'Máximo 50 caracteres.'),
  estado: z.enum(ESTADOS_EQUIPO as unknown as [string, ...string[]], { message: 'Seleccione un estado.' }),
});
export type EquipoFormValues = z.infer<typeof equipoSchema>;

export const cambioEstadoSchema = z.object({
  estado: z.enum(ESTADOS_EQUIPO as unknown as [string, ...string[]], { message: 'Seleccione un estado.' }),
  observacion: z.string().trim().min(5, 'Indique el motivo del cambio (mínimo 5 caracteres).').max(500),
});
export type CambioEstadoFormValues = z.infer<typeof cambioEstadoSchema>;

export const prestamoSchema = z
  .object({
    equipoId: z.string().min(1, 'Seleccione el equipo a prestar.'),
    usuarioId: z.string().min(1, 'Seleccione el colaborador receptor.'),
    responsableId: z.string().min(1, 'RN-05: todo préstamo debe registrar un responsable.'),
    fechaPrestamo: z.string().min(1, 'La fecha de préstamo es obligatoria.'),
    fechaDevolucion: z.string().min(1, 'La fecha de devolución es obligatoria.'),
    observacion: z.string().trim().min(5, 'Indique el motivo o uso del equipo (mínimo 5 caracteres).').max(500, 'Máximo 500 caracteres.'),
  })
  .refine((v) => !v.fechaPrestamo || !v.fechaDevolucion || v.fechaDevolucion > v.fechaPrestamo, {
    path: ['fechaDevolucion'],
    message: 'RN-04: la fecha de devolución debe ser posterior a la fecha de préstamo.',
  });
export type PrestamoFormValues = z.infer<typeof prestamoSchema>;

export const devolucionSchema = (fechaPrestamo: string) =>
  z.object({
    observacion: z.string().trim().min(5, 'RN-10: toda devolución exige observaciones (mínimo 5 caracteres).').max(500, 'Máximo 500 caracteres.'),
    fechaDevolucionReal: z
      .string()
      .min(1, 'La fecha real de devolución es obligatoria.')
      .refine((v) => v >= fechaPrestamo.slice(0, 10), 'La fecha de devolución no puede ser anterior al préstamo.'),
    estadoEquipoDestino: z.enum(['Disponible', 'Mantenimiento'], { message: 'Seleccione el estado del equipo.' }),
  });
export type DevolucionFormValues = z.infer<ReturnType<typeof devolucionSchema>>;
