import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  /** True while we're still mirroring the OS because nobody has chosen yet. */
  isSystem: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const STORAGE_KEY = 'theme';

/* NxtGen has always shipped dark, and the brand mockups are dark, so a visitor
   who has never touched the toggle keeps seeing dark regardless of their OS.
   Flip this to true to respect `prefers-color-scheme` for first-time visitors
   instead — the machinery below is already wired for it. */
const FOLLOW_SYSTEM = false;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme is published as `data-theme` on <html>, which re-values the custom
 * properties in index.css. It is deliberately NOT a `dark:` class strategy —
 * the UI is token-driven, so one attribute swaps every colour at once and no
 * component needs a per-theme variant.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // The inline boot script in index.html already resolved and stamped the
    // theme before first paint. Read that back instead of recomputing, so
    // React's first render can never disagree with what's on screen.
    const stamped = document.documentElement.getAttribute('data-theme');
    return stamped === 'light' ? 'light' : 'dark';
  });

  const [isSystem, setIsSystem] = useState(() => FOLLOW_SYSTEM && !localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* Track the OS only until the visitor picks a side. Once they have, their
     choice outranks the system — otherwise a laptop flipping to night mode at
     sunset would silently override someone who deliberately chose light. */
  useEffect(() => {
    if (!isSystem) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => setThemeState(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [isSystem]);

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setIsSystem(false);
    setThemeState(next);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isSystem, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
