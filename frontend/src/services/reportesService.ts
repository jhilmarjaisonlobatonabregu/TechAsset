import type {
  EquipoMasUtilizadoDto,
  MovimientoInventarioDto,
  PrestamoPorAreaDto,
  ReporteEquiposPorEstadoDto,
} from '../types';
import { apiClient } from './apiClient';

export interface FiltroMovimientosParams {
  tipo?: string;
  busqueda?: string;
  equipoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export const reportesService = {
  obtenerEquiposPorEstado: (estado?: string): Promise<ReporteEquiposPorEstadoDto> =>
    apiClient.get<ReporteEquiposPorEstadoDto>('/reportes/equipos-por-estado', { estado }),

  obtenerEquiposMasUtilizados: (top = 10): Promise<EquipoMasUtilizadoDto[]> =>
    apiClient.get<EquipoMasUtilizadoDto[]>('/reportes/equipos-mas-utilizados', { top }),

  obtenerPrestamosPorArea: (): Promise<PrestamoPorAreaDto[]> =>
    apiClient.get<PrestamoPorAreaDto[]>('/reportes/prestamos-por-area'),

  obtenerMovimientos: (filtros?: FiltroMovimientosParams): Promise<MovimientoInventarioDto[]> =>
    apiClient.get<MovimientoInventarioDto[]>('/reportes/movimientos', {
      tipo: filtros?.tipo,
      busqueda: filtros?.busqueda,
      equipoId: filtros?.equipoId,
      fechaDesde: filtros?.fechaDesde,
      fechaHasta: filtros?.fechaHasta,
    }),
};
