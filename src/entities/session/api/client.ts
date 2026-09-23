import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined;

export const isCloudConfigured = (): boolean =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient !== undefined) return cachedClient;
  if (!isCloudConfigured()) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_PUBLISHABLE_KEY as string,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
  return cachedClient;
};
