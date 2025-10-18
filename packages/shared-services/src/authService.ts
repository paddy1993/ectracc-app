/**
 * Authentication Service
 * Platform-agnostic auth logic (platform must provide Supabase client)
 */

import type { User, UserProfile } from '@ectracc/shared-types';

// This interface must be implemented by each platform
export interface SupabaseClient {
  auth: {
    signUp(credentials: {
      email: string;
      password: string;
      options?: any;
    }): Promise<{ data: { user: any | null }; error: any | null }>;
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): Promise<{ data: { user: any | null }; error: any | null }>;
    signInWithOAuth(options: { provider: string; options?: any }): Promise<any>;
    signOut(): Promise<{ error: any | null }>;
    getSession(): Promise<{ data: { session: any | null }; error: any | null }>;
    getUser(): Promise<{ data: { user: any | null }; error: any | null }>;
    onAuthStateChange(callback: (event: string, session: any) => void): {
      data: { subscription: any };
    };
  };
  from(table: string): any;
}

export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Transform Supabase user to our User type
  private transformUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      email_confirmed_at: supabaseUser.email_confirmed_at,
      phone: supabaseUser.phone,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      app_metadata: supabaseUser.app_metadata,
      user_metadata: supabaseUser.user_metadata,
    };
  }

  // Sign up with email and password
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to create user' };
      }

      return { user: this.transformUser(data.user), error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Sign up failed' };
    }
  }

  // Sign in with email and password
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to sign in' };
      }

      return { user: this.transformUser(data.user), error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Sign in failed' };
    }
  }

  // Sign in with Google (platform must handle OAuth flow)
  async signInWithGoogle(redirectUrl?: string): Promise<{
    user: User | null;
    error: string | null;
  }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      // OAuth flow doesn't return user immediately
      return { user: null, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Google sign in failed' };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Sign out failed' };
    }
  }

  // Get current session
  async getSession(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.session?.user) {
        return { user: null, error: null };
      }

      return { user: this.transformUser(data.session.user), error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Failed to get session' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: null };
      }

      return { user: this.transformUser(data.user), error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Failed to get current user' };
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<{
    profile: UserProfile | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found
          return { profile: null, error: null };
        }
        return { profile: null, error: error.message };
      }

      // Map display_name to full_name for frontend
      const profile: UserProfile = {
        ...data,
        full_name: data.display_name || data.full_name,
      };

      return { profile, error: null };
    } catch (error: any) {
      return { profile: null, error: error.message || 'Failed to get profile' };
    }
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ error: string | null }> {
    try {
      // Map full_name to display_name for database
      const dbUpdates = {
        ...updates,
        display_name: updates.full_name || updates.display_name,
        updated_at: new Date().toISOString(),
      };

      // Remove full_name from updates as it's not in the database schema
      delete (dbUpdates as any).full_name;

      const { error } = await this.supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to update profile' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, user: User | null) => void): () => void {
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? this.transformUser(session.user) : null;
      callback(event, user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  // Get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      const { data } = await this.supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
}


