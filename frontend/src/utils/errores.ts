import { ApiError } from '../services/apiClient';
import type { ToastContextValue } from '../components/ui';

/** Limpia prefijos o referencias de códigos internos (RN-xx / RF-xx) antes de mostrar mensajes al usuario. */
export function limpiarMensajeRegla(texto: string): string {
  const limpio = texto
    .replace(/(?:\[(?:RN|RF)-\d+(?:[.,-]\d+)*\]|\b(?:RN|RF)-\d+\s*:)\s*/gi, '')
    .replace(/\s*\((?:RN|RF)-[^)]*\)/gi, '')
    .trim();
  if (!limpio) return texto.trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

/** Muestra un error de API mediante Toast sin exponer códigos técnicos. */
export function notificarError(showToast: ToastContextValue['showToast'], err: unknown, titulo = 'No se pudo completar la operación'): void {
  if (err instanceof ApiError) {
    showToast({ title: titulo, description: limpiarMensajeRegla(err.message), variant: err.status === 0 ? 'error' : 'warning' });
    return;
  }
  showToast({ title: titulo, description: err instanceof Error ? limpiarMensajeRegla(err.message) : 'Error inesperado.', variant: 'error' });
}

export function mensajeError(err: unknown): string {
  return err instanceof Error ? limpiarMensajeRegla(err.message) : 'Error inesperado.';
}

/** Traduce errores de carga de pantalla en mensajes claros para el usuario (sin términos técnicos). */
export function mensajeErrorCarga(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Su sesión venció. Inicie sesión de nuevo.';
    if (err.status === 403) return 'No tiene permiso para ver esta información.';
    if (err.status === 0 || err.status >= 500) {
      return 'El servidor no responde. Intente de nuevo en unos minutos.';
    }
    return 'No se pudo cargar la información. Intente de nuevo.';
  }
  return 'No se pudo cargar la información. Intente de nuevo.';
}
