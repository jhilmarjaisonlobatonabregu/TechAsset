export function formatFechaCorta(fechaIso?: string | null): string {
  if (!fechaIso) return '—';
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return fechaIso;
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatFechaHora(fechaIso?: string | null): string {
  if (!fechaIso) return '—';
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return fechaIso;
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function obtenerFechaInputHoy(diasAdicionales = 0): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasAdicionales);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function esPrestamoVencido(fechaDevolucionIso: string, estadoPrestamo: string): boolean {
  if (estadoPrestamo !== 'Activo') return false;
  const fechaDev = new Date(fechaDevolucionIso);
  if (Number.isNaN(fechaDev.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fechaDev.getTime() < hoy.getTime();
}
