import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { EquiposPage } from './pages/EquiposPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PrestamosPage } from './pages/PrestamosPage';
import { ReportesPage } from './pages/ReportesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import type { VistaNavegacion } from './types';

const SESSION_VISTA_KEY = 'techasset_vista_activa';
const VISTAS_VALIDAS: readonly VistaNavegacion[] = ['dashboard', 'equipos', 'prestamos', 'usuarios', 'reportes'];

function obtenerVistaGuardada(): VistaNavegacion {
  try {
    const guardada = sessionStorage.getItem(SESSION_VISTA_KEY);
    if (guardada && (VISTAS_VALIDAS as readonly string[]).includes(guardada)) {
      return guardada as VistaNavegacion;
    }
  } catch {
    // Ignorar fallo de sessionStorage en contextos restringidos
  }
  return 'dashboard';
}

function App() {
  const { esAutenticado, puedeOperarInventario } = useAuth();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [vista, setVista] = useState<VistaNavegacion>(obtenerVistaGuardada);
  const [accionInicial, setAccionInicial] = useState<string | undefined>(undefined);

  if (!esAutenticado) {
    if (!mostrarLogin) {
      return <LandingPage onIniciarSesion={() => setMostrarLogin(true)} />;
    }
    return <LoginPage onVolverLanding={() => setMostrarLogin(false)} />;
  }

  const cambiarVista = (nueva: VistaNavegacion, accion?: string) => {
    setAccionInicial(accion);
    setVista(nueva);
    try {
      sessionStorage.setItem(SESSION_VISTA_KEY, nueva);
    } catch {
      // Ignorar fallo de sessionStorage
    }
  };

  // Rutas protegidas por rol: el Colaborador no accede a usuarios ni reportes
  const vistaPermitida: VistaNavegacion =
    !puedeOperarInventario && (vista === 'usuarios' || vista === 'reportes') ? 'dashboard' : vista;

  return (
    <AppLayout vistaActual={vistaPermitida} onCambiarVista={cambiarVista}>
      {vistaPermitida === 'dashboard' && <DashboardPage onNavegar={cambiarVista} />}
      {vistaPermitida === 'equipos' && <EquiposPage key={`eq-${accionInicial ?? ''}`} accionInicial={accionInicial} />}
      {vistaPermitida === 'prestamos' && <PrestamosPage key={`pr-${accionInicial ?? ''}`} accionInicial={accionInicial} />}
      {vistaPermitida === 'usuarios' && <UsuariosPage key={`us-${accionInicial ?? ''}`} accionInicial={accionInicial} />}
      {vistaPermitida === 'reportes' && <ReportesPage key={`rp-${accionInicial ?? ''}`} accionInicial={accionInicial} />}
    </AppLayout>
  );
}

export default App;
