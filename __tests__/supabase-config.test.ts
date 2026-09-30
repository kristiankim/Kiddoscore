import { afterEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn(() => ({ auth: {} })) }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

describe('optional Supabase configuration', () => {
  it.each([
    ['', ''],
    ['https://example.supabase.co', ''],
    ['', 'example-key'],
  ])('loads without a client when configuration is incomplete', async (url, key) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', key);

    const { supabase } = await import('../app/_lib/supabase');

    expect(supabase).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('creates the client when both credentials are configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'example-key');

    const { supabase } = await import('../app/_lib/supabase');

    expect(supabase).not.toBeNull();
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'example-key', {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    });
  });
});
