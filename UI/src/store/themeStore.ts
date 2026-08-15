import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'midnight';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
