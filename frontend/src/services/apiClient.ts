import type { BackendErrorPayload, UsuarioAuthDto } from '../types';

const STORAGE_TOKEN_KEY = 'techasset_token';
const STORAGE_USER_KEY = 'techasset_usuario';

export class ApiError extends Error {
  public readonly status: number;
  public readonly codigo?: string;
  public readonly errores: string[];

  constructor(mensaje: string, status: number, codigo?: string, errores: string[] = []) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.errores = errores;
  }
}

export function obtenerSesionGuardada(): { token: string | null; usuario: UsuarioAuthDto | null } {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const rawUser = localStorage.getItem(STORAGE_USER_KEY);
    const usuario = rawUser ? (JSON.parse(rawUser) as UsuarioAuthDto) : null;
    return { token, usuario };
  } catch {
    return { token: null, usuario: null };
  }
}

export function guardarSesionLocal(token: string, usuario: UsuarioAuthDto): void {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuario));
}

export function limpiarSesionLocal(): void {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

function construirQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const { token, usuario } = obtenerSesionGuardada();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (usuario) {
    headers.set('X-Usuario-Id', String(usuario.id));
    headers.set('X-Usuario-Rol', usuario.rol);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}${construirQueryString(queryParams)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'No se pudo establecer conexión con el servidor backend (http://127.0.0.1:5080). Verifique que el servicio API esté activo.',
      0,
      'ERR-RED',
    );
  }

  let body: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    const text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { mensaje: text };
      }
    }
  }

  if (!response.ok) {
    const errPayload = (body ?? {}) as BackendErrorPayload;
    const mensajeExtraido =
      errPayload.mensaje ||
      errPayload.message ||
      (Array.isArray(errPayload.errores) && errPayload.errores.length > 0
        ? errPayload.errores.join(' ')
        : `Error en la solicitud HTTP (${response.status})`);

    const mensajeConCodigo =
      errPayload.codigo && !mensajeExtraido.includes(errPayload.codigo)
        ? `[${errPayload.codigo}] ${mensajeExtraido}`
        : mensajeExtraido;

    throw new ApiError(
      mensajeConCodigo,
      response.status,
      errPayload.codigo,
      errPayload.errores ?? [],
    );
  }

  if (body && typeof body === 'object' && 'exito' in body) {
    const typedBody = body as BackendErrorPayload & { datos?: T; data?: T };
    if (typedBody.exito === false) {
      const msg = typedBody.mensaje || typedBody.message || 'Operación rechazada por regla de negocio.';
      throw new ApiError(msg, response.status, typedBody.codigo, typedBody.errores ?? []);
    }
    if ('datos' in typedBody && typedBody.datos !== undefined) {
      return typedBody.datos;
    }
    if ('data' in typedBody && typedBody.data !== undefined) {
      return typedBody.data;
    }
  }

  return body as T;
}

export const apiClient = {
  get: <T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> => request<T>(endpoint, { method: 'GET' }, queryParams),

  post: <T>(endpoint: string, data?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> => request<T>(endpoint, { method: 'DELETE' }, queryParams),
};
