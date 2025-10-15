const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
);

// Validation schemas
const profileUpdateSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 1 character',
      'string.max': 'Full name must not exceed 100 characters',
      'string.pattern.base': 'Full name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  avatar_url: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'Avatar URL must be a valid URL'
    })
});

// Standardized error response helper
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

// Standardized success response helper
const sendSuccessResponse = (res, data, message = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.json(response);
};

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
      return sendErrorResponse(res, 500, 'Failed to fetch user profile', error.message);
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
    const responseData = {
      user: {
        id: req.user.id,
        email: req.user.email,
        email_confirmed_at: req.user.email_confirmed_at,
        created_at: req.user.created_at,
        updated_at: req.user.updated_at,
        last_sign_in_at: req.user.last_sign_in_at
      },
      profile: profile || null
    };

    const duration = Date.now() - startTime;
    console.log(`✅ [PROFILE GET] Successfully fetched profile for user ${userId} in ${duration}ms`);
    return sendSuccessResponse(res, responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PROFILE GET] Error getting user profile for ${userId} after ${duration}ms:`, error);
    return sendErrorResponse(res, 500, 'Failed to get user profile', error.message);
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;

  console.log(`🔄 [PROFILE UPDATE] Starting profile update for user: ${userId}`);
  console.log(`📝 [PROFILE UPDATE] Request data:`, {
    full_name: req.body.full_name,
    has_avatar_url: !!req.body.avatar_url
  });

  try {
    // Validate request body
    const { error: validationError, value: validatedData } = profileUpdateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const errorMessages = validationError.details.map(detail => detail.message);
      console.log(`❌ [PROFILE UPDATE] Validation failed:`, errorMessages);
      return sendErrorResponse(res, 400, 'Validation failed', errorMessages);
    }

    const { full_name, avatar_url } = validatedData;

    const profileData = {
      user_id: userId,
      full_name: full_name,
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
      return sendErrorResponse(res, 500, 'Failed to check existing profile', checkError.message);
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
      return sendErrorResponse(res, 500, 'Failed to save profile', result.error.message);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [PROFILE UPDATE] Successfully ${profileExists ? 'updated' : 'created'} profile for user ${userId} in ${duration}ms`);
    console.log(`📋 [PROFILE UPDATE] Final profile data:`, result.data);

    return sendSuccessResponse(res, { profile: result.data }, `Profile ${profileExists ? 'updated' : 'created'} successfully`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PROFILE UPDATE] Error updating user profile for ${userId} after ${duration}ms:`, error);
    console.error(`❌ [PROFILE UPDATE] Error details:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    return sendErrorResponse(res, 500, 'Failed to update user profile', error.message);
  }
});

module.exports = router;



