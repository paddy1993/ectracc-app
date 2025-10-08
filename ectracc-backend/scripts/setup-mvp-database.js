// Setup script for MVP database collections and indexes
const { MongoClient } = require('mongodb');

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patrickahern93_db_user:MxRIg6Jop0nK6qay@cluster0.wxqzvqa.mongodb.net/ectracc?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = process.env.DATABASE_NAME || 'ectracc';

async function setupMVPDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    
    // Create collections if they don't exist
    console.log('📁 Creating collections...');
    
    // Base Components Collection
    const baseComponents = db.collection('base_components');
    await baseComponents.createIndex({ category: 1, name: 1 });
    await baseComponents.createIndex({ name: 1 });
    await baseComponents.createIndex({ category: 1 });
    console.log('✅ Base components collection and indexes created');
    
    // User Footprints Collection
    const userFootprints = db.collection('user_footprints');
    await userFootprints.createIndex({ user_id: 1, date_added: -1 });
    await userFootprints.createIndex({ user_id: 1, product_id: 1 });
    await userFootprints.createIndex({ date_added: -1 });
    console.log('✅ User footprints collection and indexes created');
    
    // User Submissions Collection (for future use)
    const userSubmissions = db.collection('user_submissions');
    await userSubmissions.createIndex({ status: 1, submitted_at: -1 });
    await userSubmissions.createIndex({ user_id: 1, status: 1 });
    await userSubmissions.createIndex({ submission_type: 1, status: 1 });
    console.log('✅ User submissions collection and indexes created');
    
    // Admin Users Collection (for future use)
    const adminUsers = db.collection('admin_users');
    await adminUsers.createIndex({ user_id: 1 }, { unique: true });
    await adminUsers.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Admin users collection and indexes created');
    
    // Update existing products collection with new indexes for source fields
    const products = db.collection('products');
    await products.createIndex({ carbon_footprint_source: 1 });
    await products.createIndex({ has_barcode: 1 });
    await products.createIndex({ is_base_component: 1 });
    console.log('✅ Products collection updated with new indexes');
    
    console.log('\n🎉 MVP Database setup completed successfully!');
    
    // Display collection stats
    console.log('\n📊 Collection Statistics:');
    const collections = ['products', 'base_components', 'user_footprints', 'user_submissions', 'admin_users'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`   • ${collectionName}: ${count.toLocaleString()} documents`);
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the setup
setupMVPDatabase().catch(console.error);
