import type {
  CambiarEstadoEquipoPayload,
  CrearActualizarEquipoPayload,
  EquipoDto,
} from '../types';
import { apiClient } from './apiClient';

export interface FiltroEquiposParams {
  busqueda?: string;
  estado?: string;
  categoria?: string;
  marca?: string;
}

export const equiposService = {
  listar: (filtros?: FiltroEquiposParams): Promise<EquipoDto[]> =>
    apiClient.get<EquipoDto[]>('/equipos', {
      busqueda: filtros?.busqueda,
      estado: filtros?.estado,
      categoria: filtros?.categoria,
      marca: filtros?.marca,
    }),

  crear: (payload: CrearActualizarEquipoPayload): Promise<EquipoDto> =>
    apiClient.post<EquipoDto>('/equipos', payload),

  actualizar: (id: string, payload: CrearActualizarEquipoPayload): Promise<EquipoDto> =>
    apiClient.put<EquipoDto>(`/equipos/${id}`, payload),

  cambiarEstado: (id: string, payload: CambiarEstadoEquipoPayload): Promise<EquipoDto> =>
    apiClient.patch<EquipoDto>(`/equipos/${id}/estado`, payload),

  eliminarOBajaLogica: (id: string, aplicarBajaLogica = true): Promise<{ mensaje?: string }> =>
    apiClient.delete<{ mensaje?: string }>(`/equipos/${id}`, { aplicarBajaLogica }),
};
