import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://irebylncovkdrthnovth.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWJ5bG5jb3ZrZHJ0aG5vdnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjQxMjksImV4cCI6MjA3MzY0MDEyOX0.pjv3QL70AyTsIcyLpEO3mLLUzcpJ9QF67Uhgtv1MkII';

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
    : 'http://localhost:3000/auth/callback',
  providers: {
    google: {
      scopes: 'email profile'
    }
  }
};



