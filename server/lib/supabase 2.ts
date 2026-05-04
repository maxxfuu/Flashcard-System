import { createClient } from "@supabase/supabase-js";

// Service-role client — never expose this key to the browser.
// Used server-side only: verifying JWTs and bypassing RLS where needed.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
