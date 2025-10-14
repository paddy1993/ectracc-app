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

// Supabase connection with enhanced error handling
let supabase;
let supabaseConnected = false;

const initializeSupabase = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('🔐 Initializing Supabase...');
  console.log('🔧 Supabase URL configured:', supabaseUrl ? 'YES' : 'NO');
  console.log('🔧 Supabase Key configured:', supabaseKey ? 'YES' : 'NO');
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    console.log('⚠️ Supabase not configured - using placeholder mode');
    console.log('📝 Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables to enable Supabase');
    supabaseConnected = false;
    return false;
  }
  
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false // Server-side doesn't need session persistence
      }
    });
    
    // Test the connection by trying to access the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Supabase connection test failed:', error.message);
      console.log('📝 Make sure the profiles table exists and RLS policies are configured');
      supabaseConnected = false;
      return false;
    }
    
    console.log('✅ Supabase connected and profiles table accessible');
    supabaseConnected = true;
    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    supabaseConnected = false;
    return false;
  }
};

const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Using placeholder for Phase 1.');
  }
  return supabase;
};

const getSupabaseStatus = () => {
  return supabaseConnected;
};

const supabaseHealthCheck = async () => {
  if (!supabase || !supabaseConnected) {
    return {
      status: 'disconnected',
      error: 'Supabase not connected',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }

    return {
      status: 'connected',
      profilesTable: 'accessible',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  connectMongoDB,
  getMongoDb,
  initializeSupabase,
  getSupabase,
  getSupabaseStatus,
  supabaseHealthCheck
};
