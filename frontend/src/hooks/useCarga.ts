import { useCallback, useEffect, useRef, useState } from 'react';
import { mensajeErrorCarga } from '../utils/errores';

export interface UseCargaResult<T> {
  datos: T;
  cargando: boolean;
  cargado: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook de lectura reutilizable: ejecuta `cargador` al montar y cuando cambian `dependencias`,
 * expone estados de carga/error (estados de carga, vacío y error en todas las pantallas).
 */
export function useCarga<T>(cargador: () => Promise<T>, valorInicial: T, dependencias: readonly unknown[]): UseCargaResult<T> {
  const [datos, setDatos] = useState<T>(valorInicial);
  const [cargando, setCargando] = useState(true);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargadorRef = useRef(cargador);
  cargadorRef.current = cargador;
  const solicitudRef = useRef(0);

  const recargar = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    setCargando(true);
    setError(null);
    try {
      const resultado = await cargadorRef.current();
      if (solicitud === solicitudRef.current) {
        setDatos(resultado);
        setCargado(true);
      }
    } catch (err: unknown) {
      if (solicitud === solicitudRef.current) {
        setCargado(false);
        setError(mensajeErrorCarga(err));
      }
    } finally {
      if (solicitud === solicitudRef.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recargar, ...dependencias]);

  return { datos, cargando, cargado, error, recargar };
}
