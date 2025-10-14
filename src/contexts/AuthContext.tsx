import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '../services/auth';
import { User, UserProfile, AuthContextType } from '../types';
import analytics, { EVENTS, USER_PROPERTIES } from '../services/analytics';

// Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 AuthContext: Initializing auth state...');
      try {
        const currentUser = await AuthService.getCurrentUser();
        console.log('👤 AuthContext: Current user check result:', {
          hasUser: !!currentUser,
          userEmail: currentUser?.email,
          userId: currentUser?.id
        });
        
        if (currentUser) {
          setUser(currentUser);
          
          // Track user session start
          analytics.identify(currentUser.id, {
            email: currentUser.email,
            [USER_PROPERTIES.LAST_ACTIVE]: new Date().toISOString()
          });
          
          // Load user profile
          const userProfile = await AuthService.getUserProfile(currentUser.id);
          console.log('📋 AuthContext: Profile check result:', {
            hasProfile: !!userProfile,
            profileData: userProfile
          });
          setProfile(userProfile);
          
          // Track user properties if profile exists
          if (userProfile) {
            analytics.setUserProperties({
              [USER_PROPERTIES.DISPLAY_NAME]: userProfile.full_name
            });
          }
        }
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth:', error);
      } finally {
        console.log('✅ AuthContext: Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
      console.log('🔄 [AUTH CONTEXT] Auth state change detected:', { 
        hasUser: !!user, 
        userEmail: user?.email,
        userId: user?.id 
      });
      
      setUser(user);
      
      if (user) {
        // Track user login
        analytics.trackLogin(user.id);
        
        // Load user profile when user signs in
        console.log('📋 [AUTH CONTEXT] Loading profile for authenticated user:', user.id);
        const userProfile = await AuthService.getUserProfile(user.id);
        console.log('📊 [AUTH CONTEXT] Profile loaded:', { 
          hasProfile: !!userProfile,
          fullName: userProfile?.full_name 
        });
        
        setProfile(userProfile);
        
        // Update user properties
        if (userProfile) {
          analytics.setUserProperties({
            [USER_PROPERTIES.DISPLAY_NAME]: userProfile.full_name,
            [USER_PROPERTIES.LAST_ACTIVE]: new Date().toISOString()
          });
        }
      } else {
        console.log('👋 [AUTH CONTEXT] User signed out, clearing profile');
        
        // Track user logout and reset analytics
        analytics.track(EVENTS.USER_SIGNED_OUT);
        analytics.reset();
        
        // Clear profile when user signs out
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(email, password, metadata);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google function
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signInWithGoogle();
      return result;
    } finally {
      // Don't set loading to false here as OAuth redirect will handle it
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signOut();
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Update profile function with enhanced reliability
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.error('❌ [AUTH CONTEXT] No user logged in for profile update');
      return { error: 'No user logged in' };
    }

    const startTime = Date.now();
    console.log('🔄 [AUTH CONTEXT] Starting profile update...', { 
      userId: user.id, 
      updates,
      currentProfile: profile ? 'exists' : 'null'
    });
    
    setLoading(true);
    
    try {
      // Call the AuthService to update the profile
      const result = await AuthService.updateUserProfile(user.id, updates);
      
      if (!result.error && result.profile) {
        const duration = Date.now() - startTime;
        console.log(`✅ [AUTH CONTEXT] Profile update successful in ${duration}ms:`, result.profile);
        
        // Immediately update the context state
        setProfile(result.profile);
        
        // Update analytics with new profile data
        if (result.profile.full_name) {
          analytics.setUserProperties({
            [USER_PROPERTIES.DISPLAY_NAME]: result.profile.full_name
          });
        }
        
        console.log('🎯 [AUTH CONTEXT] Profile context updated successfully');
        return { error: null, profile: result.profile };
      } else {
        const duration = Date.now() - startTime;
        console.error(`❌ [AUTH CONTEXT] Failed to update profile after ${duration}ms:`, result.error);
        return { error: result.error || 'Unknown error occurred' };
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [AUTH CONTEXT] Profile update exception after ${duration}ms:`, error);
      return { error: error.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



