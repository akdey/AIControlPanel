export type ThemeMode = 'dark' | 'light' | 'midnight';

export interface ThemeTokens {
  name: string;
  colors: {
    bgApp: string;
    bgSurface: string;
    bgCard: string;
    bgCardHover: string;
    borderCard: string;
    borderSubtle: string;
    textMain: string;
    textMuted: string;
    textSubtle: string;
    accentPrimary: string;
    accentHover: string;
    accentSubtle: string;
    badgeSuccessBg: string;
    badgeSuccessText: string;
    badgeSuccessBorder: string;
    badgeWarningBg: string;
    badgeWarningText: string;
    badgeWarningBorder: string;
    badgeDangerBg: string;
    badgeDangerText: string;
    badgeDangerBorder: string;
  };
  typography: {
    fontFamily: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const THEMES: Record<ThemeMode, ThemeTokens> = {
  dark: {
    name: 'Dark Enterprise',
    colors: {
      bgApp: '#09090b',
      bgSurface: '#121215',
      bgCard: '#18181b',
      bgCardHover: '#222226',
      borderCard: '#27272a',
      borderSubtle: '#1f1f23',
      textMain: '#f4f4f5',
      textMuted: '#a1a1aa',
      textSubtle: '#71717a',
      accentPrimary: '#3b82f6',
      accentHover: '#2563eb',
      accentSubtle: 'rgba(59, 130, 246, 0.12)',
      badgeSuccessBg: 'rgba(16, 185, 129, 0.12)',
      badgeSuccessText: '#10b981',
      badgeSuccessBorder: 'rgba(16, 185, 129, 0.25)',
      badgeWarningBg: 'rgba(245, 158, 11, 0.12)',
      badgeWarningText: '#f59e0b',
      badgeWarningBorder: 'rgba(245, 158, 11, 0.25)',
      badgeDangerBg: 'rgba(239, 68, 68, 0.12)',
      badgeDangerText: '#ef4444',
      badgeDangerBorder: 'rgba(239, 68, 68, 0.25)',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '12px',
    },
  },
  light: {
    name: 'Light Clean',
    colors: {
      bgApp: '#f8fafc',
      bgSurface: '#f1f5f9',
      bgCard: '#ffffff',
      bgCardHover: '#f8fafc',
      borderCard: '#e2e8f0',
      borderSubtle: '#cbd5e1',
      textMain: '#0f172a',
      textMuted: '#475569',
      textSubtle: '#64748b',
      accentPrimary: '#2563eb',
      accentHover: '#1d4ed8',
      accentSubtle: 'rgba(37, 99, 235, 0.08)',
      badgeSuccessBg: '#ecfdf5',
      badgeSuccessText: '#059669',
      badgeSuccessBorder: '#a7f3d0',
      badgeWarningBg: '#fffbeb',
      badgeWarningText: '#d97706',
      badgeWarningBorder: '#fde68a',
      badgeDangerBg: '#fef2f2',
      badgeDangerText: '#dc2626',
      badgeDangerBorder: '#fca5a5',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '12px',
    },
  },
  midnight: {
    name: 'Midnight OLED',
    colors: {
      bgApp: '#000000',
      bgSurface: '#09090b',
      bgCard: '#121215',
      bgCardHover: '#1c1c20',
      borderCard: '#27272a',
      borderSubtle: '#1f1f2a',
      textMain: '#f4f4f5',
      textMuted: '#a1a1aa',
      textSubtle: '#71717a',
      accentPrimary: '#3b82f6',
      accentHover: '#2563eb',
      accentSubtle: 'rgba(59, 130, 246, 0.2)',
      badgeSuccessBg: 'rgba(16, 185, 129, 0.15)',
      badgeSuccessText: '#10b981',
      badgeSuccessBorder: 'rgba(16, 185, 129, 0.3)',
      badgeWarningBg: 'rgba(245, 158, 11, 0.15)',
      badgeWarningText: '#f59e0b',
      badgeWarningBorder: 'rgba(245, 158, 11, 0.3)',
      badgeDangerBg: 'rgba(239, 68, 68, 0.15)',
      badgeDangerText: '#ef4444',
      badgeDangerBorder: 'rgba(239, 68, 68, 0.3)',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '12px',
    },
  },
};
