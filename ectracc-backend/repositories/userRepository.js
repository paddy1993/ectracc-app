// User Repository - Data access for users and profiles
const { getSupabase } = require('../config/database');

class UserRepository {
  /**
   * Get user profile by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<object|null>} User profile
   */
  async getProfile(userId) {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[UserRepository] Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Create user profile
   * @param {object} profileData - Profile data
   * @returns {Promise<object>} Created profile
   */
  async createProfile(profileData) {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[UserRepository] Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User UUID
   * @param {object} updates - Profile updates
   * @returns {Promise<object>} Updated profile
   */
  async updateProfile(userId, updates) {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[UserRepository] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Get user by auth token
   * @param {string} token - JWT token
   * @returns {Promise<object|null>} User object
   */
  async getUserByToken(token) {
    try {
      const supabase = getSupabase();
      
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) throw error;

      return user;
    } catch (error) {
      console.error('[UserRepository] Error getting user by token:', error);
      return null;
    }
  }

  /**
   * Check if profile exists
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if exists
   */
  async profileExists(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile !== null;
    } catch (error) {
      console.error('[UserRepository] Error checking profile existence:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new UserRepository();

