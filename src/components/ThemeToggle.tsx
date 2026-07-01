import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const themes = [
    { value: 'system' as const, label: 'System', icon: Monitor, activeColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/30 dark:border-blue-400/20' },
    { value: 'light' as const, label: 'Light', icon: Sun, activeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/30 dark:border-amber-400/20' },
    { value: 'dark' as const, label: 'Dark', icon: Moon, activeColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-400/10 border-purple-500/30 dark:border-purple-400/20' },
  ];

  return (
    <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-900 rounded-xl select-none z-50">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all relative cursor-pointer ${
              isActive 
                ? `bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold border ${t.activeColor}` 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-transparent'
            }`}
            title={`Set theme to ${t.label}`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : 'opacity-80'}`} />
            <span className="hidden sm:inline uppercase font-black text-[9px]">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

