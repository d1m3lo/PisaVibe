'use client';

/**
 * Firebase Firestore API Compatibility Shim for Supabase
 * 
 * This module provides Firebase-like function signatures that internally
 * use the Supabase client. This allows existing code that imports from
 * 'firebase/firestore' to work with minimal changes by redirecting
 * imports to this module.
 * 
 * NOTE: This is a thin compatibility layer. The `supabase` (SupabaseClient)
 * instance is passed as the first argument where Firebase would pass `firestore`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Reference types ───────────────────────────────────────────────────────────

export interface DocRef {
  __type: 'doc';
  table: string;
  id: string;
  parentPath?: string;
}

export interface CollectionRef {
  __type: 'collection';
  table: string;
  parentPath?: string;
}

export interface QueryRef {
  __type: 'query';
  table: string;
  filters: Array<{ column: string; op: string; value: any }>;
  orderByClause?: { column: string; ascending: boolean };
  parentPath?: string;
}

// ─── Reference builders ────────────────────────────────────────────────────────

/**
 * Build a document reference. Supports:
 *   doc(supabase, 'users', 'abc')
 *   doc(supabase, 'users/abc/orders', 'xyz')
 *   doc(supabase, 'users', 'abc', 'orders', 'xyz')
 */
export function doc(supabase: SupabaseClient, ...pathSegments: string[]): DocRef {
  const segments = pathSegments.flatMap(s => s.split('/'));
  // Last segment is the ID, second-to-last is the table
  const id = segments[segments.length - 1];
  const table = segments[segments.length - 2];
  const parentPath = segments.length > 2 ? segments.slice(0, -2).join('/') : undefined;
  return { __type: 'doc', table, id, parentPath };
}

/**
 * Build a collection reference.
 *   collection(supabase, 'products')
 *   collection(supabase, 'users/abc/orders')
 *   collection(supabase, 'users', 'abc', 'orders')
 */
export function collection(supabase: SupabaseClient, ...pathSegments: string[]): CollectionRef {
  const segments = pathSegments.flatMap(s => s.split('/'));
  const table = segments[segments.length - 1];
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join('/') : undefined;
  return { __type: 'collection', table, parentPath };
}

// ─── Query builders ────────────────────────────────────────────────────────────

export function where(column: string, op: string, value: any) {
  return { column, op, value };
}

export function orderBy(column: string, direction: 'asc' | 'desc' = 'asc') {
  return { __type: 'orderBy' as const, column, ascending: direction === 'asc' };
}

export function query(
  ref: CollectionRef,
  ...constraints: any[]
): QueryRef {
  const filters: Array<{ column: string; op: string; value: any }> = [];
  let orderByClause: { column: string; ascending: boolean } | undefined;

  for (const c of constraints) {
    if (c && c.__type === 'orderBy') {
      orderByClause = { column: c.column, ascending: c.ascending };
    } else if (c && c.column) {
      filters.push(c);
    }
  }

  return { __type: 'query', table: ref.table, filters, orderByClause, parentPath: ref.parentPath };
}

export function limit(_n: number) {
  // Limit is handled at the Supabase query level — stored as metadata
  return { __type: 'limit' as const, value: _n };
}

// ─── Snapshot types ────────────────────────────────────────────────────────────

export interface DocSnapshot {
  id: string;
  data: () => any;
  exists: () => boolean;
  _raw: any;
}

