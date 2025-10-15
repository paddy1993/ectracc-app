import { createClient } from '@supabase/supabase-js';

// Supabase configuration - credentials must be provided via environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.'
  );
}

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

// Auth configuration with mobile-specific handling
const getRedirectUrl = () => {
  if (process.env.REACT_APP_ENV === 'production') {
    // Use the current domain to ensure consistency
    const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://ectracc.com';
    return `${currentDomain}/auth/callback`;
  }
  return 'http://localhost:3000/auth/callback';
};

export const AUTH_CONFIG = {
  redirectTo: getRedirectUrl(),
  providers: {
    google: {
      scopes: 'email profile',
      // Mobile-specific options
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  }
};



