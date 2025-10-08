// Base Components API Routes
const express = require('express');
const router = express.Router();
const BaseComponent = require('../models/BaseComponent');
const AdminUser = require('../models/AdminUser');

// Middleware to check admin permissions
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const isAdmin = await AdminUser.isAdmin(userId);
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during admin check' 
    });
  }
};

// GET /api/base-components - Get all base components
router.get('/', async (req, res) => {
  try {
    const components = await BaseComponent.getAll();
    
    res.json({
      success: true,
      data: components,
      total: components.length
    });
  } catch (error) {
    console.error('Error getting base components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get base components'
    });
  }
});

// GET /api/base-components/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await BaseComponent.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// GET /api/base-components/category/:category - Get components by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const components = await BaseComponent.getByCategory(category);
    
    res.json({
      success: true,
      data: components,
      total: components.length,
      category
    });
  } catch (error) {
    console.error('Error getting components by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get components by category'
    });
  }
});

// GET /api/base-components/search - Search base components
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    const components = await BaseComponent.search(q);
    
    res.json({
      success: true,
      data: components,
      total: components.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching base components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search base components'
    });
  }
});

// GET /api/base-components/:id - Get component by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await BaseComponent.getById(id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Base component not found'
      });
    }
    
    res.json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Error getting base component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get base component'
    });
  }
});

// POST /api/base-components - Create new base component (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, category, carbon_footprint, unit, source, description } = req.body;
    
    // Validate required fields
    if (!name || !category || !carbon_footprint || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, category, carbon_footprint, unit'
      });
    }
    
    const componentData = {
      name,
      category,
      carbon_footprint: parseFloat(carbon_footprint),
      unit,
      source: source || 'Manual entry',
      description: description || null
    };
    
    const component = await BaseComponent.create(componentData);
    
    res.status(201).json({
      success: true,
      data: component,
      message: 'Base component created successfully'
    });
  } catch (error) {
    console.error('Error creating base component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create base component'
    });
  }
});

// PUT /api/base-components/:id - Update base component (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Convert carbon_footprint to number if provided
    if (updateData.carbon_footprint) {
      updateData.carbon_footprint = parseFloat(updateData.carbon_footprint);
    }
    
    const component = await BaseComponent.update(id, updateData);
    
    res.json({
      success: true,
      data: component,
      message: 'Base component updated successfully'
    });
  } catch (error) {
    console.error('Error updating base component:', error);
    
    if (error.message === 'Base component not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update base component'
    });
  }
});

// DELETE /api/base-components/:id - Delete base component (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await BaseComponent.delete(id);
    
    res.json({
      success: true,
      message: 'Base component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting base component:', error);
    
    if (error.message === 'Base component not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete base component'
    });
  }
});

// GET /api/base-components/admin/stats - Get statistics (Admin only)
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await BaseComponent.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting base components stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

module.exports = router;
