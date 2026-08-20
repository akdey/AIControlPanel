import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const JWT_STORAGE_KEY = 'control_plane_jwt';

// Base Axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Reads JWT token from browser localStorage and attaches it as x-access-token header.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);

    if (token && config.headers) {
      config.headers['x-access-token'] = token;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * - Captures refreshed JWT from x-access-token response header.
 * - On 401 Unauthorized, clears stale JWT and triggers auth store logout.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check header for refreshed JWT
    const refreshedToken = response.headers['x-access-token'];

    if (refreshedToken && typeof refreshedToken === 'string') {
      localStorage.setItem(JWT_STORAGE_KEY, refreshedToken);
    }

    // Check response data payload for refreshed token if returned in body
    if (response.data && response.data.refreshedToken) {
      localStorage.setItem(JWT_STORAGE_KEY, response.data.refreshedToken);
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(JWT_STORAGE_KEY);
      // Dynamically import auth store to avoid circular dependency
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().handleUnauthorized(
          'You have been logged out due to inactivity or session expiry. Please sign in again.'
        );
      });
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
