import { supabase, TABLES, AUTH_CONFIG } from './supabase';
import { User, UserProfile } from '../types';

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, metadata?: Record<string, any>) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user as User | null, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Failed to sign up' };
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user as User | null, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Failed to sign in' };
    }
  }

  // Sign in with Google OAuth
  static async signInWithGoogle() {
    try {
      console.log('🔄 Starting Google OAuth sign-in...');
      console.log('📍 Redirect URL:', AUTH_CONFIG.redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AUTH_CONFIG.redirectTo,
          scopes: AUTH_CONFIG.providers.google.scopes,
          queryParams: AUTH_CONFIG.providers.google.queryParams
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        return { user: null, error: error.message };
      }

      console.log('✅ Google OAuth initiated successfully');
      // OAuth redirect - user will be null initially
      return { user: null, error: null };
    } catch (error: any) {
      console.error('❌ Google OAuth exception:', error);
      return { user: null, error: error.message || 'Failed to sign in with Google' };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to sign out' };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user as User | null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as User | null);
    });
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Create user profile
  static async createUserProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert([profile])
        .select()
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: data, error: null };
    } catch (error: any) {
      return { profile: null, error: error.message || 'Failed to create profile' };
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      // First, try to update existing profile
      const { data: updateData, error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError && updateError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: insertData, error: insertError } = await supabase
          .from(TABLES.PROFILES)
          .insert({ 
            user_id: userId, 
            ...updates, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .select()
          .single();

        if (insertError) {
          return { profile: null, error: insertError.message };
        }

        return { profile: insertData, error: null };
      } else if (updateError) {
        return { profile: null, error: updateError.message };
      }

      return { profile: updateData, error: null };
    } catch (error: any) {
      return { profile: null, error: error.message || 'Failed to update profile' };
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_CONFIG.redirectTo
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to send reset email' };
    }
  }
}



