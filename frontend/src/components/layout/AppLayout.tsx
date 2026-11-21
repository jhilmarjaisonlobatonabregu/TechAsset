import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  FileSpreadsheet,
  Laptop,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { VistaNavegacion } from '../../types';
import { Button, StatusBadge } from '../ui';

export interface AppLayoutProps {
  vistaActual: VistaNavegacion;
  onCambiarVista: (vista: VistaNavegacion, accionInicial?: string) => void;
  children: React.ReactNode;
}

interface ItemMenu {
  id: VistaNavegacion;
  label: string;
  icon: React.ReactNode;
}

const ITEMS_MENU: readonly ItemMenu[] = [
  {
    id: 'dashboard',
    label: 'Dashboard General',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: 'equipos',
    label: 'Inventario de Equipos',
    icon: <Laptop className="h-5 w-5" />,
  },
  {
    id: 'prestamos',
    label: 'Préstamos y Devoluciones',
    icon: <ArrowLeftRight className="h-5 w-5" />,
  },
  {
    id: 'usuarios',
    label: 'Usuarios y Accesos',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'reportes',
    label: 'Reportes y Movimientos',
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  vistaActual,
  onCambiarVista,
  children,
}) => {
  const { usuario, puedeAccederVista, cerrarSesion } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const esColaborador = usuario?.rol === 'Colaborador';

  const obtenerEtiquetaModulo = (item: ItemMenu): string => {
    if (!esColaborador) return item.label;
    if (item.id === 'equipos') return 'Disponibilidad de equipos';
    if (item.id === 'prestamos') return 'Mis préstamos';
    return item.label;
  };

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
        className={`no-print fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-transform duration-200 lg:sticky lg:top-0 lg:self-start lg:translate-x-0 dark:border-slate-800 ${
          sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/30">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-white">TechAsset</span>
              <p className="text-[13px] font-medium text-slate-400">Innovatech Solutions S.A.C.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarAbierto(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 lg:hidden"
            aria-label="Cerrar menú lateral"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-5 pb-2">
          <p className="px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Módulos del Sistema
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2" aria-label="Navegación principal">
          {ITEMS_MENU.filter((item) => puedeAccederVista(item.id)).map((item) => {
            const activo = vistaActual === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onCambiarVista(item.id);
                  setSidebarAbierto(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                  activo
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className={`shrink-0 ${activo ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{obtenerEtiquetaModulo(item)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Contenedor derecho */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarAbierto(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos
              </h1>
              <p className="hidden text-sm text-slate-600 sm:block dark:text-slate-400">
                Innovatech Solutions S.A.C.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Información del usuario autenticado */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {usuario?.nombreCompleto}
              </span>
              {usuario?.rol && <StatusBadge status={usuario.rol} />}
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cerrarSesion}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
              className="h-9 gap-0 px-2.5 text-sm duration-150 hover:border-rose-300! hover:bg-rose-50! hover:text-rose-700! focus-visible:border-rose-300! focus-visible:bg-rose-50! focus-visible:text-rose-700! focus-visible:outline-rose-600! sm:gap-1.5 sm:px-3.5 dark:hover:border-rose-800/80! dark:hover:bg-rose-950/60! dark:hover:text-rose-300! dark:focus-visible:border-rose-800/80! dark:focus-visible:bg-rose-950/60! dark:focus-visible:text-rose-300!"
            >
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
