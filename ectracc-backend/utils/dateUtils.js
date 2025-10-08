/**
 * Date utility functions for carbon footprint tracking
 */

/**
 * Calculate date range for different periods
 * @param {string} period - The period type ('daily', 'weekly', 'monthly', 'yearly')
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Object} Object with startDate and endDate
 */
function calculateDateRange(period, startDate = null, endDate = null) {
  const now = new Date();
  let start, end;

  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };
  }

  switch (period) {
    case 'daily':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;

    case 'weekly':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6); // End of current week (Saturday)
      end.setHours(23, 59, 59, 999);
      break;

    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      end.setHours(23, 59, 59, 999);
      break;

    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1); // First day of current year
      end = new Date(now.getFullYear(), 11, 31); // Last day of current year
      end.setHours(23, 59, 59, 999);
      break;

    case 'ytd': // Year to date
      start = new Date(now.getFullYear(), 0, 1); // First day of current year
      end = new Date(now); // Current date
      end.setHours(23, 59, 59, 999);
      break;

    default:
      // Default to last 30 days
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
  }

  return {
    startDate: start,
    endDate: end
  };
}

/**
 * Format date for display
 * @param {Date} date - The date to format
 * @param {string} format - The format type ('short', 'long', 'iso')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'short') {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    
    case 'long':
      return d.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    case 'iso':
      return d.toISOString().split('T')[0];
    
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Get time ago string
 * @param {Date} date - The date to compare
 * @returns {string} Time ago string (e.g., "2 hours ago")
 */
function getTimeAgo(date) {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date, 'short');
}

/**
 * Check if date is within range
 * @param {Date} date - The date to check
 * @param {Date} startDate - Range start date
 * @param {Date} endDate - Range end date
 * @returns {boolean} True if date is within range
 */
function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
}

module.exports = {
  calculateDateRange,
  formatDate,
  getTimeAgo,
  isDateInRange
};
