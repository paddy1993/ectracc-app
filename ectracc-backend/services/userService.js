// User Service - Business logic for user management
const userRepository = require('../repositories/userRepository');
const cacheService = require('./cacheService');

class UserService {
  /**
   * Get user profile with caching
   * @param {string} userId - User UUID
   * @returns {Promise<object|null>} User profile
   */
  async getProfile(userId) {
    try {
      const cacheKey = `user:profile:${userId}`;
      
      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`[UserService] Cache HIT for profile: ${userId}`);
        return cached;
      }

      console.log(`[UserService] Cache MISS for profile: ${userId}`);

      // Get from repository
      const profile = await userRepository.getProfile(userId);
      
      if (!profile) {
        return null;
      }

      // Cache for 10 minutes
      await cacheService.set(cacheKey, profile, 600);

      return profile;
    } catch (error) {
      console.error('[UserService] Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   * @param {string} userId - User UUID
   * @param {object} profileData - Profile data
   * @returns {Promise<object>} User profile
   */
  async upsertProfile(userId, profileData) {
    try {
      // Check if profile exists
      const exists = await userRepository.profileExists(userId);

      let profile;
      if (exists) {
        profile = await userRepository.updateProfile(userId, profileData);
      } else {
        profile = await userRepository.createProfile({
          user_id: userId,
          ...profileData
        });
      }

      // Invalidate cache
      await cacheService.del(`user:profile:${userId}`);

      return profile;
    } catch (error) {
      console.error('[UserService] Error upserting profile:', error);
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
      // Validate profile exists
      const exists = await userRepository.profileExists(userId);
      if (!exists) {
        throw new Error('Profile not found');
      }

      // Update profile
      const profile = await userRepository.updateProfile(userId, updates);

      // Invalidate cache
      await cacheService.del(`user:profile:${userId}`);

      return profile;
    } catch (error) {
      console.error('[UserService] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Get user by auth token
   * @param {string} token - JWT token
   * @returns {Promise<object|null>} User and profile
   */
  async getUserByToken(token) {
    try {
      // Get user from auth
      const user = await userRepository.getUserByToken(token);
      if (!user) {
        return null;
      }

      // Get profile
      const profile = await this.getProfile(user.id);

      return {
        user,
        profile
      };
    } catch (error) {
      console.error('[UserService] Error getting user by token:', error);
      throw error;
    }
  }

  /**
   * Validate profile data
   * @param {object} profileData - Profile data to validate
   * @returns {object} Validation result
   */
  validateProfileData(profileData) {
    const errors = [];

    if (profileData.full_name) {
      if (typeof profileData.full_name !== 'string') {
        errors.push('Full name must be a string');
      } else if (profileData.full_name.length < 1 || profileData.full_name.length > 100) {
        errors.push('Full name must be between 1 and 100 characters');
      } else if (!/^[a-zA-Z\s'-]+$/.test(profileData.full_name)) {
        errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes');
      }
    }

    if (profileData.avatar_url) {
      if (typeof profileData.avatar_url !== 'string') {
        errors.push('Avatar URL must be a string');
      } else {
        try {
          new URL(profileData.avatar_url);
        } catch {
          errors.push('Avatar URL must be a valid URL');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear user cache
   * @param {string} userId - User UUID
   */
  async clearUserCache(userId) {
    try {
      await cacheService.del(`user:profile:${userId}`);
      console.log(`[UserService] Cleared cache for user: ${userId}`);
    } catch (error) {
      console.error('[UserService] Error clearing user cache:', error);
    }
  }
}

// Export singleton instance
module.exports = new UserService();

