import { config } from '../utils/config';
import { secureStorage } from '../utils/storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { accessToken } = await secureStorage.getTokens();
    if (accessToken) {
      return { Authorization: `Bearer ${accessToken}` };
    }
    return {};
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`/api/v1${path}`, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const authHeaders = await this.getAuthHeaders();
    const url = this.buildUrl(path, options.params);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    let response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      await this.refreshToken();
      const newAuthHeaders = await this.getAuthHeaders();
      fetchOptions.headers = {
        ...fetchOptions.headers,
        ...newAuthHeaders,
      };
      response = await fetch(url, fetchOptions);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status,
        data.error?.details,
      );
    }

    return data.data as T;
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const { refreshToken } = await secureStorage.getTokens();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await fetch(this.buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) throw new Error('Refresh failed');

        const data = await response.json();
        await secureStorage.setTokens(data.data.accessToken, data.data.refreshToken);
      } catch {
        await secureStorage.clearTokens();
        throw new Error('Session expired');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  delete<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>('DELETE', path, { params });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
