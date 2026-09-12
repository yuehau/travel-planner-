import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from './themeStorage';

describe('theme storage helpers', () => {
  it('uses saved light and dark themes', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to system preference for invalid saved values', () => {
    expect(resolveInitialTheme('sepia', true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });
});
