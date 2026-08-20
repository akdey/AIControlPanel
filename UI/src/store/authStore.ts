import { create } from 'zustand';
import { apiClient, tokenService } from '../api/apiClient';

export interface AuthUser {
  id?: string;
  username: string;
  role: string;
  is_pwd_change_req?: boolean;
  is_2fa_req?: boolean;
  is_2fa_enabled?: boolean;
  privacy_accepted?: string;
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

/**
 * Decodes claims directly from JWT token payload in pure JavaScript without external dependencies.
 */
function parseJwtClaims(token: string): AuthUser | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);

    // Check expiration if present
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null;
    }

    return {
      username: parsed.username || parsed.sub || '',
      role: parsed.role || 'developer',
      id: parsed.user_id,
      is_pwd_change_req: parsed.is_pwd_change_req,
    };
  } catch {
    return null;
  }
}

// Clean up any legacy redundant auth-storage key from browser localStorage
try {
  localStorage.removeItem('auth-storage');
} catch {}

export const useAuthStore = create<AuthState>()((set) => ({
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
          user: data.user || (jwt ? parseJwtClaims(jwt) : null),
          token: jwt,
          status: data.status === 'pwd_change_required' ? 'pwd_change_required' : 'authenticated',
          errorMessage: null,
        });
      } else if (data.status === '2fa_required') {
        const jwt = data.token || res.headers['x-access-token'];
        if (jwt) tokenService.setToken(jwt);
        set({
          user: data.user || (jwt ? parseJwtClaims(jwt) : null),
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
      return;
    }

    const claims = parseJwtClaims(token);
    if (!claims) {
      // Stale or expired token
      tokenService.removeToken();
      set({ status: 'idle', user: null, token: null });
      return;
    }

    set({
      user: claims,
      token,
      status: claims.is_pwd_change_req ? 'pwd_change_required' : 'authenticated',
    });
  },
}));
