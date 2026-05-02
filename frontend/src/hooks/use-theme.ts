import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Support both 'theme' and 'qh_theme' keys for theme persistence
    const savedTheme = (localStorage.getItem('qh_theme') || localStorage.getItem('theme')) as Theme;
    const theme = savedTheme || 'light';
    setTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Also sync to qh_theme for consistency with qh_role pattern
    localStorage.setItem('qh_theme', theme);
  }, []);

  const toggleTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    // Set both keys to ensure compatibility with role switcher
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('qh_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  return { theme, setTheme: toggleTheme, mounted };
}
