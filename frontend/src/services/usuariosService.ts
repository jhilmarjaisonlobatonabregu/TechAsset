import type {
  ActualizarUsuarioPayload,
  CrearUsuarioPayload,
  DeshabilitarUsuarioPayload,
  UsuarioDto,
} from '../types';
import { apiClient } from './apiClient';

export interface FiltroUsuariosParams {
  busqueda?: string;
  area?: string;
  rol?: string;
  estado?: string;
}

export const usuariosService = {
  listar: (filtros?: FiltroUsuariosParams): Promise<UsuarioDto[]> =>
    apiClient.get<UsuarioDto[]>('/usuarios', {
      busqueda: filtros?.busqueda,
      area: filtros?.area,
      rol: filtros?.rol,
      estado: filtros?.estado,
    }),

  listarResponsables: (): Promise<UsuarioDto[]> => apiClient.get<UsuarioDto[]>('/usuarios/responsables'),

  crear: (payload: CrearUsuarioPayload): Promise<UsuarioDto> =>
    apiClient.post<UsuarioDto>('/usuarios', payload),

  actualizar: (id: string, payload: ActualizarUsuarioPayload): Promise<UsuarioDto> =>
    apiClient.put<UsuarioDto>(`/usuarios/${id}`, payload),

  cambiarEstadoHabilitacion: (
    id: string,
    payload: DeshabilitarUsuarioPayload,
  ): Promise<UsuarioDto> => apiClient.patch<UsuarioDto>(`/usuarios/${id}/deshabilitar`, payload),
};
