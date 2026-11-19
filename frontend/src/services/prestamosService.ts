import type {
  PrestamoDto,
  RegistrarDevolucionPayload,
  RegistrarPrestamoPayload,
} from '../types';
import { apiClient } from './apiClient';

export interface FiltroPrestamosParams {
  busqueda?: string;
  estadoPrestamo?: string;
  area?: string;
  usuarioId?: string;
  equipoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export const prestamosService = {
  listar: (filtros?: FiltroPrestamosParams): Promise<PrestamoDto[]> =>
    apiClient.get<PrestamoDto[]>('/prestamos', {
      busqueda: filtros?.busqueda,
      estadoPrestamo: filtros?.estadoPrestamo,
      area: filtros?.area,
      usuarioId: filtros?.usuarioId,
      equipoId: filtros?.equipoId,
      fechaDesde: filtros?.fechaDesde,
      fechaHasta: filtros?.fechaHasta,
    }),

  listarActivos: (): Promise<PrestamoDto[]> =>
    apiClient.get<PrestamoDto[]>('/prestamos/activos'),

  registrarPrestamo: (payload: RegistrarPrestamoPayload): Promise<PrestamoDto> =>
    apiClient.post<PrestamoDto>('/prestamos', {
      ...payload,
      responsableId: payload.responsableId || null,
    }),

  aprobarPrestamo: (prestamoId: string): Promise<PrestamoDto> =>
    apiClient.patch<PrestamoDto>(`/prestamos/${prestamoId}/aprobar`),

  registrarDevolucion: (
    prestamoId: string,
    payload: RegistrarDevolucionPayload,
  ): Promise<PrestamoDto> =>
    apiClient.post<PrestamoDto>(`/prestamos/${prestamoId}/devolucion`, payload),
};
