import mixpanel from 'mixpanel-browser';
import logger from '../utils/logger';

// Analytics configuration
const MIXPANEL_TOKEN = process.env.REACT_APP_MIXPANEL_TOKEN;
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Mixpanel
if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: isDevelopment,
    track_pageview: true,
    persistence: 'localStorage',
    api_host: 'https://api-eu.mixpanel.com',
    ignore_dnt: false,
    secure_cookie: true,
    cross_subdomain_cookie: false,
    batch_requests: true,
    batch_size: 50,
    batch_flush_interval_ms: 5000,
    autocapture: true, // Enable autocapture as per Mixpanel instructions
    record_sessions_percent: 100 // Enable session recording
  });
  logger.log('🔍 Mixpanel initialized with token:', MIXPANEL_TOKEN?.substring(0, 8) + '...');
} else {
  logger.warn('Mixpanel token not found. Analytics tracking disabled.');
}

// Event names - centralized for consistency
export const EVENTS = {
  // Authentication
  USER_SIGNED_UP: 'User Signed Up',
  USER_SIGNED_IN: 'User Signed In',
  USER_SIGNED_OUT: 'User Signed Out',
  PROFILE_COMPLETED: 'Profile Setup Completed',
  
  // Product Tracking
  PRODUCT_SEARCHED: 'Product Searched',
  PRODUCT_VIEWED: 'Product Viewed',
  PRODUCT_ADDED_TO_FOOTPRINT: 'Product Added to Footprint',
  PRODUCT_DELETED_FROM_FOOTPRINT: 'Product Deleted from Footprint',
  
  // Navigation
  PAGE_VIEWED: 'Page Viewed',
  DASHBOARD_VIEWED: 'Dashboard Viewed',
  HISTORY_VIEWED: 'History Viewed',
  PRODUCTS_PAGE_VIEWED: 'Products Page Viewed',
  PROFILE_PAGE_VIEWED: 'Profile Page Viewed',
  GOALS_PAGE_VIEWED: 'Goals Page Viewed',
  
  // Engagement
  QUICK_ACTION_CLICKED: 'Quick Action Clicked',
  FILTER_APPLIED: 'Filter Applied',
  TIME_FILTER_CHANGED: 'Time Filter Changed',
  GOAL_CREATED: 'Goal Created',
  GOAL_UPDATED: 'Goal Updated',
  
  // App Usage
  APP_OPENED: 'App Opened',
  SESSION_STARTED: 'Session Started',
  FEATURE_USED: 'Feature Used',
  ERROR_ENCOUNTERED: 'Error Encountered'
} as const;

// User properties
export const USER_PROPERTIES = {
  SUSTAINABILITY_GOAL: 'Sustainability Goal',
  DISPLAY_NAME: 'Display Name',
  SIGNUP_DATE: 'Signup Date',
  TOTAL_PRODUCTS_TRACKED: 'Total Products Tracked',
  TOTAL_CARBON_FOOTPRINT: 'Total Carbon Footprint',
  PREFERRED_CATEGORIES: 'Preferred Categories',
  LAST_ACTIVE: 'Last Active',
  USER_SEGMENT: 'User Segment'
} as const;