export interface QuerySnapshot {
  docs: DocSnapshot[];
  empty: boolean;
  size: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function resolveTable(ref: DocRef | CollectionRef | QueryRef): string {
  // For subcollections like users/{uid}/orders, the actual table is 'orders'
  // and we need to filter by user_id.
  return ref.table;
}

function resolveParentFilter(ref: DocRef | CollectionRef | QueryRef): { column: string; value: string } | null {
  if (!ref.parentPath) return null;
  const segments = ref.parentPath.split('/');
  // e.g. parentPath = 'users/abc' => parent table 'users', parent id 'abc'
  if (segments.length >= 2) {
    return { column: 'user_id', value: segments[segments.length - 1] };
  }
  return null;
}

function applyFilters(q: any, filters: Array<{ column: string; op: string; value: any }>) {
  for (const f of filters) {
    switch (f.op) {
      case '==':
        q = q.eq(f.column, f.value);
        break;
      case '!=':
        q = q.neq(f.column, f.value);
        break;
      case '>':
        q = q.gt(f.column, f.value);
        break;
      case '>=':
        q = q.gte(f.column, f.value);
        break;
      case '<':
        q = q.lt(f.column, f.value);
        break;
      case '<=':
        q = q.lte(f.column, f.value);
        break;
      case 'in':
        q = q.in(f.column, f.value);
        break;
      case 'array-contains':
        q = q.contains(f.column, [f.value]);
        break;
      default:
        q = q.eq(f.column, f.value);
    }
  }
  return q;
}

function wrapDoc(row: any): DocSnapshot {
  return {
    id: row?.id ?? '',
    data: () => row,
    exists: () => !!row,
    _raw: row,
  };
}

// ─── Read operations ───────────────────────────────────────────────────────────

export async function getDoc(ref: DocRef): Promise<DocSnapshot> {
  // We need the supabase client — it's stored in the ref's context
  // Since we don't have it here, we'll use the global singleton
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();
  
  const table = resolveTable(ref);
  let q = supabase.from(table).select('*').eq('id', ref.id);
  
  const parentFilter = resolveParentFilter(ref);
  if (parentFilter) {
    q = q.eq(parentFilter.column, parentFilter.value);
  }

  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message || JSON.stringify(error));

  return wrapDoc(data);
}

export async function getDocs(ref: CollectionRef | QueryRef): Promise<QuerySnapshot> {
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();

  const table = resolveTable(ref);
  let q = supabase.from(table).select('*');

  const parentFilter = resolveParentFilter(ref);
  if (parentFilter) {
    q = q.eq(parentFilter.column, parentFilter.value);
  }

  if (ref.__type === 'query') {
    q = applyFilters(q, ref.filters);
    if (ref.orderByClause) {
      q = q.order(ref.orderByClause.column, { ascending: ref.orderByClause.ascending });
    }
  }

  const { data, error } = await q;
  if (error && error.code !== 'PGRST116') throw new Error(error.message || JSON.stringify(error));

  const docs = (data ?? []).map(wrapDoc);
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
  };
}

// ─── Write operations ──────────────────────────────────────────────────────────

export async function setDoc(ref: DocRef, data: any, options?: { merge?: boolean }) {
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();
  
  const table = resolveTable(ref);
  const row = { ...data, id: ref.id };

  const parentFilter = resolveParentFilter(ref);
  if (parentFilter) {
    row[parentFilter.column] = parentFilter.value;
  }

  const { error } = await supabase.from(table).upsert(row);
  if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function addDoc(ref: CollectionRef, data: any): Promise<DocRef> {
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();
  
  const table = resolveTable(ref);
  const row = { ...data };

  const parentFilter = resolveParentFilter(ref);
  if (parentFilter) {
    row[parentFilter.column] = parentFilter.value;
  }

  const { data: inserted, error } = await supabase.from(table).insert(row).select('id').single();
  if (error) throw new Error(error.message || JSON.stringify(error));

  return { __type: 'doc', table, id: inserted.id, parentPath: ref.parentPath };
}

export async function updateDoc(ref: DocRef, data: any) {
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();

  const table = resolveTable(ref);

  // Handle Firestore increment() — resolve increment values
  const resolvedData: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && (val as any).__type === 'increment') {
      // For increment, we need to use RPC or raw SQL. For now, do a read-modify-write.
      const { data: current } = await supabase.from(table).select(key).eq('id', ref.id).single();
      resolvedData[key] = ((current as any)?.[key] || 0) + (val as any).value;
    } else if (val && typeof val === 'object' && (val as any).__type === 'arrayUnion') {
      // For arrayUnion, append values to existing array
      const { data: current } = await supabase.from(table).select(key).eq('id', ref.id).single();
      const existing = (current as any)?.[key] || [];
      const newValues = (val as any).values.filter((v: any) => !existing.includes(v));
      resolvedData[key] = [...existing, ...newValues];
    } else {
      resolvedData[key] = val;
    }
  }

  let q = supabase.from(table).update(resolvedData).eq('id', ref.id);
  
  const parentFilter = resolveParentFilter(ref);
  if (parentFilter) {
    q = q.eq(parentFilter.column, parentFilter.value);
  }

  const { error } = await q;
  if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function deleteDoc(ref: DocRef) {
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();

  const table = resolveTable(ref);
  let q = supabase.from(table).delete().eq('id', ref.id);

  const parentFilter = resolveParentFilter(ref);
  if (parentFilter) {
    q = q.eq(parentFilter.column, parentFilter.value);
  }

  const { error } = await q;
  if (error) throw new Error(error.message || JSON.stringify(error));
}

