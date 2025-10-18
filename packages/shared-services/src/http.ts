/**
 * HTTP client for API requests
 * Platform-agnostic HTTP utilities
 */

import { PlatformServices } from './platform';
import { API_CONFIG } from '@ectracc/shared-core';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  requiresAuth?: boolean;
}

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || PlatformServices.getConfig().apiBaseUrl;
  }

  private async getHeaders(requiresAuth: boolean = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      try {
        const token = await PlatformServices.getAuth().getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = API_CONFIG.TIMEOUT,
      requiresAuth = false,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders(requiresAuth);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...customHeaders,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Handle API response format with success flag
      if ('success' in data && data.success === false) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      // Return data directly if it has a data property, otherwise return the whole response
      return ('data' in data ? data.data : data) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton instance
export const httpClient = new HttpClient();

