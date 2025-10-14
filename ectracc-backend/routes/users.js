const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
);

// GET /api/users/profile - Get authenticated user profile
router.get('/profile', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  
  console.log(`📋 [PROFILE GET] Starting profile fetch for user: ${userId}`);
  
  try {
    // Get user profile from Supabase
    console.log(`🔍 [PROFILE GET] Querying profiles table for user_id: ${userId}`);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error(`❌ [PROFILE GET] Supabase error for user ${userId}:`, error);
      throw error;
    }

    const hasProfile = !!profile;
    console.log(`📊 [PROFILE GET] Profile found for user ${userId}: ${hasProfile}`);
    if (hasProfile) {
      console.log(`📋 [PROFILE GET] Profile data:`, {
        display_name: profile.display_name,
        sustainability_goal: profile.sustainability_goal,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
    }

    // Return user data with profile
    const response = {
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          email_confirmed_at: req.user.email_confirmed_at,
          created_at: req.user.created_at,
          updated_at: req.user.updated_at,
          last_sign_in_at: req.user.last_sign_in_at
        },
        profile: profile || null
      }
    };

    const duration = Date.now() - startTime;
    console.log(`✅ [PROFILE GET] Successfully fetched profile for user ${userId} in ${duration}ms`);
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PROFILE GET] Error getting user profile for ${userId} after ${duration}ms:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { display_name, avatar_url, sustainability_goal, country } = req.body;

  console.log(`🔄 [PROFILE UPDATE] Starting profile update for user: ${userId}`);
  console.log(`📝 [PROFILE UPDATE] Request data:`, {
    display_name,
    sustainability_goal,
    country,
    has_avatar_url: !!avatar_url
  });

  try {
    // Validate required fields
    if (!display_name || !display_name.trim()) {
      console.log(`❌ [PROFILE UPDATE] Validation failed: display_name is required`);
      return res.status(400).json({
        success: false,
        error: 'Display name is required'
      });
    }

    const profileData = {
      user_id: userId,
      display_name: display_name.trim(),
      sustainability_goal: sustainability_goal || null,
      country: country || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString()
    };

    console.log(`📊 [PROFILE UPDATE] Prepared profile data:`, profileData);

    // Try to update existing profile, or create new one
    console.log(`🔍 [PROFILE UPDATE] Checking for existing profile for user: ${userId}`);
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('user_id, display_name, created_at')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`❌ [PROFILE UPDATE] Error checking existing profile:`, checkError);
      throw checkError;
    }

    let result;
    const profileExists = !!existingProfile;
    console.log(`📋 [PROFILE UPDATE] Profile exists for user ${userId}: ${profileExists}`);

    if (profileExists) {
      // Update existing profile
      console.log(`🔄 [PROFILE UPDATE] Updating existing profile for user: ${userId}`);
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();
      
      console.log(`📊 [PROFILE UPDATE] Update result:`, {
        success: !result.error,
        error: result.error?.message,
        data_returned: !!result.data
      });
    } else {
      // Create new profile
      profileData.created_at = new Date().toISOString();
      console.log(`➕ [PROFILE UPDATE] Creating new profile for user: ${userId}`);
      result = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      console.log(`📊 [PROFILE UPDATE] Insert result:`, {
        success: !result.error,
        error: result.error?.message,
        data_returned: !!result.data
      });
    }

    if (result.error) {
      console.error(`❌ [PROFILE UPDATE] Supabase operation failed:`, result.error);
      throw result.error;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [PROFILE UPDATE] Successfully ${profileExists ? 'updated' : 'created'} profile for user ${userId} in ${duration}ms`);
    console.log(`📋 [PROFILE UPDATE] Final profile data:`, result.data);

    res.json({
      success: true,
      data: {
        profile: result.data
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PROFILE UPDATE] Error updating user profile for ${userId} after ${duration}ms:`, error);
    console.error(`❌ [PROFILE UPDATE] Error details:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: error.message
    });
  }
});

module.exports = router;



