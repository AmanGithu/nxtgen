export type ThemeMode = 'dark' | 'light' | 'light_new' | 'light_green' | 'system';
export type ResolvedTheme = 'dark' | 'light' | 'light_new' | 'light_green';

export interface ThemeOption {
  id: ThemeMode;
  label: string;
  description: string;
  iconName: 'Moon' | 'Sun' | 'Monitor';
}

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}
