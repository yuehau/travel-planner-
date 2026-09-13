import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './themeContextValue';
import { resolveInitialTheme } from './themeStorage';

const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('theme');
  return resolveInitialTheme(savedTheme, window.matchMedia('(prefers-color-scheme: dark)').matches);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
