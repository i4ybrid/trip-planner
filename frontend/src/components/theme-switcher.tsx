'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'bright' | 'vigilante';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('bright');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!mounted) {
    return <div className="w-20 h-10" />;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-full shadow-lg">
        <button
          onClick={() => toggleTheme('bright')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200',
            theme === 'bright' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sun className="w-4 h-4" />
          <span className="text-sm font-medium">Bright</span>
        </button>
        <button
          onClick={() => toggleTheme('vigilante')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200',
            theme === 'vigilante' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Moon className="w-4 h-4" />
          <span className="text-sm font-medium">Vigilante</span>
        </button>
      </div>
    </div>
  );
}
