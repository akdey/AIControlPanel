import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const JWT_STORAGE_KEY = 'control_plane_jwt';

// Base Axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Reads JWT token from browser localStorage and appends it to outgoing requests.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Inspects incoming response headers for a refreshed JWT token (x-refreshed-token or authorization).
 * If a new token is present, automatically writes it back to browser localStorage.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 1. Check header for refreshed JWT
    const refreshedToken =
      response.headers['x-refreshed-token'] ||
      response.headers['x-renewed-jwt'] ||
      (response.headers['authorization'] && response.headers['authorization'].replace('Bearer ', ''));

    if (refreshedToken && typeof refreshedToken === 'string') {
      localStorage.setItem(JWT_STORAGE_KEY, refreshedToken);
    }

    // 2. Check response data payload for refreshed token if returned in body
    if (response.data && response.data.refreshedToken) {
      localStorage.setItem(JWT_STORAGE_KEY, response.data.refreshedToken);
    }

    return response;
  },
  (error: AxiosError) => {
    // If 401 Unauthorized, clear stale JWT from browser storage
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(JWT_STORAGE_KEY);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper utilities for managing local storage JWT token
 */
export const tokenService = {
  getToken: (): string | null => localStorage.getItem(JWT_STORAGE_KEY),
  setToken: (token: string): void => localStorage.setItem(JWT_STORAGE_KEY, token),
  removeToken: (): void => localStorage.removeItem(JWT_STORAGE_KEY),
};
