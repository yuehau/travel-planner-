import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

vi.stubEnv('VITE_SUPABASE_URL', '');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

afterEach(() => {
  globalThis.localStorage?.clear();
  if (globalThis.document) {
    globalThis.document.documentElement.className = '';
  }
  vi.restoreAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
});
