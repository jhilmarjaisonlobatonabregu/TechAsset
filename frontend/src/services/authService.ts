import type { LoginResponseDto } from '../types';
import { apiClient } from './apiClient';

export const authService = {
  login: (correo: string, password: string): Promise<LoginResponseDto> =>
    apiClient.post<LoginResponseDto>('/auth/login', { correo, password }),
};
