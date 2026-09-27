// Public values: safe to ship to the browser. Env vars override if set.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fsvwlbvisngsjuwesiwf.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_57gj6us0FbrGLnCTNkU7pQ_eCDt9X9i";
