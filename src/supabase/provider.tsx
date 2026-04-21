'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
  type DependencyList,
} from 'react';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupabaseContextState {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const enhanceUser = (u: User | null) => {
    if (!u) return null;
    if (!('uid' in u)) {
      Object.defineProperty(u, 'uid', { get: () => u.id, configurable: true });
    }
    return u;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(enhanceUser(session?.user ?? null));
      setIsUserLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(enhanceUser(session?.user ?? null));
        setIsUserLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, user, session, isUserLoading }),
    [supabase, user, session, isUserLoading]
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useSupabaseContext() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabaseContext must be used within SupabaseProvider');
  return ctx;
}

/** Replaces useFirestore() */
export function useSupabase() {
  return useSupabaseContext().supabase;
}

/** Replaces useAuth() */
export function useAuth() {
  return useSupabaseContext().supabase.auth;
}

/** Replaces useUser() */
export function useUser() {
  const { user, isUserLoading } = useSupabaseContext();
  return { user, isUserLoading, userError: null };
}

/** Replaces useFirestore() — returns supabase client */
export function useFirestore() {
  return useSupabaseContext().supabase;
}

// ─── Realtime hooks (replaces useCollection / useDoc) ─────────────────────────

export interface UseCollectionResult<T> {
  data: (T & { id: string })[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Replaces useCollection() — subscribes to a Supabase table with optional filter.
 * Pass a stable config object (useMemo or top-level constant).
 */
export function useCollection<T = any>(
  config: {
    table: string;
    filter?: { column: string; value: string | boolean };
    orderBy?: { column: string; ascending?: boolean };
    select?: string;
  } | null | undefined
): UseCollectionResult<T> {
  const supabase = useSupabaseContext().supabase;
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!config) { setData(null); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      let q = supabase.from(config.table).select(config.select ?? '*');
      if (config.filter) q = q.eq(config.filter.column, config.filter.value) as any;
      if (config.orderBy) q = q.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? false }) as any;
      const { data: rows, error: err } = await q;
      if (err) throw err;
      setData((rows ?? []) as any);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, config]);

  useEffect(() => {
    fetchData();
    if (!config) return;
    // Realtime subscription
    const channel = supabase
      .channel(`${config.table}-changes-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: config.table }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase, config]);

  return { data, isLoading, error };
}

export interface UseDocResult<T> {
  data: (T & { id: string }) | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Replaces useDoc() — subscribes to a single row by id.
 */
export function useDoc<T = any>(
  config: { table: string; id: string | null | undefined } | null | undefined
): UseDocResult<T> {
  const supabase = useSupabaseContext().supabase;
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!config?.id) { setData(null); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data: row, error: err } = await supabase
        .from(config.table)
        .select('*')
        .eq('id', config.id)
        .single();
      if (err) throw err;
      setData(row as any);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, config?.table, config?.id]);

  useEffect(() => {
    fetchData();
    if (!config?.id) return;
    const channel = supabase
      .channel(`${config.table}-${config.id}-${Math.random()}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: config.table,
        filter: `id=eq.${config.id}`,
      }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase, config?.table, config?.id]);

  return { data, isLoading, error };
}

/**
 * Replaces useMemoFirebase() — just a normal useMemo re-export for compatibility.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

// ─── Client Provider (replaces FirebaseClientProvider) ────────────────────────

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
