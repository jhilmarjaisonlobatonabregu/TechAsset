import type {
  CategoriaEquipo,
  EstadoEquipo,
  EstadoPrestamo,
  RolUsuario,
  TipoMovimiento,
} from '../types';

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

export const ESTADO_PRESTAMO = {
  PENDIENTE: 'Pendiente',
  ACTIVO: 'Activo',
  DEVUELTO: 'Devuelto',
} as const satisfies Record<string, EstadoPrestamo>;

export const ESTADOS_PRESTAMO: readonly EstadoPrestamo[] = [
  ESTADO_PRESTAMO.PENDIENTE,
  ESTADO_PRESTAMO.ACTIVO,
  ESTADO_PRESTAMO.DEVUELTO,
] as const;

export const TIPOS_MOVIMIENTO: readonly TipoMovimiento[] = [
  'AltaEquipo',
  'ActualizacionEquipo',
  'Prestamo',
  'Devolucion',
  'CambioEstado',
  'BajaLogica',
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
