const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../config/mongodb');
const Joi = require('joi');

// Validation schema for analytics events
const analyticsEventSchema = Joi.object({
  event_name: Joi.string().required(),
  event_category: Joi.string().optional(),
  event_label: Joi.string().optional(),
  value: Joi.number().optional(),
  custom_parameters: Joi.object().optional(),
  session_id: Joi.string().required(),
  user_id: Joi.string().optional(),
  timestamp: Joi.number().required(),
  page_url: Joi.string().uri().optional(),
  user_agent: Joi.string().optional(),
  referrer: Joi.string().optional()
});

/**
 * POST /api/analytics/init
 * Initialize analytics session
 */
router.post('/init', async (req, res) => {
  try {
    const { session_id, timestamp, user_agent, referrer, page_url } = req.body;

    if (!session_id || !timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session_id, timestamp'
      });
    }

    const db = getMongoDb();
    const sessions = db.collection('analytics_sessions');

    const session = {
      session_id,
      timestamp,
      user_agent,
      referrer,
      page_url,
      ip_address: req.ip,
      created_at: new Date(),
      events_count: 0,
      last_activity: new Date()
    };

    await sessions.insertOne(session);

    res.json({
      success: true,
      message: 'Analytics session initialized',
      session_id
    });

  } catch (error) {
    console.error('Analytics init error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize analytics session'
    });
  }
});

/**
 * POST /api/analytics/event
 * Track analytics events
 */
