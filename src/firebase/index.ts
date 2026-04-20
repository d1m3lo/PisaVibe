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

// Re-export supabase clients for direct use
export { getSupabaseClient } from '@/supabase/client';
export { createServerSupabaseClient, createServiceRoleClient } from '@/supabase/server';