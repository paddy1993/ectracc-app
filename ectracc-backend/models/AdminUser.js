// Admin User Model for managing admin access
const { getMongoCollection } = require('../config/mongodb');

class AdminUser {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('admin_users');
    }
    return this.collection;
  }

  // Check if user is admin
  async isAdmin(userId) {
    try {
      const admins = this.getCollection();
      const admin = await admins.findOne({ user_id: userId, active: true });
      return !!admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get admin user by user ID
  async getByUserId(userId) {
    try {
      const admins = this.getCollection();
      const admin = await admins.findOne({ user_id: userId });
      
      if (admin) {
        return this.formatAdmin(admin);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting admin by user ID:', error);
      throw error;
    }
  }

  // Get admin user by email
  async getByEmail(email) {
    try {
      const admins = this.getCollection();
      const admin = await admins.findOne({ email: email.toLowerCase() });
      
      if (admin) {
        return this.formatAdmin(admin);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting admin by email:', error);
      throw error;
    }
  }

  // Create new admin user
  async create(adminData) {
    try {
      const admins = this.getCollection();
      const admin = {
        user_id: adminData.user_id,
        email: adminData.email.toLowerCase(),
        name: adminData.name,
        role: adminData.role || 'admin', // admin, super_admin
        permissions: adminData.permissions || [
          'review_submissions',
          'manage_products',
          'manage_base_components'
        ],
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminData.created_by || null
      };
      
      const result = await admins.insertOne(admin);
      return this.formatAdmin({ ...admin, _id: result.insertedId });
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  // Update admin user
  async update(userId, updateData) {
    try {
      const admins = this.getCollection();
      const result = await admins.updateOne(
        { user_id: userId },
        { 
          $set: {
            ...updateData,
            updated_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Admin user not found');
      }
      
      return await this.getByUserId(userId);
    } catch (error) {
      console.error('Error updating admin user:', error);
      throw error;
    }
  }

  // Deactivate admin user
  async deactivate(userId) {
    try {
      const admins = this.getCollection();
      const result = await admins.updateOne(
        { user_id: userId },
        { 
          $set: {
            active: false,
            updated_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Admin user not found');
      }
      
      return true;
    } catch (error) {
      console.error('Error deactivating admin user:', error);
      throw error;
    }
  }

  // Get all admin users
  async getAll() {
    try {
      const admins = this.getCollection();
      const results = await admins.find({}).sort({ created_at: -1 }).toArray();
      return results.map(admin => this.formatAdmin(admin));
    } catch (error) {
      console.error('Error getting all admin users:', error);
      throw error;
    }
  }

  // Check if user has specific permission
  async hasPermission(userId, permission) {
    try {
      const admin = await this.getByUserId(userId);
      if (!admin || !admin.active) {
        return false;
      }
      
      // Super admins have all permissions
      if (admin.role === 'super_admin') {
        return true;
      }
      
      return admin.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Initialize first admin (for setup)
  async initializeFirstAdmin(userData) {
    try {
      const admins = this.getCollection();
      
      // Check if any admins exist
      const existingAdminCount = await admins.countDocuments();
      if (existingAdminCount > 0) {
        throw new Error('Admin users already exist. Use regular create method.');
      }
      
      const firstAdmin = {
        user_id: userData.user_id,
        email: userData.email.toLowerCase(),
        name: userData.name,
        role: 'super_admin',
        permissions: [
          'review_submissions',
          'manage_products',
          'manage_base_components',
          'manage_admins',
          'view_analytics',
          'manage_users'
        ],
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system'
      };
      
      const result = await admins.insertOne(firstAdmin);
      console.log('✅ First admin user created successfully');
      return this.formatAdmin({ ...firstAdmin, _id: result.insertedId });
    } catch (error) {
      console.error('Error initializing first admin:', error);
      throw error;
    }
  }

  // Format admin for API response
  formatAdmin(admin) {
    if (!admin) return null;

    return {
      id: admin._id,
      user_id: admin.user_id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      active: admin.active,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      created_by: admin.created_by
    };
  }

  // Create indexes for the collection
  async createIndexes() {
    try {
      const admins = this.getCollection();
      
      // Create indexes for efficient querying
      await admins.createIndex({ user_id: 1 }, { unique: true });
      await admins.createIndex({ email: 1 }, { unique: true });
      await admins.createIndex({ active: 1 });
      
      console.log('✅ Admin users indexes created');
    } catch (error) {
      console.error('Error creating admin users indexes:', error);
      throw error;
    }
  }

  // Get statistics
  async getStats() {
    try {
      const admins = this.getCollection();
      
      const totalAdmins = await admins.countDocuments();
      const activeAdmins = await admins.countDocuments({ active: true });
      const superAdmins = await admins.countDocuments({ role: 'super_admin', active: true });
      
      return {
        totalAdmins,
        activeAdmins,
        superAdmins,
        regularAdmins: activeAdmins - superAdmins
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }
}

module.exports = new AdminUser();
