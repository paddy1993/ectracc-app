const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../config/mongodb');
const Joi = require('joi');

// Validation schemas
const feedbackSchema = Joi.object({
  type: Joi.string().valid('bug', 'feature', 'general', 'rating', 'survey').required(),
  rating: Joi.number().min(1).max(5).when('type', { is: 'rating', then: Joi.required() }),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().valid('app', 'scanner', 'data', 'ui', 'performance', 'other').optional(),
  user_email: Joi.string().email().optional(),
  user_name: Joi.string().min(1).max(100).optional(),
  device_info: Joi.object({
    platform: Joi.string(),
    version: Joi.string(),
    user_agent: Joi.string()
  }).optional(),
  screenshot_url: Joi.string().uri().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

const surveyResponseSchema = Joi.object({
  survey_id: Joi.string().required(),
  responses: Joi.object().required(),
  user_id: Joi.string().optional(),
  session_id: Joi.string().optional(),
  completion_time: Joi.number().optional()
});

/**
 * POST /api/feedback/submit
 * Submit user feedback
 */
router.post('/submit', async (req, res) => {
  try {
    // Validate feedback data
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const feedbackData = {
      ...value,
      status: 'open', // open, in_progress, resolved, closed
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      created_at: new Date(),
      updated_at: new Date(),
      votes: 0,
      admin_notes: []
    };

    const db = getMongoDb();
    const feedback = db.collection('feedback');

    const result = await feedback.insertOne(feedbackData);

    // TODO: Send notification to admin/team
    // TODO: Auto-categorize feedback using AI/ML
    // TODO: Check for similar existing feedback

    console.log(`New feedback submitted: ${value.type} - ${value.title}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback_id: result.insertedId,
        type: value.type,
        title: value.title,
        status: 'received'
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

/**
 * POST /api/feedback/survey
 * Submit survey response
 */
router.post('/survey', async (req, res) => {
  try {
    const { error, value } = surveyResponseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const surveyData = {
      ...value,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      submitted_at: new Date()
    };

    const db = getMongoDb();
    const surveys = db.collection('survey_responses');

    await surveys.insertOne(surveyData);

    res.json({
      success: true,
      message: 'Survey response recorded',
      survey_id: value.survey_id
    });

  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit survey response'
    });
  }
});

/**
 * GET /api/feedback/public
 * Get public feedback for community voting
 */
router.get('/public', async (req, res) => {
  try {
    const { type = 'feature', status = 'open', limit = 20, skip = 0 } = req.query;

    const db = getMongoDb();
    const feedback = db.collection('feedback');

    const query = {
      type: type,
      status: status,
      // Only show feedback that user allowed to be public
      'privacy.allow_public_display': { $ne: false }
    };

    const results = await feedback
      .find(query)
      .sort({ votes: -1, created_at: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .project({
        _id: 1,
        type: 1,
        title: 1,
        description: 1,
        category: 1,
        votes: 1,
        status: 1,
        created_at: 1,
        // Hide sensitive information
        user_email: 0,
        ip_address: 0,
        user_agent: 0,
        admin_notes: 0
      })
      .toArray();

    const total = await feedback.countDocuments(query);

    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        has_more: (parseInt(skip) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Public feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public feedback'
    });
  }
});

/**
 * POST /api/feedback/vote/:id
 * Vote on feedback (upvote feature requests)
 */
router.post('/vote/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    const db = getMongoDb();
    const feedback = db.collection('feedback');
    const votes = db.collection('feedback_votes');

    // Check if user has already voted (by IP for anonymous users)
    const existingVote = await votes.findOne({
      feedback_id: id,
      ip_address: req.ip
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted on this feedback'
      });
    }

    // Record the vote
    await votes.insertOne({
      feedback_id: id,
      vote_type: vote,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      created_at: new Date()
    });

    // Update feedback vote count
    const increment = vote === 'up' ? 1 : -1;
    const result = await feedback.updateOne(
      { _id: id },
      { 
        $inc: { votes: increment },
        $set: { updated_at: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: `Vote ${vote} recorded`,
      vote_type: vote
    });

  } catch (error) {
    console.error('Feedback vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record vote'
    });
  }
});

/**
 * GET /api/feedback/admin/dashboard
 * Admin dashboard for feedback management
 */
router.get('/admin/dashboard', async (req, res) => {
  try {
    const db = getMongoDb();
    const feedback = db.collection('feedback');

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Aggregate feedback statistics
    const [
      totalFeedback,
      feedbackByType,
      feedbackByStatus,
      recentFeedback,
      topVoted,
      feedbackTrends
    ] = await Promise.all([
      // Total feedback count
      feedback.countDocuments({
        created_at: { $gte: startDate }
      }),

      // Feedback by type
      feedback.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avg_rating: { $avg: '$rating' }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray(),

      // Feedback by status
      feedback.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Recent feedback
      feedback.find({
        created_at: { $gte: startDate }
      })
      .sort({ created_at: -1 })
      .limit(10)
      .project({
        type: 1,
        title: 1,
        category: 1,
        rating: 1,
        status: 1,
        votes: 1,
        created_at: 1,
        user_email: 1
      })
      .toArray(),

      // Top voted feedback
      feedback.find({
        created_at: { $gte: startDate },
        votes: { $gt: 0 }
      })
      .sort({ votes: -1 })
      .limit(10)
      .project({
        type: 1,
        title: 1,
        description: 1,
        votes: 1,
        status: 1,
        created_at: 1
      })
      .toArray(),

      // Feedback trends by day
      feedback.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$created_at'
              }
            },
            count: { $sum: 1 },
            bugs: {
              $sum: { $cond: [{ $eq: ['$type', 'bug'] }, 1, 0] }
            },
            features: {
              $sum: { $cond: [{ $eq: ['$type', 'feature'] }, 1, 0] }
            },
            ratings: {
              $sum: { $cond: [{ $eq: ['$type', 'rating'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total_feedback: totalFeedback,
          date_range: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
            days: parseInt(days)
          }
        },
        breakdown: {
          by_type: feedbackByType,
          by_status: feedbackByStatus
        },
        recent_feedback: recentFeedback,
        top_voted: topVoted,
        trends: feedbackTrends,
        last_updated: new Date()
      }
    });

  } catch (error) {
    console.error('Feedback dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback dashboard'
    });
  }
});

/**
 * PUT /api/feedback/admin/:id/status
 * Update feedback status (admin only)
 */
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const db = getMongoDb();
    const feedback = db.collection('feedback');

    const updateData = {
      status,
      updated_at: new Date()
    };

    if (admin_note) {
      updateData.$push = {
        admin_notes: {
          note: admin_note,
          created_at: new Date(),
          admin_id: 'system' // TODO: Add proper admin authentication
        }
      };
    }

    const result = await feedback.updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // TODO: Send notification to user if they provided email
    // TODO: Update related analytics

    res.json({
      success: true,
      message: 'Feedback status updated',
      status: status
    });

  } catch (error) {
    console.error('Feedback status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback status'
    });
  }
});

/**
 * GET /api/feedback/surveys/active
 * Get active surveys for users
 */
router.get('/surveys/active', async (req, res) => {
  try {
    // This would typically come from a surveys collection
    // For now, return a sample survey structure
    const activeSurveys = [
      {
        id: 'beta_feedback_2025',
        title: 'ECTRACC Beta Experience',
        description: 'Help us improve ECTRACC with your feedback',
        type: 'beta_feedback',
        active: true,
        questions: [
          {
            id: 'overall_rating',
            type: 'rating',
            question: 'How would you rate your overall experience with ECTRACC?',
            scale: 5,
            required: true
          },
          {
            id: 'most_useful_feature',
            type: 'multiple_choice',
            question: 'Which feature do you find most useful?',
            options: [
              'Barcode scanning',
              'Carbon footprint tracking',
              'Product search',
              'Eco-score ratings',
              'Goal setting'
            ],
            required: true
          },
          {
            id: 'improvement_suggestions',
            type: 'text',
            question: 'What would you like to see improved?',
            required: false
          },
          {
            id: 'recommend_likelihood',
            type: 'rating',
            question: 'How likely are you to recommend ECTRACC to a friend?',
            scale: 10,
            required: true
          }
        ],
        target_audience: 'beta_users',
        max_responses: 1000,
        expires_at: new Date('2025-12-31')
      }
    ];

    res.json({
      success: true,
      data: activeSurveys
    });

  } catch (error) {
    console.error('Active surveys error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active surveys'
    });
  }
});

module.exports = router;
