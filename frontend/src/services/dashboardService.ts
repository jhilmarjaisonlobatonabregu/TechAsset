import type { DashboardDto } from '../types';
import { apiClient } from './apiClient';

export const dashboardService = {
  obtenerIndicadores: (): Promise<DashboardDto> =>
    apiClient.get<DashboardDto>('/dashboard'),
};
