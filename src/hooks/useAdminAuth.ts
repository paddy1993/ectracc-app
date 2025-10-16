import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [adminState, setAdminState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    error: null
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setAdminState({
          isAdmin: false,
          isLoading: false,
          error: null
        });
        return;
      }

      try {
        console.log('🔍 [ADMIN AUTH] Checking admin status for user:', user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('❌ [ADMIN AUTH] Error checking admin status:', error);
          setAdminState({
            isAdmin: false,
            isLoading: false,
            error: 'Failed to verify admin privileges'
          });
          return;
        }

        const isAdmin = profile?.is_admin === true;
        console.log(`✅ [ADMIN AUTH] Admin status for user ${user.id}: ${isAdmin}`);

        setAdminState({
          isAdmin,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('❌ [ADMIN AUTH] Error in admin check:', error);
        setAdminState({
          isAdmin: false,
          isLoading: false,
          error: 'Failed to verify admin privileges'
        });
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated]);

  return adminState;
};

// Hook for components that require admin access
export const useRequireAdmin = () => {
  const { isAdmin, isLoading, error } = useAdminAuth();
  const { user } = useAuth();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && !isAdmin && isAuthenticated) {
      console.log('❌ [REQUIRE ADMIN] Access denied - user is not an admin');
      // Could redirect to unauthorized page or show error
    }
  }, [isAdmin, isLoading, isAuthenticated]);

  return {
    isAdmin,
    isLoading,
    error,
    hasAccess: isAdmin && isAuthenticated
  };
};
