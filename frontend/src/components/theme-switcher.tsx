'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
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
    return <div className="w-9 h-9" />;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button
        onClick={() => toggleTheme('bright')}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
          theme === 'bright' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Bright theme"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => toggleTheme('vigilante')}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
          theme === 'vigilante' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Vigilante theme"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