router.post('/event', async (req, res) => {
  try {
    // Validate event data
    const { error, value } = analyticsEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const eventData = {
      ...value,
      ip_address: req.ip,
      created_at: new Date()
    };

    const db = getMongoDb();
    const events = db.collection('analytics_events');
    const sessions = db.collection('analytics_sessions');

    // Insert event
    await events.insertOne(eventData);

    // Update session activity
    await sessions.updateOne(
      { session_id: value.session_id },
      {
        $inc: { events_count: 1 },
        $set: { last_activity: new Date() }
      }
    );

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Analytics event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const db = getMongoDb();
    const events = db.collection('analytics_events');
    const sessions = db.collection('analytics_sessions');

    // Date range filter
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Parallel aggregation queries
    const [
      totalEvents,
      uniqueSessions,
      topEvents,
      eventsByDay,
      topPages,
      userJourney,
      performanceMetrics
    ] = await Promise.all([
      // Total events
      events.countDocuments({
        created_at: { $gte: startDate }
      }),

      // Unique sessions
      sessions.countDocuments({
        created_at: { $gte: startDate }
      }),

      // Top events
      events.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: '$event_name',
            count: { $sum: 1 },
            category: { $first: '$event_category' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),

      // Events by day
      events.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$created_at'
              }
            },
            events: { $sum: 1 },
            sessions: { $addToSet: '$session_id' }
          }
        },
        {
          $project: {
            date: '$_id',
            events: 1,
            unique_sessions: { $size: '$sessions' }
          }
        },
        { $sort: { date: 1 } }
      ]).toArray(),

      // Top pages
      events.aggregate([
        { 
          $match: { 
            created_at: { $gte: startDate },
            page_url: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$page_url',
            visits: { $sum: 1 },
            unique_sessions: { $addToSet: '$session_id' }
          }
        },
        {
          $project: {
            page_url: '$_id',
            visits: 1,
            unique_visitors: { $size: '$unique_sessions' }
          }
        },
        { $sort: { visits: -1 } },
        { $limit: 10 }
      ]).toArray(),

      // User journey (most common event sequences)
      events.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { $sort: { session_id: 1, timestamp: 1 } },
        {
          $group: {
            _id: '$session_id',
            events: { $push: '$event_name' }
          }
        },
        {
          $project: {
            journey: { $slice: ['$events', 5] } // First 5 events
          }
        },
        {
          $group: {
            _id: '$journey',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),

      // Performance metrics
      events.aggregate([
        {
          $match: {
            created_at: { $gte: startDate },
            event_name: 'performance_metric'
          }
        },
        {
          $group: {
            _id: '$custom_parameters.metric_name',
            avg_value: { $avg: '$value' },
            min_value: { $min: '$value' },
            max_value: { $max: '$value' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);

    // Calculate derived metrics
    const avgEventsPerSession = uniqueSessions > 0 ? totalEvents / uniqueSessions : 0;
    const activeDays = eventsByDay.length;

    res.json({
      success: true,
      data: {
        overview: {
          total_events: totalEvents,
          unique_sessions: uniqueSessions,
          avg_events_per_session: Math.round(avgEventsPerSession * 10) / 10,
          active_days: activeDays,
          date_range: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
            days: parseInt(days)
          }
        },
        top_events: topEvents,
        timeline: eventsByDay,
        top_pages: topPages,
        user_journey: userJourney,
        performance_metrics: performanceMetrics,
        last_updated: new Date()
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics dashboard'
    });
  }
});

/**
 * GET /api/analytics/product-insights
 * Get product-specific analytics insights
 */
router.get('/product-insights', async (req, res) => {
  try {
    const db = getMongoDb();
    const events = db.collection('analytics_events');

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Product-specific analytics
    const [
      scanStats,
      searchStats,
      carbonFootprintViews,
      popularCategories,
      ecoScoreDistribution
    ] = await Promise.all([
      // Barcode scan statistics
      events.aggregate([
        {
          $match: {
            created_at: { $gte: startDate },
            event_name: 'barcode_scan'
          }
        },
        {
          $group: {
            _id: null,
            total_scans: { $sum: 1 },
            successful_scans: {
              $sum: { $cond: [{ $eq: ['$event_label', 'success'] }, 1, 0] }
            },
            products_found: {
              $sum: { $cond: ['$custom_parameters.product_found', 1, 0] }
            }
          }
        }
      ]).toArray(),

      // Search statistics
      events.aggregate([
        {
          $match: {
            created_at: { $gte: startDate },
            event_name: 'search'
          }
        },
        {
          $group: {
            _id: null,
            total_searches: { $sum: 1 },
            avg_results: { $avg: '$custom_parameters.results_count' },
            searches_with_filters: {
              $sum: { $cond: ['$custom_parameters.has_filters', 1, 0] }
            }
          }
        }
      ]).toArray(),

      // Carbon footprint views
      events.aggregate([
        {
          $match: {
            created_at: { $gte: startDate },
            event_name: 'carbon_footprint_view'
          }
        },
        {
          $group: {
            _id: null,
            total_views: { $sum: 1 },
            avg_carbon_value: { $avg: '$custom_parameters.carbon_kg' }
          }
        }
      ]).toArray(),

      // Popular categories
      events.aggregate([
        {
          $match: {
            created_at: { $gte: startDate },
            event_name: 'carbon_footprint_view',
            'custom_parameters.category': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$custom_parameters.category',
            views: { $sum: 1 },
            avg_carbon: { $avg: '$custom_parameters.carbon_kg' }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 10 }
      ]).toArray(),

      // Eco-score distribution
      events.aggregate([
        {
          $match: {
            created_at: { $gte: startDate },
            event_name: 'carbon_footprint_view',
            'custom_parameters.eco_score': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$custom_parameters.eco_score',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray()
    ]);

    res.json({
      success: true,
      data: {
        scan_statistics: scanStats[0] || {
          total_scans: 0,
          successful_scans: 0,
          products_found: 0
        },
        search_statistics: searchStats[0] || {
          total_searches: 0,
          avg_results: 0,
          searches_with_filters: 0
        },
        carbon_footprint_views: carbonFootprintViews[0] || {
          total_views: 0,
          avg_carbon_value: 0
        },
        popular_categories: popularCategories,
        eco_score_distribution: ecoScoreDistribution,
        date_range: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days: parseInt(days)
        }
      }
    });

  } catch (error) {
    console.error('Product insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product insights'
    });
  }
});

/**
 * DELETE /api/analytics/cleanup
 * Clean up old analytics data (GDPR compliance)
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 365 } = req.query; // Default: keep 1 year
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const db = getMongoDb();
    const events = db.collection('analytics_events');
    const sessions = db.collection('analytics_sessions');

    // Delete old events and sessions
    const [eventsResult, sessionsResult] = await Promise.all([
      events.deleteMany({ created_at: { $lt: cutoffDate } }),
      sessions.deleteMany({ created_at: { $lt: cutoffDate } })
    ]);

    res.json({
      success: true,
      message: 'Analytics data cleaned up',
      deleted: {
        events: eventsResult.deletedCount,
        sessions: sessionsResult.deletedCount
      },
      cutoff_date: cutoffDate.toISOString()
    });

  } catch (error) {
    console.error('Analytics cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup analytics data'
    });
  }
});

module.exports = router;
