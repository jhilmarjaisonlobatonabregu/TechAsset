export type RolUsuario = 'Administrador' | 'Responsable de Tecnología' | 'Colaborador';

export type EstadoEquipo = 'Disponible' | 'Prestado' | 'Mantenimiento' | 'Baja';

export type CategoriaEquipo =
  | 'Laptops'
  | 'Computadoras de escritorio'
  | 'Monitores'
  | 'Impresoras'
  | 'Tablets'
  | 'Proyectores multimedia'
  | 'Equipos de red';

export type EstadoPrestamo = 'Pendiente' | 'Activo' | 'Devuelto';

export type TipoMovimiento =
  | 'AltaEquipo'
  | 'ActualizacionEquipo'
  | 'Prestamo'
  | 'Devolucion'
  | 'CambioEstado'
  | 'BajaLogica';

export type VistaNavegacion = 'dashboard' | 'equipos' | 'prestamos' | 'usuarios' | 'reportes';

export interface UsuarioAuthDto {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  area: string;
  rol: RolUsuario;
  estado: boolean;
}

export interface LoginResponseDto {
  token: string;
  usuario: UsuarioAuthDto;
}

export interface UsuarioDto {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  area: string;
  rol: RolUsuario;
  estado: boolean;
  totalPrestamos: number;
  prestamosActivos: number;
  fechaRegistro: string;
}

export interface CrearUsuarioPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  area: string;
  rol: RolUsuario;
  password: string;
}

export interface ActualizarUsuarioPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  area: string;
  rol: RolUsuario;
  estado: boolean;
}

export interface DeshabilitarUsuarioPayload {
  estado: boolean;
  motivo?: string;
}

export interface UsuarioMinimoDto {
  id: string;
  nombreCompleto: string;
  area: string;
}

export interface EquipoDto {
  id: string;
  codigoPatrimonial: string;
  nombre: string;
  categoria: CategoriaEquipo | string;
  marca: string;
  estado: EstadoEquipo;
  totalPrestamos: number;
  usuarioActual?: string | null;
  areaActual?: string | null;
  fechaRegistro: string;
}

export interface CrearActualizarEquipoPayload {
  codigoPatrimonial: string;
  nombre: string;
  categoria: string;
  marca: string;
  estado: EstadoEquipo;
}

export interface CambiarEstadoEquipoPayload {
  estado: EstadoEquipo;
  observacion: string;
}

export interface PrestamoDto {
  id: string;
  fechaPrestamo: string;
  fechaDevolucion: string;
  fechaDevolucionReal?: string | null;
  observacion: string;
  observacionDevolucion?: string | null;
  estadoPrestamo: EstadoPrestamo | string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  usuarioArea: string;
  equipoId: string;
  equipoCodigo: string;
  equipoNombre: string;
  equipoCategoria: string;
  equipoMarca: string;
  responsableId?: string | null;
  responsableNombre: string;
}

export interface RegistrarPrestamoPayload {
  equipoId: string;
  usuarioId: string;
  responsableId?: string | null;
  fechaPrestamo: string;
  fechaDevolucion: string;
  observacion: string;
}

export interface RegistrarDevolucionPayload {
  observacion: string;
  fechaDevolucionReal: string;
  estadoEquipoDestino: EstadoEquipo;
}

export interface EquipoPorEstadoResumenDto {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface PrestamoPorAreaDto {
  area: string;
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosDevueltos: number;
  porcentaje?: number;
  colaboradoresActivos?: number;
}

export interface EquipoMasUtilizadoDto {
  equipoId: string;
  codigoPatrimonial: string;
  nombre: string;
  categoria: string;
  marca: string;
  estadoActual: EstadoEquipo | string;
  totalPrestamos: number;
  ultimoUsuario?: string | null;
  ultimaArea?: string | null;
}

export interface MovimientoInventarioDto {
  id: string;
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  equipoId: string;
  equipoCodigo: string;
  equipoNombre: string;
  equipoCategoria: string;
  estadoAnterior: string;
  estadoNuevo: string;
  usuarioInvolucrado?: string | null;
  responsableNombre?: string | null;
  area: string;
  observacion: string;
}

export interface DashboardDto {
  totalEquipos: number;
  equiposDisponibles: number;
  equiposPrestados: number;
  equiposEnMantenimiento: number;
  equiposDeBaja: number;
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosDevueltos: number;
  areaConMayorUso: string;
  prestamosAreaMayorUso: number;
  equiposPorEstado: EquipoPorEstadoResumenDto[];
  prestamosPorArea: PrestamoPorAreaDto[];
  equiposMasUtilizados: EquipoMasUtilizadoDto[];
  ultimosMovimientos: MovimientoInventarioDto[];
}

export interface BackendErrorPayload {
  exito?: boolean;
  codigo?: string;
  mensaje?: string;
  message?: string;
  errores?: string[];
}

export interface ReporteEquiposPorEstadoDto {
  resumen: EquipoPorEstadoResumenDto[];
  equipos: EquipoDto[];
}
