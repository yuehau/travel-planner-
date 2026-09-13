import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Supabase configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('does not create a client when env vars are missing', async () => {
    const createClient = vi.fn();

    vi.doMock('@supabase/supabase-js', () => ({
      createClient,
    }));
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const { getSupabaseClient, supabase, supabaseConfigError } = await import('./supabase');

    expect(supabase).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(supabaseConfigError).toContain('Supabase is not configured');
    expect(() => getSupabaseClient()).toThrow('Supabase is not configured');
  });
});
