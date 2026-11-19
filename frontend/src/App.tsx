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

function App() {
  const { esAutenticado, puedeOperarInventario } = useAuth();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [vista, setVista] = useState<VistaNavegacion>('dashboard');
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
      {vistaPermitida === 'reportes' && <ReportesPage />}
    </AppLayout>
  );
}

export default App;
