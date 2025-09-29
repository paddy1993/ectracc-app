const { createClient } = require('@supabase/supabase-js');
const { connectMongoDB: connectMongoAtlas, mongoHealthCheck } = require('./mongodb');

// MongoDB Atlas connection using our new module
let mongoConnected = false;

const connectMongoDB = async () => {
  try {
    console.log('📦 Connecting to MongoDB Atlas...');
    await connectMongoAtlas();
    mongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.log('⚠️ MongoDB Atlas connection failed:', error.message);
    console.log('📝 Using test data mode for development');
    mongoConnected = false;
    return false;
  }
};

const getMongoDb = () => {
  return mongoConnected;
};

// Supabase connection (placeholder for Phase 1)
let supabase;

const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('🔐 Initializing Supabase...');
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    console.log('⚠️ Supabase not configured - using placeholder mode');
    console.log('📝 Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables to enable Supabase');
    return;
  }
  
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false // Server-side doesn't need session persistence
      }
    });
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
  }
};

const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Using placeholder for Phase 1.');
  }
  return supabase;
};

module.exports = {
  connectMongoDB,
  getMongoDb,
  initializeSupabase,
  getSupabase
};
