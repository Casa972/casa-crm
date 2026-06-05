import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase unique. Les identifiants viennent EXCLUSIVEMENT de l'env.
 * On échoue tôt et clairement si la config manque (pas de fallback codé en dur).
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "[config] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants. " +
      "Copiez .env.example vers .env.local et renseignez les valeurs.",
  );
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
