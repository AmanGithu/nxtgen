export type ThemeMode = 'dark' | 'light' | 'light_new' | 'light_green' | 'bobbin' | 'mainline' | 'supaste' | 'teoro' | 'rebuld' | 'system';
export type ResolvedTheme = 'dark' | 'light' | 'light_new' | 'light_green' | 'bobbin' | 'mainline' | 'supaste' | 'teoro' | 'rebuld';

export interface ThemeOption {
  id: ThemeMode;
  label: string;
  description: string;
  iconName: 'Moon' | 'Sun' | 'Monitor' | 'Sparkles' | 'Layers' | 'Palette';
}

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}
