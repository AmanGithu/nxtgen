import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import type { ThemeMode } from './types';
import { THEME_OPTIONS } from './theme.config';
import { Moon, Sun, Monitor, ChevronDown, Check, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  variant?: 'pill' | 'dropdown' | 'segmented';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'dropdown', className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'dark':
        return <Moon size={16} className="text-indigo-400" />;
      case 'light':
        return <Sun size={16} className="text-amber-500" />;
      case 'light_new':
        return <Sun size={16} className="text-teal-400" />;
      case 'light_green':
        return <Sparkles size={16} className="text-lime-500" />;
      case 'system':
        return <Monitor size={16} className="text-emerald-400" />;
    }
  };

  if (variant === 'segmented') {
    return (
      <div className={`flex items-center p-1 rounded-xl bg-bg-surface border border-white/[0.08] ${className}`}>
        {THEME_OPTIONS.map((opt) => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-orange text-white shadow-md font-bold scale-[1.02]'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
              }`}
              title={opt.description}
            >
              {getIcon(opt.id)}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-1 bg-bg-surface p-1 rounded-full border border-white/[0.08] ${className}`}>
        {THEME_OPTIONS.map((opt) => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`p-2 rounded-full transition-all ${
                isActive
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
              }`}
              title={`${opt.label}: ${opt.description}`}
            >
              {getIcon(opt.id)}
            </button>
          );
        })}
      </div>
    );
  }

  const currentOption = THEME_OPTIONS.find((o) => o.id === theme) || THEME_OPTIONS[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-bg-surface px-3 py-2 text-xs font-semibold text-white hover:border-brand-orange transition-all shadow-md"
        title="Change interface theme mode"
      >
        {getIcon(theme)}
        <span className="capitalize font-medium">{currentOption.label} Theme</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.1] bg-bg-surface p-2 shadow-2xl backdrop-blur-xl z-50 animate-fade-in-up">
          <div className="px-3 py-1.5 border-b border-white/[0.08] mb-1">
            <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">Select Theme</span>
            <p className="text-[10px] text-text-muted">Active: {resolvedTheme} mode</p>
          </div>
          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-orange/15 text-brand-orange font-bold border border-brand-orange/30'
                      : 'text-text-muted hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {getIcon(opt.id)}
                    <div>
                      <p className="font-semibold text-white">{opt.label}</p>
                      <p className="text-[10px] text-text-muted leading-tight">{opt.description}</p>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-brand-orange shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
