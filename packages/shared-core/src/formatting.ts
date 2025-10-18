// Formatting utilities shared across platforms

/**
 * Format barcode for display
 */
export function formatBarcodeForDisplay(barcode: string): string {
  if (!barcode) return '';
  
  const clean = barcode.trim();
  
  // Format common barcode types with spacing for readability
  if (/^\d{12}$/.test(clean)) {
    // UPC-A: 123456 789012
    return clean.replace(/(\d{6})(\d{6})/, '$1 $2');
  }
  
  if (/^\d{13}$/.test(clean)) {
    // EAN-13: 1 234567 890123
    return clean.replace(/(\d{1})(\d{6})(\d{6})/, '$1 $2 $3');
  }
  
  if (/^\d{8}$/.test(clean)) {
    // EAN-8/UPC-E: 1234 5678
    return clean.replace(/(\d{4})(\d{4})/, '$1 $2');
  }
  
  return clean;
}

/**
 * Get barcode format name
 */
export function getBarcodeFormat(barcode: string): string {
  if (!barcode) return 'Unknown';
  
  const clean = barcode.trim();
  
  if (/^\d{12}$/.test(clean)) return 'UPC-A';
  if (/^\d{13}$/.test(clean)) return 'EAN-13';
  if (/^\d{8}$/.test(clean)) return 'EAN-8/UPC-E';
  if (/^[0-9A-Za-z\-\.\_\+\s]{8,}$/.test(clean)) return 'Code 128';
  if (/^[0-9A-Z\-\.\_\+\s\$\/\%]{8,}$/.test(clean)) return 'Code 39';
  
  return 'Unknown Format';
}

/**
 * Format carbon footprint value for display
 */
export function formatCarbonFootprint(footprint: number, unit: 'kg' | 'g' = 'kg'): string {
  if (typeof footprint !== 'number' || isNaN(footprint)) {
    return '0 kg CO₂e';
  }

  if (unit === 'g') {
    footprint = footprint / 1000;
  }

  if (footprint < 0.01) {
    return '< 0.01 kg CO₂e';
  }

  if (footprint < 1) {
    return `${(footprint * 1000).toFixed(0)} g CO₂e`;
  }

  if (footprint < 10) {
    return `${footprint.toFixed(2)} kg CO₂e`;
  }

  if (footprint < 100) {
    return `${footprint.toFixed(1)} kg CO₂e`;
  }

  return `${footprint.toFixed(0)} kg CO₂e`;
}

/**
 * Get eco-score color
 */
export function getEcoScoreColor(score?: string): string {
  if (!score) return '#9E9E9E';
  
  switch (score.toLowerCase()) {
    case 'a': return '#4CAF50'; // Green
    case 'b': return '#8BC34A'; // Light Green
    case 'c': return '#FFC107'; // Amber
    case 'd': return '#FF9800'; // Orange
    case 'e': return '#F44336'; // Red
    default: return '#9E9E9E'; // Gray
  }
}

/**
 * Get eco-score label
 */
export function getEcoScoreLabel(score?: string): string {
  if (!score) return 'Unknown';
  
  switch (score.toLowerCase()) {
    case 'a': return 'Excellent';
    case 'b': return 'Good';
    case 'c': return 'Fair';
    case 'd': return 'Poor';
    case 'e': return 'Very Poor';
    default: return 'Unknown';
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  if (format === 'relative') {
    return formatRelativeTime(d);
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Short format
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else if (diffWeek < 4) {
    return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

