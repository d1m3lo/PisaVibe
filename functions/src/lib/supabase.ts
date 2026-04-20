import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas no .env"
  );
}

/**
 * Client com service role — uso exclusivo server-side.
 * Substitui admin.firestore() do firebase-admin.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);