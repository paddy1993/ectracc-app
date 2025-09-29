const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../config/mongodb');
const Joi = require('joi');

// Validation schema for beta signup
const betaSignupSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(100).required(),
  source: Joi.string().max(50).optional(),
  timestamp: Joi.date().default(Date.now)
});

/**
 * POST /api/beta/signup
 * Handle beta signup form submissions
 */
router.post('/signup', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = betaSignupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { email, name, source = 'landing-page' } = value;

    // Get database connection
    const db = getMongoDb();
    const betaSignups = db.collection('beta_signups');

    // Check if email already exists
    const existingSignup = await betaSignups.findOne({ email });
    if (existingSignup) {
      return res.status(200).json({
        success: true,
        message: 'You\'re already on the beta list!',
        data: {
          email,
          signupDate: existingSignup.createdAt
        }
      });
    }

    // Create new beta signup
    const betaSignup = {
      email,
      name,
      source,
      status: 'pending', // pending, invited, active
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        referrer: req.headers.referer
      }
    };

    // Insert into database
    const result = await betaSignups.insertOne(betaSignup);

    // TODO: Send welcome email (integrate with email service)
    // await sendWelcomeEmail(email, name);

    // TODO: Add to email marketing list (Mailchimp, ConvertKit, etc.)
    // await addToEmailList(email, name);

    console.log(`New beta signup: ${email} (${name})`);

    res.status(201).json({
      success: true,
      message: 'Successfully joined the beta waitlist!',
      data: {
        email,
        name,
        signupId: result.insertedId,
        position: await betaSignups.countDocuments() // Rough position in queue
      }
    });

  } catch (error) {
    console.error('Beta signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Unable to process signup. Please try again.'
    });
  }
});

/**
 * GET /api/beta/stats
 * Get beta signup statistics (for admin/analytics)
 */
router.get('/stats', async (req, res) => {
  try {
    const db = getMongoDb();
    const betaSignups = db.collection('beta_signups');

    const stats = await betaSignups.aggregate([
      {
        $group: {
          _id: null,
          totalSignups: { $sum: 1 },
          pendingSignups: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          invitedSignups: {
            $sum: { $cond: [{ $eq: ['$status', 'invited'] }, 1, 0] }
          },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const recentSignups = await betaSignups
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .project({ email: 1, name: 1, createdAt: 1, source: 1 })
      .toArray();

    const signupsBySource = await betaSignups.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    const signupsByDay = await betaSignups.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]).toArray();

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalSignups: 0,
          pendingSignups: 0,
          invitedSignups: 0,
          activeUsers: 0
        },
        recentSignups,
        signupsBySource,
        signupsByDay,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Beta stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch beta statistics'
    });
  }
});

/**
 * GET /api/beta/export
 * Export beta signups (CSV format for email marketing)
 */
router.get('/export', async (req, res) => {
  try {
    const db = getMongoDb();
    const betaSignups = db.collection('beta_signups');

    const signups = await betaSignups
      .find({})
      .sort({ createdAt: -1 })
      .project({ email: 1, name: 1, createdAt: 1, source: 1, status: 1 })
      .toArray();

    // Generate CSV
    const csvHeaders = 'Email,Name,Signup Date,Source,Status\n';
    const csvRows = signups.map(signup => {
      const date = signup.createdAt.toISOString().split('T')[0];
      return `${signup.email},"${signup.name}",${date},${signup.source},${signup.status}`;
    }).join('\n');

    const csvContent = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ectracc-beta-signups.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('Beta export error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to export beta signups'
    });
  }
});

/**
 * PUT /api/beta/invite/:email
 * Update signup status (for admin use)
 */
router.put('/invite/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.body;

    if (!['pending', 'invited', 'active'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, invited, or active'
      });
    }

    const db = getMongoDb();
    const betaSignups = db.collection('beta_signups');

    const result = await betaSignups.updateOne(
      { email },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found in beta signups'
      });
    }

    res.json({
      success: true,
      message: `Status updated to ${status} for ${email}`,
      data: { email, status }
    });

  } catch (error) {
    console.error('Beta invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update signup status'
    });
  }
});

module.exports = router;
