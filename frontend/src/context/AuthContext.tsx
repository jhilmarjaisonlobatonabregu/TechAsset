import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  guardarSesionLocal,
  limpiarSesionLocal,
  obtenerSesionGuardada,
  registrarManejadorSesionVencida,
} from '../services/apiClient';
import { authService } from '../services/authService';
import type { RolUsuario, UsuarioAuthDto, VistaNavegacion } from '../types';

export function obtenerVistaInicialPorRol(rol?: RolUsuario | null): VistaNavegacion {
  return rol === 'Administrador' ? 'dashboard' : 'prestamos';
}

export function esVistaPermitidaPorRol(rol: RolUsuario | null | undefined, vista: VistaNavegacion): boolean {
  if (rol === 'Administrador') return true;
  return vista === 'equipos' || vista === 'prestamos';
}

export interface AuthContextValue {
  usuario: UsuarioAuthDto | null;
  token: string | null;
  esAutenticado: boolean;
  esAdmin: boolean;
  esResponsableTI: boolean;
  puedeOperarInventario: boolean;
  vistaInicial: VistaNavegacion;
  puedeAccederVista: (vista: VistaNavegacion) => boolean;
  avisoSesion: string | null;
  iniciarSesion: (correo: string, password: string) => Promise<UsuarioAuthDto>;
  cerrarSesion: () => void;
  limpiarAvisoSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sesionInicial = obtenerSesionGuardada();
  const [usuario, setUsuario] = useState<UsuarioAuthDto | null>(sesionInicial.usuario);
  const [token, setToken] = useState<string | null>(sesionInicial.token);
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);

  useEffect(() => {
    registrarManejadorSesionVencida(() => {
      limpiarSesionLocal();
      setToken(null);
      setUsuario(null);
      setAvisoSesion('Su sesión venció. Inicie sesión de nuevo.');
    });
    return () => registrarManejadorSesionVencida(null);
  }, []);

  const limpiarAvisoSesion = useCallback(() => {
    setAvisoSesion(null);
  }, []);

  const iniciarSesion = useCallback(
    async (correo: string, password: string): Promise<UsuarioAuthDto> => {
      const respuesta = await authService.login(correo, password);
      guardarSesionLocal(respuesta.token, respuesta.usuario);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
      setAvisoSesion(null);
      return respuesta.usuario;
    },
    [],
  );

  const cerrarSesion = useCallback(() => {
    limpiarSesionLocal();
    setToken(null);
    setUsuario(null);
    setAvisoSesion(null);
  }, []);

  const esAdmin = usuario?.rol === 'Administrador';
  const esResponsableTI = usuario?.rol === 'Responsable de Tecnología';
  const puedeOperarInventario = esAdmin || esResponsableTI;
  const vistaInicial = obtenerVistaInicialPorRol(usuario?.rol);
  const puedeAccederVista = useCallback(
    (vista: VistaNavegacion) => esVistaPermitidaPorRol(usuario?.rol, vista),
    [usuario?.rol],
  );

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        esAutenticado: Boolean(usuario && token),
        esAdmin,
        esResponsableTI,
        puedeOperarInventario,
        vistaInicial,
        puedeAccederVista,
        avisoSesion,
        iniciarSesion,
        cerrarSesion,
        limpiarAvisoSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return ctx;
}
