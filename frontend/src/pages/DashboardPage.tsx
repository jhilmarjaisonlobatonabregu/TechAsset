import { ArrowLeftRight, CheckCircle2, Laptop, Plus, UserPlus, Users, Wrench, Building } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, Spinner, StatCard, StatusBadge } from '../components/ui';
import { useCarga } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { DashboardDto, VistaNavegacion } from '../types';
import { formatFechaHora, formatTipoMovimiento } from '../utils/formatters';

const COLORES_ESTADO: Record<string, string> = {
  Disponible: '#10b981',
  Prestado: '#3b82f6',
  Mantenimiento: '#f59e0b',
  Baja: '#f43f5e',
};

export interface DashboardPageProps {
  onNavegar: (vista: VistaNavegacion, accionInicial?: string) => void;
}

export function DashboardPage({ onNavegar }: DashboardPageProps) {
  const { usuario } = useAuth();
  const { datos: d, cargando, error, recargar } = useCarga<DashboardDto | null>(() => dashboardService.obtenerIndicadores(), null, []);

  if (cargando && !d) return <Spinner fullSection label="Cargando indicadores del dashboard…" size="lg" />;
  if (error) {
    return (
      <ErrorState
        title="No se pudo cargar el dashboard"
        description={error}
        onRetry={() => void recargar()}
      />
    );
  }
  if (!d) {
    return (
      <EmptyState
        title="No hay indicadores disponibles"
        description="Aún no se registran datos para mostrar en el dashboard."
        actionLabel="Reintentar"
        onAction={() => void recargar()}
      />
    );
  }

  const totalEstados = d.equiposPorEstado.reduce((acc, e) => acc + e.cantidad, 0) || 1;
  let acumulado = 0;
  const segmentos = d.equiposPorEstado.map((e) => {
    const inicio = (acumulado / totalEstados) * 100;
    acumulado += e.cantidad;
    const fin = (acumulado / totalEstados) * 100;
    return `${COLORES_ESTADO[e.estado] ?? '#94a3b8'} ${inicio}% ${fin}%`;
  });
  const maxArea = Math.max(1, ...d.prestamosPorArea.map((a) => a.totalPrestamos));
  const maxTop = Math.max(1, ...d.equiposMasUtilizados.map((e) => e.totalPrestamos));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard General</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Bienvenido(a), {usuario?.nombres}. Resumen del inventario y préstamos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" leftIcon={<ArrowLeftRight className="h-4 w-4" />} onClick={() => onNavegar('prestamos', 'nuevo')}>
            Registrar préstamo
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onNavegar('equipos', 'nuevo')}>
            Registrar equipo
          </Button>
          <Button size="sm" variant="outline" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => onNavegar('usuarios', 'nuevo')}>
            Registrar usuario
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores principales">
        <StatCard title="Total de equipos" value={d.totalEquipos} subtitle={`${d.equiposDeBaja} en baja`} icon={<Laptop className="h-5 w-5" />} accent="blue" onClick={() => onNavegar('equipos', 'estado:')} />
        <StatCard title="Equipos disponibles" value={d.equiposDisponibles} subtitle="Listos para préstamo" icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" onClick={() => onNavegar('equipos', 'estado:Disponible')} />
        <StatCard title="Equipos prestados" value={d.equiposPrestados} subtitle={`${d.prestamosActivos} ${d.prestamosActivos === 1 ? 'préstamo activo' : 'préstamos activos'}`} icon={<Users className="h-5 w-5" />} accent="purple" onClick={() => onNavegar('prestamos', 'activos')} />
        <StatCard title="Equipos en mantenimiento" value={d.equiposEnMantenimiento} subtitle="No se pueden prestar" icon={<Wrench className="h-5 w-5" />} accent="amber" onClick={() => onNavegar('equipos', 'estado:Mantenimiento')} />
        <StatCard title="Total de préstamos" value={d.totalPrestamos} subtitle={`${d.prestamosDevueltos} ${d.prestamosDevueltos === 1 ? 'devuelto' : 'devueltos'}`} icon={<ArrowLeftRight className="h-5 w-5" />} accent="teal" onClick={() => onNavegar('prestamos', 'historial')} />
        <StatCard title="Área con mayor uso" value={d.areaConMayorUso || '—'} subtitle={`${d.prestamosAreaMayorUso} ${d.prestamosAreaMayorUso === 1 ? 'préstamo' : 'préstamos'}`} icon={<Building className="h-5 w-5" />} accent="rose" onClick={() => onNavegar('reportes', 'area')} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Equipos por estado" subtitle="Distribución actual del inventario">
          <div className="flex flex-col items-center gap-4">
            <div
              role="img"
              aria-label={`Gráfico de estados: ${d.equiposPorEstado.map((e) => `${e.estado} ${e.cantidad}`).join(', ')}`}
              className="relative h-40 w-40 rounded-full"
              style={{ background: `conic-gradient(${segmentos.join(', ')})` }}
            >
              <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{d.totalEquipos}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">{d.totalEquipos === 1 ? 'equipo' : 'equipos'}</span>
              </div>
            </div>
            <ul className="w-full space-y-1.5 text-sm">
              {d.equiposPorEstado.map((e) => (
                <li key={e.estado} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORES_ESTADO[e.estado] ?? '#94a3b8' }} />
                    {e.estado}
                  </span>
                  <span className="font-semibold">{e.cantidad} <span className="font-normal text-slate-600 dark:text-slate-400">({e.porcentaje.toFixed(0)}%)</span></span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Préstamos por área" subtitle="Cantidad de préstamos por área">
          <ul className="space-y-3">
            {d.prestamosPorArea.map((a) => (
              <li key={a.area}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{a.area}</span>
                  <span className="font-semibold">{a.totalPrestamos}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${(a.totalPrestamos / maxArea) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Top equipos más usados" subtitle="Equipos con más préstamos">
          <ol className="space-y-3">
            {d.equiposMasUtilizados.slice(0, 6).map((e, i) => (
              <li key={e.equipoId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{i + 1}. {e.nombre}</span>
                  <span className="font-semibold">{e.totalPrestamos}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${(e.totalPrestamos / maxTop) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card title="Últimos movimientos de inventario" subtitle="Altas, préstamos, devoluciones y cambios de estado">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {d.ultimosMovimientos.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                  {formatTipoMovimiento(m.tipoMovimiento)} · {m.equipoCodigo} — {m.equipoNombre}
                </p>
                <p className="truncate text-sm text-slate-600 dark:text-slate-400">{m.observacion}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={m.estadoNuevo} />
                <span className="text-sm text-slate-600 dark:text-slate-400">{formatFechaHora(m.fecha)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
