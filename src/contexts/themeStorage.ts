import type { Theme } from './themeContextValue';

export const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

export const resolveInitialTheme = (savedTheme: string | null, prefersDark: boolean): Theme => {
  if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return prefersDark ? 'dark' : 'light';
};
