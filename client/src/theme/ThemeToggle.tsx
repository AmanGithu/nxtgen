import React from 'react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-full p-2 text-text-muted hover:bg-white/[0.08] hover:text-white transition-all border border-transparent hover:border-white/[0.1] shadow-sm flex items-center justify-center ${className}`}
      title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
      aria-label="Toggle theme mode"
    >
      {theme === 'dark' && <Moon size={18} className="text-indigo-400" />}
      {theme === 'light' && <Sun size={18} className="text-amber-500" />}
      {theme === 'system' && <Monitor size={18} className="text-emerald-400" />}
    </button>
  );
};
