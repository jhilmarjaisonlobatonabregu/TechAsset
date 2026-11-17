import { ApiError } from '../services/apiClient';
import type { ToastContextValue } from '../components/ui';

/** Muestra un error de API (incluye códigos RN-xx del backend) mediante Toast. */
export function notificarError(showToast: ToastContextValue['showToast'], err: unknown, titulo = 'No se pudo completar la operación'): void {
  if (err instanceof ApiError) {
    showToast({ title: titulo, description: err.message, variant: err.status === 0 ? 'error' : 'warning', codigoRegla: err.codigo });
    return;
  }
  showToast({ title: titulo, description: err instanceof Error ? err.message : 'Error inesperado.', variant: 'error' });
}

export function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : 'Error inesperado.';
}
