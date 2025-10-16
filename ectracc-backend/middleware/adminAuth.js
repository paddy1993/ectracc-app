// Admin Authentication Middleware
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for admin checks
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to require admin privileges
 * Must be used after requireAuth middleware
 */
const requireAdmin = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      console.log('❌ [ADMIN AUTH] No user ID found in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    console.log(`🔍 [ADMIN AUTH] Checking admin status for user: ${userId}`);

    // Check if user has admin privileges
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ [ADMIN AUTH] Error checking admin status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify admin privileges'
      });
    }

    if (!profile) {
      console.log(`❌ [ADMIN AUTH] No profile found for user: ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied: Profile not found'
      });
    }

    if (!profile.is_admin) {
      console.log(`❌ [ADMIN AUTH] User ${userId} is not an admin`);
      return res.status(403).json({
        success: false,
        error: 'Access denied: Admin privileges required'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [ADMIN AUTH] Admin access granted for user ${userId} in ${duration}ms`);

    // Add admin flag to request for use in route handlers
    req.user.isAdmin = true;
    next();

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN AUTH] Error in admin auth middleware after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during admin verification'
    });
  }
};

/**
 * Check if a user is an admin (utility function)
 */
const isUserAdmin = async (userId) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.is_admin === true;
  } catch (error) {
    console.error('Error checking if user is admin:', error);
    return false;
  }
};

/**
 * Get all admin users (utility function)
 */
const getAdminUsers = async () => {
  try {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, created_at')
      .eq('is_admin', true);

    if (error) {
      console.error('Error getting admin users:', error);
      return [];
    }

    return admins || [];
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
};

/**
 * Grant admin privileges to a user
 */
const grantAdminPrivileges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error granting admin privileges:', error);
      throw error;
    }

    console.log(`✅ [ADMIN GRANT] Admin privileges granted to user: ${userId}`);
    return data;
  } catch (error) {
    console.error('Error granting admin privileges:', error);
    throw error;
  }
};

/**
 * Revoke admin privileges from a user
 */
const revokeAdminPrivileges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error revoking admin privileges:', error);
      throw error;
    }

    console.log(`❌ [ADMIN REVOKE] Admin privileges revoked from user: ${userId}`);
    return data;
  } catch (error) {
    console.error('Error revoking admin privileges:', error);
    throw error;
  }
};

module.exports = {
  requireAdmin,
  isUserAdmin,
  getAdminUsers,
  grantAdminPrivileges,
  revokeAdminPrivileges
};
