'use client';

/**
 * Firebase Auth API Compatibility Shim for Supabase
 * 
 * Maps Firebase Auth function signatures to Supabase Auth equivalents.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseAuth = SupabaseClient['auth'];

// ─── Auth functions ────────────────────────────────────────────────────────────

export async function signInWithEmailAndPassword(auth: SupabaseAuth, email: string, password: string) {
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) {
    const err: any = new Error(error.message);
    err.code = mapSupabaseErrorToFirebaseCode(error.message);
    throw err;
  }
  return { user: data.user };
}

export async function createUserWithEmailAndPassword(auth: SupabaseAuth, email: string, password: string) {
  const { data, error } = await auth.signUp({ email, password });
  if (error) {
    const err: any = new Error(error.message);
    err.code = mapSupabaseErrorToFirebaseCode(error.message);
    throw err;
  }
  return { user: data.user };
}

export async function signOut(auth: SupabaseAuth) {
  const { error } = await auth.signOut();
  if (error) throw error;
}

export async function signInWithPopup(auth: SupabaseAuth, _provider: any) {
  // OAuth is handled via redirect in Supabase
  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    },
  });
  if (error) throw error;
  return { user: data };
}

export async function updateProfile(user: any, profile: { displayName?: string; photoURL?: string }) {
  // In Supabase, user metadata is updated via auth.updateUser
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();
  
  const updates: any = {};
  if (profile.displayName !== undefined) updates.display_name = profile.displayName;
  if (profile.photoURL !== undefined) updates.avatar_url = profile.photoURL;

  const { error } = await supabase.auth.updateUser({
    data: updates,
  });
  if (error) throw error;
}

export async function updatePassword(user: any, newPassword: string) {
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    const err: any = new Error(error.message);
    err.code = mapSupabaseErrorToFirebaseCode(error.message);
    throw err;
  }
}

export async function reauthenticateWithCredential(user: any, credential: any) {
  // Supabase doesn't require re-authentication for password change
  // if the user is already signed in. 
  // For extra security, we can verify the current password by signing in again.
  const { getSupabaseClient } = await import('@/supabase/client');
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: credential.email,
    password: credential.password,
  });

  if (error) {
    const err: any = new Error(error.message);
    err.code = 'auth/wrong-password';
    throw err;
  }
}

// ─── Provider classes ──────────────────────────────────────────────────────────

export class GoogleAuthProvider {
  providerId = 'google.com';
}

export class EmailAuthProvider {
  static PROVIDER_ID = 'password';
  
  static credential(email: string, password: string) {
    return { email, password, providerId: 'password' };
  }
}

// ─── Auth types ────────────────────────────────────────────────────────────────

export function getAuth() {
  // Return supabase auth instance from singleton
  const { getSupabaseClient } = require('@/supabase/client');
  return getSupabaseClient().auth;
}

export type User = any;
export type Auth = SupabaseAuth;

// ─── Messaging (stub) ─────────────────────────────────────────────────────────

export function getMessaging() {
  return null;
}

export function getToken(_messaging: any, _options?: any): Promise<string | null> {
  return Promise.resolve(null);
}

export function onMessage(_messaging: any, _callback: any) {
  return () => {};
}

// ─── Error mapping ─────────────────────────────────────────────────────────────

function mapSupabaseErrorToFirebaseCode(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
    return 'auth/invalid-credential';
  }
  if (msg.includes('email not confirmed')) {
    return 'auth/email-not-verified';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'auth/email-already-in-use';
  }
  if (msg.includes('password should be at least')) {
    return 'auth/weak-password';
  }
  if (msg.includes('invalid email')) {
    return 'auth/invalid-email';
  }
  return 'auth/unknown';
}
