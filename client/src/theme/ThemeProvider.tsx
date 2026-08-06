import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ThemeMode, ResolvedTheme, ThemeContextType } from './types';
import { THEME_STORAGE_KEY, THEME_VARIABLES } from './theme.config';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light' || saved === 'light_new' || saved === 'light_green' || saved === 'system') {
      return saved;
    }
    const oldSaved = localStorage.getItem('theme') as ThemeMode | null;
    if (oldSaved === 'dark' || oldSaved === 'light' || oldSaved === 'light_new' || oldSaved === 'light_green') {
      return oldSaved;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  };

  const applyTheme = useCallback((activeTheme: ThemeMode) => {
    const resolved: ResolvedTheme = activeTheme === 'system' ? getSystemTheme() : activeTheme;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', activeTheme);

    root.classList.remove('dark', 'light', 'light_new', 'light_green');
    root.classList.add(resolved);

    const vars = THEME_VARIABLES[resolved];
    if (vars) {
      Object.entries(vars).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme, applyTheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'light_new';
      if (prev === 'light_new') return 'light_green';
      if (prev === 'light_green') return 'system';
      return 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider from client/src/theme');
  }
  return context;
};
