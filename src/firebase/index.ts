'use client';

// ─────────────────────────────────────────────────────────────────────────────
// @/firebase — compatibility shim
//
// All existing imports like:
//   import { useFirestore, useUser, useAuth, useCollection, useDoc } from '@/firebase'
// continue to work without touching the consuming files.
// ─────────────────────────────────────────────────────────────────────────────

export {
  SupabaseProvider,
  FirebaseClientProvider,
  useSupabase,
  useAuth,
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/supabase/provider';

export type {
  UseCollectionResult,
  UseDocResult,
} from '@/supabase/provider';

// Re-export supabase client for direct use (client-side only)
export { getSupabaseClient } from '@/supabase/client';

// NOTE: Do NOT re-export createServerSupabaseClient here.
// Server components should import directly from '@/supabase/server'.