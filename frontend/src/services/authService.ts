import { DEMO_USERS_FALLBACK } from '../constants/catalogos';
import type { DemoUserDto, LoginResponseDto } from '../types';
import { apiClient } from './apiClient';

export const authService = {
  login: (correo: string, password: string): Promise<LoginResponseDto> =>
    apiClient.post<LoginResponseDto>('/auth/login', { correo, password }),

  obtenerDemoUsers: async (): Promise<DemoUserDto[]> => {
    try {
      const lista = await apiClient.get<DemoUserDto[]>('/auth/demo-users');
      return Array.isArray(lista) && lista.length > 0 ? lista : [...DEMO_USERS_FALLBACK];
    } catch {
      return [...DEMO_USERS_FALLBACK];
    }
  },
};