class AnalyticsService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!MIXPANEL_TOKEN;
    
    if (this.isEnabled) {
      logger.log('🔍 Analytics tracking enabled');
    } else {
      logger.log('🔍 Analytics tracking disabled - missing token');
    }
  }

  // Track events
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      logger.log(`📊 [Analytics] ${eventName}`, properties);
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        is_mobile: window.innerWidth <= 768
      };

      mixpanel.track(eventName, enrichedProperties);
      logger.log(`📊 [Analytics] ${eventName}`, enrichedProperties);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Track page views
  trackPageView(pageName: string, additionalProperties?: Record<string, any>) {
    this.track(EVENTS.PAGE_VIEWED, {
      page_name: pageName,
      page_url: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      ...additionalProperties
    });
  }

  // Set tracking consent
  setTrackingConsent(consented: boolean) {
    if (!this.isEnabled) return;
    
    try {
      if (consented) {
        mixpanel.opt_in_tracking();
      } else {
        mixpanel.opt_out_tracking();
      }
      logger.log(`📊 [Analytics] Tracking consent: ${consented ? 'granted' : 'denied'}`);
    } catch (error) {
      console.error('Analytics consent error:', error);
    }
  }

  // Check if tracking is active
  isTrackingActive(): boolean {
    if (!this.isEnabled) return false;
    
    try {
      return mixpanel.has_opted_in_tracking();
    } catch (error) {
      console.error('Analytics tracking status error:', error);
      return false;
    }
  }

  // Identify user
  identify(userId: string, userProperties?: Record<string, any>) {
    if (!this.isEnabled) {
      logger.log(`👤 [Analytics] Identify user: ${userId}`, userProperties);
      return;
    }

    try {
      mixpanel.identify(userId);
      
      if (userProperties) {
        this.setUserProperties(userProperties);
      }
      
      logger.log(`👤 [Analytics] User identified: ${userId}`);
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    if (!this.isEnabled) {
      logger.log('👤 [Analytics] Set user properties:', properties);
      return;
    }

    try {
      mixpanel.people.set(properties);
      logger.log('👤 [Analytics] User properties set:', properties);
    } catch (error) {
      console.error('Analytics user properties error:', error);
    }
  }

  // Increment user properties
  incrementUserProperty(property: string, value: number = 1) {
    if (!this.isEnabled) {
      logger.log(`👤 [Analytics] Increment ${property} by ${value}`);
      return;
    }

    try {
      mixpanel.people.increment(property, value);
    } catch (error) {
      console.error('Analytics increment error:', error);
    }
  }

  // Track user signup
  trackSignup(userId: string, userProperties: Record<string, any>) {
    this.identify(userId, {
      ...userProperties,
      [USER_PROPERTIES.SIGNUP_DATE]: new Date().toISOString()
    });
    
    this.track(EVENTS.USER_SIGNED_UP, {
      user_id: userId,
      signup_method: userProperties.signup_method || 'email'
    });
  }

  // Track user login
  trackLogin(userId: string, method: string = 'email') {
    this.identify(userId);
    this.track(EVENTS.USER_SIGNED_IN, {
      user_id: userId,
      login_method: method
    });
    
    this.setUserProperties({
      [USER_PROPERTIES.LAST_ACTIVE]: new Date().toISOString()
    });
  }

  // Track product interactions
  trackProductSearch(query: string, filters: Record<string, any>, resultCount: number) {
    this.track(EVENTS.PRODUCT_SEARCHED, {
      search_query: query,
      filters_applied: filters,
      result_count: resultCount,
      has_filters: Object.keys(filters).length > 0
    });
  }

  trackProductViewed(productId: string, productName: string, category?: string) {
    this.track(EVENTS.PRODUCT_VIEWED, {
      product_id: productId,
      product_name: productName,
      product_category: category
    });
  }

  trackProductAddedToFootprint(productId: string, productName: string, carbonFootprint: number, quantity: number) {
    this.track(EVENTS.PRODUCT_ADDED_TO_FOOTPRINT, {
      product_id: productId,
      product_name: productName,
      carbon_footprint: carbonFootprint,
      quantity: quantity,
      total_footprint: carbonFootprint * quantity
    });
    
    // Increment user's total products tracked
    this.incrementUserProperty(USER_PROPERTIES.TOTAL_PRODUCTS_TRACKED);
  }

  trackProductDeleted(productId: string, productName: string, carbonFootprint: number) {
    this.track(EVENTS.PRODUCT_DELETED_FROM_FOOTPRINT, {
      product_id: productId,
      product_name: productName,
      carbon_footprint: carbonFootprint
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.track(EVENTS.ERROR_ENCOUNTERED, {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context: context
    });
  }

  // Track feature usage
  trackFeatureUsage(featureName: string, properties?: Record<string, any>) {
    this.track(EVENTS.FEATURE_USED, {
      feature_name: featureName,
      ...properties
    });
  }

  // Reset user (for logout)
  reset() {
    if (!this.isEnabled) {
      logger.log('👤 [Analytics] User reset');
      return;
    }

    try {
      mixpanel.reset();
      logger.log('👤 [Analytics] User session reset');
    } catch (error) {
      console.error('Analytics reset error:', error);
    }
  }

  // Get distinct ID
  getDistinctId(): string | null {
    if (!this.isEnabled) return null;
    
    try {
      return mixpanel.get_distinct_id();
    } catch (error) {
      console.error('Analytics get distinct ID error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;