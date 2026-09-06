import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User as AuthUser } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSignal = signal<Session | null>(null);
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly readySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly configured = isSupabaseConfigured();

  async initialize(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      this.readySignal.set(true);
      return;
    }

    const { data } = await client.auth.getSession();
    this.applySession(data.session);

    client.auth.onAuthStateChange((_event, session) => {
      this.applySession(session);
    });

    this.readySignal.set(true);
  }

  async signUp(email: string, password: string, displayName?: string): Promise<void> {
    const client = this.requireClient();
    this.errorSignal.set(null);
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName?.trim() || undefined },
      },
    });
    if (error) {
      this.errorSignal.set(error.message);
      throw error;
    }
    this.applySession(data.session);
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = this.requireClient();
    this.errorSignal.set(null);
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      this.errorSignal.set(error.message);
      throw error;
    }
    this.applySession(data.session);
  }

  async signInWithGoogle(): Promise<void> {
    const client = this.requireClient();
    this.errorSignal.set(null);
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      this.errorSignal.set(error.message);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    this.errorSignal.set(null);
    const { error } = await client.auth.signOut();
    if (error) {
      this.errorSignal.set(error.message);
      throw error;
    }
    this.applySession(null);
  }

  userId(): string | null {
    return this.userSignal()?.id ?? null;
  }

  /** Best available display name from auth metadata / email. */
  displayName(): string {
    const user = this.userSignal();
    if (!user) {
      return 'Athlete';
    }
    const meta = user.user_metadata ?? {};
    const fromMeta =
      str(meta['display_name']) || str(meta['full_name']) || str(meta['name']);
    if (fromMeta) {
      return fromMeta;
    }
    const email = user.email?.trim();
    if (email?.includes('@')) {
      return email.split('@')[0] || 'Athlete';
    }
    return 'Athlete';
  }

  private applySession(session: Session | null): void {
    this.sessionSignal.set(session);
    this.userSignal.set(session?.user ?? null);
  }

  private requireClient() {
    const client = getSupabaseClient();
    if (!client) {
      const err = new Error('Supabase is not configured. Set supabaseUrl and supabaseAnonKey.');
      this.errorSignal.set(err.message);
      throw err;
    }
    return client;
  }
}

function str(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
