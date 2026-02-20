'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

export function ThemeSwitcher() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className="w-11 h-6" />;
  }

  const isDark = theme === 'vigilante';

  return (
    <button
      onClick={() => setTheme(isDark ? 'bright' : 'vigilante')}
      className="relative h-6 w-11 rounded-full bg-secondary transition-colors"
      title={isDark ? 'Switch to Bright theme' : 'Switch to Dark theme'}
    >
      <div
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform flex items-center justify-center ${
          isDark ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3" />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" />
        )}
      </div>
    </button>
  );
}
