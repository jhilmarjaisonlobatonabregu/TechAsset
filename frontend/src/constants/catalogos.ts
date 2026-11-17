import type { CategoriaEquipo, DemoUserDto, EstadoEquipo, RolUsuario } from '../types';

export const CATEGORIAS_EQUIPO: readonly CategoriaEquipo[] = [
  'Laptops',
  'Computadoras de escritorio',
  'Monitores',
  'Impresoras',
  'Tablets',
  'Proyectores multimedia',
  'Equipos de red',
] as const;

export const ESTADOS_EQUIPO: readonly EstadoEquipo[] = [
  'Disponible',
  'Prestado',
  'Mantenimiento',
  'Baja',
] as const;

export const ROLES_USUARIO: readonly RolUsuario[] = [
  'Administrador',
  'Responsable de Tecnología',
  'Colaborador',
] as const;

export const AREAS_ORGANIZACION: readonly string[] = [
  'Desarrollo de Software',
  'Ciencia de Datos e IA',
  'Aseguramiento de Calidad QA',
  'Finanzas y Contabilidad',
  'Operaciones y Proyectos',
  'Infraestructura y Soporte',
] as const;

export const MARCAS_SUGERIDAS: readonly string[] = [
  'Dell',
  'Lenovo',
  'HP',
  'Apple',
  'LG',
  'Samsung',
  'Epson',
  'Cisco',
  'Ubiquiti',
  'Brother',
] as const;

export const DEMO_USERS_FALLBACK: readonly DemoUserDto[] = [
  {
    nombreCompleto: 'Carlos Mendoza Vargas',
    correo: 'cmendoza@innovatech.pe',
    passwordDemo: 'Admin2026!',
    rol: 'Administrador',
    area: 'Tecnología de la Información',
    descripcion: 'Control total del sistema, gestión de inventario, préstamos y deshabilitación de usuarios (RN-09).',
  },
  {
    nombreCompleto: 'Lucía Quispe Huamán',
    correo: 'lquispe@innovatech.pe',
    passwordDemo: 'Soporte2026!',
    rol: 'Responsable de Tecnología',
    area: 'Soporte Técnico',
    descripcion: 'Responsable de préstamos (RN-05), recepción de devoluciones (RN-10) y mantenimiento de activos.',
  },
  {
    nombreCompleto: 'Andrés Torres Salazar',
    correo: 'atorres@innovatech.pe',
    passwordDemo: 'Colab2026!',
    rol: 'Colaborador',
    area: 'Desarrollo de Software',
    descripcion: 'Consulta de disponibilidad de equipos, historial de asignaciones y seguimiento de préstamos.',
  },
] as const;

export const REGLAS_NEGOCIO_RESUMEN = [
  { codigo: 'RN-01', titulo: 'Préstamo único activo', detalle: 'Un equipo no podrá ser prestado si ya se encuentra asignado a otro usuario.' },
  { codigo: 'RN-02', titulo: 'Bloqueo por mantenimiento', detalle: 'Un equipo en estado de mantenimiento no podrá ser registrado en un préstamo.' },
  { codigo: 'RN-03', titulo: 'Bloqueo por baja', detalle: 'Un equipo dado de baja no podrá ser prestado bajo ninguna circunstancia.' },
  { codigo: 'RN-04', titulo: 'Coherencia de fechas', detalle: 'La fecha de devolución deberá ser posterior a la fecha de préstamo.' },
  { codigo: 'RN-05', titulo: 'Responsable obligatorio', detalle: 'Todo préstamo deberá estar asociado obligatoriamente a un usuario responsable.' },
  { codigo: 'RN-06', titulo: 'Protección histórica (Baja lógica)', detalle: 'No se permitirá eliminar equipos que tengan préstamos registrados; se aplicará baja lógica.' },
  { codigo: 'RN-07', titulo: 'Código patrimonial único', detalle: 'El código patrimonial de cada equipo deberá ser único en todo el sistema.' },
  { codigo: 'RN-08', titulo: 'Validación de usuario', detalle: 'Todo usuario registrado deberá contar con correo electrónico válido y datos obligatorios completos.' },
  { codigo: 'RN-09', titulo: 'Exclusividad de deshabilitación', detalle: 'Solo el administrador podrá deshabilitar usuarios del sistema.' },
  { codigo: 'RN-10', titulo: 'Observación en devolución', detalle: 'Toda devolución deberá registrar observaciones sobre el estado de recepción.' },
] as const;
