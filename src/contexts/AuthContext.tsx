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
              [USER_PROPERTIES.DISPLAY_NAME]: userProfile.display_name,
              [USER_PROPERTIES.SUSTAINABILITY_GOAL]: userProfile.sustainability_goal
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
      setUser(user);
      
      if (user) {
        // Track user login
        analytics.trackLogin(user.id);
        
        // Load user profile when user signs in
        const userProfile = await AuthService.getUserProfile(user.id);
        setProfile(userProfile);
        
        // Update user properties
        if (userProfile) {
          analytics.setUserProperties({
            [USER_PROPERTIES.DISPLAY_NAME]: userProfile.display_name,
            [USER_PROPERTIES.SUSTAINABILITY_GOAL]: userProfile.sustainability_goal,
            [USER_PROPERTIES.LAST_ACTIVE]: new Date().toISOString()
          });
        }
      } else {
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

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.error('❌ No user logged in for profile update');
      return { error: 'No user logged in' };
    }

    console.log('🔄 Starting profile update...', { userId: user.id, updates });
    setLoading(true);
    
    try {
      const result = await AuthService.updateUserProfile(user.id, updates);
      
      if (!result.error && result.profile) {
        console.log('✅ Profile update successful, updating context immediately:', result.profile);
        
        // Force immediate state update
        setProfile(result.profile);
        
        // Force a re-render by updating loading state
        setLoading(false);
        
        // Double-check the profile was set and force a context refresh
        setTimeout(async () => {
          console.log('🔍 Profile context check after update:', result.profile);
          
          // Force refresh the profile from database to ensure it's current
          try {
            const freshProfile = await AuthService.getUserProfile(user.id);
            if (freshProfile) {
              console.log('🔄 Refreshing profile context with fresh data:', freshProfile);
              setProfile(freshProfile);
            }
          } catch (error) {
            console.error('❌ Error refreshing profile:', error);
          }
        }, 100);
        
        return { error: null };
      } else {
        console.error('❌ Failed to update profile:', result.error);
        return { error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Profile update exception:', error);
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



