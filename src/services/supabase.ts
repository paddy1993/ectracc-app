import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder_key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  FOOTPRINTS: 'footprints',
  GOALS: 'goals',
  NOTIFICATIONS: 'notifications'
} as const;

// Auth configuration
export const AUTH_CONFIG = {
  redirectTo: process.env.REACT_APP_ENV === 'production' 
    ? 'https://ectracc.com/auth/callback'
    : 'http://localhost:3050/auth/callback',
  providers: {
    google: {
      scopes: 'email profile'
    }
  }
};



