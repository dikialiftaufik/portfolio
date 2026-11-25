// Backend configuration. Values come from Vite env (VITE_SUPABASE_URL,
// VITE_SUPABASE_ANON_KEY). The anon key is public by design: row-level
// security is the real access control. NEVER put a service_role key here.
// null = seed mode with an honest banner, never a crash.

export interface BackendConfig {
  url: string;
  anonKey: string;
}

type EnvLike = Record<string, string | undefined>;

export function readConfig(env: EnvLike): BackendConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (url.includes('REPLACE-ME') || anonKey.includes('REPLACE-ME')) return null;
  return { url, anonKey };
}

export function getConfig(): BackendConfig | null {
  return readConfig(import.meta.env as EnvLike);
}
