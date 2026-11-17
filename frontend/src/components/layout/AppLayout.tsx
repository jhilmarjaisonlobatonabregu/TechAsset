import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  FileSpreadsheet,
  Laptop,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { VistaNavegacion } from '../../types';
import { StatusBadge } from '../ui';

export interface AppLayoutProps {
  vistaActual: VistaNavegacion;
  onCambiarVista: (vista: VistaNavegacion, accionInicial?: string) => void;
  children: React.ReactNode;
}

interface ItemMenu {
  id: VistaNavegacion;
  label: string;
  codigoRf: string;
  icon: React.ReactNode;
}

const ITEMS_MENU: readonly ItemMenu[] = [
  {
    id: 'dashboard',
    label: 'Dashboard General',
    codigoRf: 'RF-13',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: 'equipos',
    label: 'Inventario de Equipos',
    codigoRf: 'RF-05..08',
    icon: <Laptop className="h-5 w-5" />,
  },
  {
    id: 'prestamos',
    label: 'Préstamos y Devoluciones',
    codigoRf: 'RF-09..12',
    icon: <ArrowLeftRight className="h-5 w-5" />,
  },
  {
    id: 'usuarios',
    label: 'Usuarios y Accesos',
    codigoRf: 'RF-01..04',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'reportes',
    label: 'Reportes y Movimientos',
    codigoRf: 'RF-14..17',
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  vistaActual,
  onCambiarVista,
  children,
}) => {
  const { usuario, puedeOperarInventario, cerrarSesion } = useAuth();
  // RBAC: el Colaborador solo accede a dashboard, inventario (consulta) y sus préstamos
  const puedeVerModulo = (id: VistaNavegacion): boolean =>
    puedeOperarInventario || id === 'dashboard' || id === 'equipos' || id === 'prestamos';
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Backdrop móvil */}
      {sidebarAbierto && (
        <div
          className="no-print fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0 dark:border-slate-800 ${
          sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">TechAsset</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                  v1.0
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">Innovatech Solutions S.A.C.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarAbierto(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Cerrar menú lateral"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-5 pb-2">
          <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Módulos del Sistema
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-2" aria-label="Navegación principal">
          {ITEMS_MENU.filter((item) => puedeVerModulo(item.id)).map((item) => {
            const activo = vistaActual === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onCambiarVista(item.id);
                  setSidebarAbierto(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all ${
                  activo
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={activo ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    activo
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.codigoRf}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Tarjeta informativa de Reglas de Negocio Activas */}
        <div className="mx-4 mb-4 rounded-xl border border-slate-800 bg-slate-800/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Control Patrimonial Activo</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Reglas RN-01 a RN-10 supervisadas en tiempo real (integridad de préstamos, baja lógica y RBAC).
          </p>
        </div>

        {/* Usuario autenticado en el pie del sidebar */}
        {usuario && (
          <div className="border-t border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {usuario.nombreCompleto}
                </p>
                <p className="truncate text-xs text-slate-400">{usuario.correo}</p>
              </div>
              <button
                type="button"
                onClick={cerrarSesion}
                title="Cerrar sesión"
                className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-600/20 hover:text-rose-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <StatusBadge status={usuario.rol} />
              <span className="truncate text-[11px] text-slate-400">{usuario.area}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Contenedor derecho */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarAbierto(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                Innovatech Solutions S.A.C. — Trazabilidad Patrimonial y Control de Asignaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Información del usuario autenticado */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {usuario?.nombreCompleto}
              </span>
              {usuario?.rol && <StatusBadge status={usuario.rol} />}
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema visual"
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
