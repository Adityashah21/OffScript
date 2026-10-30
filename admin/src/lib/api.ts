import type { ApiErrorResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  statusCode: number;
  details?: { field?: string; message: string; code?: string }[];

  constructor(message: string, statusCode: number, details?: { field?: string; message: string; code?: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// In-memory token fallback
let memoryToken: string | null = null;

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return memoryToken;
  try {
    return sessionStorage.getItem('offscript_admin_token') || memoryToken;
  } catch {
    return memoryToken;
  }
};

export const setToken = (token: string | null): void => {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem('offscript_admin_token', token);
      } else {
        sessionStorage.removeItem('offscript_admin_token');
      }
    } catch {
      // storage disabled
    }
  }
};

export const clearToken = (): void => {
  setToken(null);
};

// Event listener for auth unauthorized
type UnauthorizedListener = () => void;
const unauthorizedListeners: Set<UnauthorizedListener> = new Set();

export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

function notifyUnauthorized() {
  clearToken();
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener error
    }
  });
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeoutMs = 30000, headers: customHeaders, ...fetchOptions } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getToken();
  const headers = new Headers(customHeaders);

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON or text
    const contentType = response.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (response.status === 401) {
      const isLoginRequest = url.includes('/login');
      if (!isLoginRequest) {
        notifyUnauthorized();
      }
      const errorData = data as ApiErrorResponse;
      const errorMessage =
        (typeof errorData === 'object' && (errorData?.message || errorData?.error)) ||
        (isLoginRequest ? 'Invalid email or password' : 'Session expired or unauthorized. Please log in again.');
      throw new ApiError(errorMessage, 401);
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      const errorMessage =
        (typeof errorData === 'object' && (errorData?.error || errorData?.message)) ||
        `Request failed with status ${response.status}`;
      const details = typeof errorData === 'object' ? errorData?.details : undefined;
      throw new ApiError(errorMessage, response.status, details);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. The server might be starting up (Render spins down free instances). Please retry in a few seconds.', 408);
    }

    // Network error (offline or server sleeping)
    const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
    if (isNetworkError) {
      throw new ApiError('Unable to connect to server. If the server was sleeping, it may take ~30 seconds to wake up.', 503);
    }

    throw new ApiError(err.message || 'An unexpected error occurred', 500);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),
};
