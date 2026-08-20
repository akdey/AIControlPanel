import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, tokenService } from '../api/apiClient';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  is_pwd_change_req: boolean;
  is_2fa_req: boolean;
  is_2fa_enabled: boolean;
  privacy_accepted: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authenticated' | '2fa_required' | 'pwd_change_required' | 'error';
  errorMessage: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  rehydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: 'idle',
      errorMessage: null,

      login: async (username: string, password: string) => {
        set({ status: 'loading', errorMessage: null });
        try {
          const res = await apiClient.post('/auth/authenticate', { username, password });
          const data = res.data;

          if (data.status === 'authenticated' || data.status === 'pwd_change_required') {
            const jwt = data.token || res.headers['x-access-token'];
            if (jwt) {
              tokenService.setToken(jwt);
            }
            set({
              user: data.user,
              token: jwt,
              status: data.status === 'pwd_change_required' ? 'pwd_change_required' : 'authenticated',
              errorMessage: null,
            });
          } else if (data.status === '2fa_required') {
            const jwt = data.token || res.headers['x-access-token'];
            if (jwt) tokenService.setToken(jwt);
            set({
              user: data.user,
              token: jwt,
              status: '2fa_required',
              errorMessage: null,
            });
          } else {
            set({ status: 'error', errorMessage: data.detail || 'Authentication failed.' });
          }
        } catch (err: any) {
          const detail =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Connection refused. Control Plane API unreachable.';
          set({ status: 'error', errorMessage: detail, user: null, token: null });
          tokenService.removeToken();
        }
      },

      logout: () => {
        tokenService.removeToken();
        set({ user: null, token: null, status: 'idle', errorMessage: null });
      },

      rehydrate: () => {
        const token = tokenService.getToken();
        if (!token) {
          set({ status: 'idle', user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        status: state.status === 'authenticated' ? 'authenticated' : 'idle',
      }),
    }
  )
);
