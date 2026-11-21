import { useEffect, useRef, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { esVistaPermitidaPorRol, obtenerVistaInicialPorRol, useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { EquiposPage } from './pages/EquiposPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PrestamosPage } from './pages/PrestamosPage';
import { RecuperarContrasenaPage } from './pages/RecuperarContrasenaPage';
import { ReportesPage } from './pages/ReportesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import type { RolUsuario, VistaNavegacion } from './types';

const SESSION_VISTA_KEY = 'techasset_vista_activa';
const VISTAS_VALIDAS: readonly VistaNavegacion[] = ['dashboard', 'equipos', 'prestamos', 'usuarios', 'reportes'];

function esVistaValida(valor: string | null | undefined): valor is VistaNavegacion {
  return Boolean(valor && (VISTAS_VALIDAS as readonly string[]).includes(valor));
}

function extraerVistaDeUrl(): VistaNavegacion | null {
  try {
    const segmentoRuta = window.location.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/')[0]
      ?.toLowerCase();
    if (esVistaValida(segmentoRuta)) return segmentoRuta;

    const hashLimpio = window.location.hash.replace(/^#\/?/, '').split('/')[0]?.toLowerCase();
    if (esVistaValida(hashLimpio)) return hashLimpio;

    const vistaQuery = new URLSearchParams(window.location.search).get('vista')?.toLowerCase();
    if (esVistaValida(vistaQuery)) return vistaQuery;
  } catch {
    // Ignorar error al leer window.location
  }
  return null;
}

function guardarVistaEnSesion(vista: VistaNavegacion): void {
  try {
    sessionStorage.setItem(SESSION_VISTA_KEY, vista);
  } catch {
    // Ignorar fallo de sessionStorage en contextos restringidos
  }
}

function limpiarVistaEnSesion(): void {
  try {
    sessionStorage.removeItem(SESSION_VISTA_KEY);
  } catch {
    // Ignorar fallo de sessionStorage en contextos restringidos
  }
}

function normalizarUrlRaiz(): void {
  try {
    if (window.location.pathname !== '/' || window.location.hash !== '' || window.location.search !== '') {
      window.history.replaceState(null, '', '/');
    }
  } catch {
    // Ignorar error de History API
  }
}

function obtenerVistaInicial(rol?: RolUsuario | null): VistaNavegacion {
  const vistaUrl = extraerVistaDeUrl();
  if (vistaUrl) {
    return esVistaPermitidaPorRol(rol, vistaUrl) ? vistaUrl : obtenerVistaInicialPorRol(rol);
  }
  try {
    const guardada = sessionStorage.getItem(SESSION_VISTA_KEY);
    if (esVistaValida(guardada)) {
      return esVistaPermitidaPorRol(rol, guardada) ? guardada : obtenerVistaInicialPorRol(rol);
    }
  } catch {
    // Ignorar fallo de sessionStorage en contextos restringidos
  }
  return obtenerVistaInicialPorRol(rol);
}

function App() {
  const { esAutenticado, usuario, vistaInicial, puedeAccederVista, avisoSesion, limpiarAvisoSesion } = useAuth();
  const [pantallaPublica, setPantallaPublica] = useState<'landing' | 'login' | 'recuperar'>('landing');
  const [vistaEstado, setVistaEstado] = useState<{ usuarioId: string | null; vista: VistaNavegacion }>(() => ({
    usuarioId: usuario?.id ?? null,
    vista: obtenerVistaInicial(usuario?.rol),
  }));
  const [accionInicial, setAccionInicial] = useState<string | undefined>(undefined);
  const usuarioPrevioRef = useRef<string | null>(usuario?.id ?? null);

  const vistaBase: VistaNavegacion =
    esAutenticado && usuario
      ? vistaEstado.usuarioId === usuario.id
        ? vistaEstado.vista
        : vistaInicial
      : vistaInicial;
  const vistaPermitida: VistaNavegacion = puedeAccederVista(vistaBase) ? vistaBase : vistaInicial;

  useEffect(() => {
    const usuarioPrevio = usuarioPrevioRef.current;
    const usuarioActualId = esAutenticado && usuario ? usuario.id : null;
    usuarioPrevioRef.current = usuarioActualId;

    if (!usuarioActualId) {
      if (usuarioPrevio !== null) {
        limpiarVistaEnSesion();
        setAccionInicial(undefined);
        setVistaEstado({ usuarioId: null, vista: 'prestamos' });
        normalizarUrlRaiz();
      }
      return;
    }

    if (usuarioPrevio !== usuarioActualId) {
      setAccionInicial(undefined);
    }

    const vistaUrl = extraerVistaDeUrl();
    const vistaResuelta: VistaNavegacion =
      vistaUrl !== null
        ? puedeAccederVista(vistaUrl)
          ? vistaUrl
          : vistaInicial
        : vistaPermitida;

    if (vistaEstado.usuarioId !== usuarioActualId || vistaEstado.vista !== vistaResuelta) {
      setVistaEstado({ usuarioId: usuarioActualId, vista: vistaResuelta });
    }
    guardarVistaEnSesion(vistaResuelta);
    normalizarUrlRaiz();
  }, [esAutenticado, usuario, vistaInicial, puedeAccederVista, vistaPermitida, vistaEstado.usuarioId, vistaEstado.vista]);

  useEffect(() => {
    if (!esAutenticado || !usuario) return;

    const manejarNavegacionUrl = () => {
      const vistaUrl = extraerVistaDeUrl();
      if (!vistaUrl) return;
      const destino = puedeAccederVista(vistaUrl) ? vistaUrl : vistaInicial;
      setAccionInicial(undefined);
      setVistaEstado({ usuarioId: usuario.id, vista: destino });
      guardarVistaEnSesion(destino);
      normalizarUrlRaiz();
    };

    window.addEventListener('popstate', manejarNavegacionUrl);
    window.addEventListener('hashchange', manejarNavegacionUrl);
    return () => {
      window.removeEventListener('popstate', manejarNavegacionUrl);
      window.removeEventListener('hashchange', manejarNavegacionUrl);
    };
  }, [esAutenticado, usuario, puedeAccederVista, vistaInicial]);

  if (!esAutenticado || !usuario) {
    if (avisoSesion) {
      return (
        <LoginPage
          mensajeSesion={avisoSesion}
          onVolverLanding={() => {
            limpiarAvisoSesion();
            setPantallaPublica('landing');
          }}
          onRecuperarContrasena={() => {
            limpiarAvisoSesion();
            setPantallaPublica('recuperar');
          }}
        />
      );
    }
    if (pantallaPublica === 'landing') {
      return <LandingPage onIniciarSesion={() => setPantallaPublica('login')} />;
    }
    if (pantallaPublica === 'recuperar') {
      return <RecuperarContrasenaPage onVolverLogin={() => setPantallaPublica('login')} />;
    }
    return (
      <LoginPage
        mensajeSesion={avisoSesion}
        onVolverLanding={() => setPantallaPublica('landing')}
        onRecuperarContrasena={() => setPantallaPublica('recuperar')}
      />
    );
  }

  const cambiarVista = (nueva: VistaNavegacion, accion?: string) => {
    const permitida = puedeAccederVista(nueva);
    const destino = permitida ? nueva : vistaInicial;
    setAccionInicial(permitida ? accion : undefined);
    setVistaEstado({ usuarioId: usuario.id, vista: destino });
    guardarVistaEnSesion(destino);
    normalizarUrlRaiz();
  };

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