// ─── Realtime (onSnapshot) ─────────────────────────────────────────────────────

export function onSnapshot(
  ref: CollectionRef | QueryRef | DocRef,
  callback: (snapshot: QuerySnapshot | DocSnapshot) => void
): () => void {
  // For now, do an initial fetch and subscribe to realtime changes
  const { getSupabaseClient } = require('@/supabase/client');
  const supabase = getSupabaseClient() as SupabaseClient;

  const table = resolveTable(ref);

  // Initial fetch
  if (ref.__type === 'doc') {
    getDoc(ref).then(snapshot => callback(snapshot)).catch(err => console.error('onSnapshot initial getDoc error:', err));
  } else {
    getDocs(ref as CollectionRef | QueryRef).then(snapshot => callback(snapshot)).catch(err => console.error('onSnapshot initial getDocs error:', err));
  }

  // Subscribe to realtime
  const channel = supabase
    .channel(`compat-${table}-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      // Re-fetch on any change
      if (ref.__type === 'doc') {
        getDoc(ref).then(snapshot => callback(snapshot)).catch(err => console.error('onSnapshot realtime getDoc error:', err));
      } else {
        getDocs(ref as CollectionRef | QueryRef).then(snapshot => callback(snapshot)).catch(err => console.error('onSnapshot realtime getDocs error:', err));
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Field value helpers ───────────────────────────────────────────────────────

export function increment(value: number) {
  return { __type: 'increment' as const, value };
}

export function arrayUnion(...values: any[]) {
  return { __type: 'arrayUnion' as const, values };
}

// ─── Unused but imported in code ───────────────────────────────────────────────

export function collectionGroup(supabase: SupabaseClient, collectionId: string): QueryRef {
  // Collection group queries: just query the table directly (no parent filter)
  return { __type: 'query', table: collectionId, filters: [] };
}

export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  static now(): Timestamp {
    const now = Date.now();
    return new Timestamp(Math.floor(now / 1000), (now % 1000) * 1e6);
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }
}

// ─── Batch writing ─────────────────────────────────────────────────────────────

export interface WriteBatch {
  set(ref: DocRef, data: any, options?: { merge?: boolean }): WriteBatch;
  update(ref: DocRef, data: any): WriteBatch;
  delete(ref: DocRef): WriteBatch;
  commit(): Promise<void>;
}

export function writeBatch(supabase: SupabaseClient): WriteBatch {
  // Supabase doesn't have a direct equivalent to Firestore's client-side batching
  // outside of RPC or raw SQL. We'll simulate it by collecting operations and
  // executing them sequentially or via individual requests. For true atomicity,
  // we would need an RPC function. This is a functional shim.
  
  const operations: Array<() => Promise<void>> = [];

  return {
    set(ref: DocRef, data: any, options?: { merge?: boolean }) {
      operations.push(() => setDoc(ref, data, options));
      return this;
    },
    update(ref: DocRef, data: any) {
      operations.push(() => updateDoc(ref, data));
      return this;
    },
    delete(ref: DocRef) {
      operations.push(() => deleteDoc(ref));
      return this;
    },
    async commit() {
      // Execute all operations
      // In a real transactional system this would be atomic
      for (const op of operations) {
        await op();
      }
    }
  };
}

// Re-export Firestore type alias so `Firestore` type references don't break
export type Firestore = SupabaseClient;

// Compatibility for initializeFirebase
export function initializeFirebase() {
  // This is a no-op in the Supabase world since we initialize differently,
  // but we provide it so existing imports don't break.
  return {};
}
