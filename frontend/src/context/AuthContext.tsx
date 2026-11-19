import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  guardarSesionLocal,
  limpiarSesionLocal,
  obtenerSesionGuardada,
} from '../services/apiClient';
import { authService } from '../services/authService';
import type { UsuarioAuthDto } from '../types';

export interface AuthContextValue {
  usuario: UsuarioAuthDto | null;
  token: string | null;
  esAutenticado: boolean;
  esAdmin: boolean;
  esResponsableTI: boolean;
  puedeOperarInventario: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<UsuarioAuthDto>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sesionInicial = obtenerSesionGuardada();
  const [usuario, setUsuario] = useState<UsuarioAuthDto | null>(sesionInicial.usuario);
  const [token, setToken] = useState<string | null>(sesionInicial.token);

  const iniciarSesion = useCallback(
    async (correo: string, password: string): Promise<UsuarioAuthDto> => {
      const respuesta = await authService.login(correo, password);
      guardarSesionLocal(respuesta.token, respuesta.usuario);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
      return respuesta.usuario;
    },
    [],
  );

  const cerrarSesion = useCallback(() => {
    limpiarSesionLocal();
    setToken(null);
    setUsuario(null);
  }, []);

  const esAdmin = usuario?.rol === 'Administrador';
  const esResponsableTI = usuario?.rol === 'Responsable de Tecnología';
  const puedeOperarInventario = esAdmin || esResponsableTI;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        esAutenticado: Boolean(usuario && token),
        esAdmin,
        esResponsableTI,
        puedeOperarInventario,
        iniciarSesion,
        cerrarSesion,
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
