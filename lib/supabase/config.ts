// Public values: safe to ship to the browser. Env vars override if set to something valid.
const env = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "");

const url = env(process.env.NEXT_PUBLIC_SUPABASE_URL);
const key = env(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const SUPABASE_URL = url.startsWith("https://") ? url : "https://fsvwlbvisngsjuwesiwf.supabase.co";
export const SUPABASE_ANON_KEY = key || "sb_publishable_57gj6us0FbrGLnCTNkU7pQ_eCDt9X9i";
