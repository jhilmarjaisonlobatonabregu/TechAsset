import { useCallback, useState } from 'react';
import { ApiError } from '../services/apiClient';

export interface UseApiResult<TData, TArgs extends unknown[]> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  codigoRegla: string | null;
  execute: (...args: TArgs) => Promise<TData | null>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<TData | null>>;
}

export function useApi<TData, TArgs extends unknown[] = []>(
  apiFunc: (...args: TArgs) => Promise<TData>,
  initialData: TData | null = null,
): UseApiResult<TData, TArgs> {
  const [data, setData] = useState<TData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoRegla, setCodigoRegla] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TData | null> => {
      setLoading(true);
      setError(null);
      setCodigoRegla(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        return result;
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.message);
          setCodigoRegla(err.codigo ?? null);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Ocurrió un error inesperado al procesar la solicitud.');
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc],
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setCodigoRegla(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    codigoRegla,
    execute,
    reset,
    setData,
  };
}
