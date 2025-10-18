// Validation utilities shared across platforms

export interface PasswordStrength {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notCommon: boolean;
  };
}

// Common weak passwords to avoid
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'welcome123', 'admin123', '12345678', 'password12',
  'iloveyou', 'princess', 'rockyou', '1234567', '12345', 'abc123',
  'nicole', 'daniel', 'babygirl', 'monkey', 'lovely', 'jessica'
];

/**
 * Validate password against modern security requirements
 */
export function validatePassword(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase())
  };

  const feedback: string[] = [];
  let score = 0;

  // Check each requirement
  if (!requirements.minLength) {
    feedback.push('Must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!requirements.hasUppercase) {
    feedback.push('Must contain at least one uppercase letter (A-Z)');
  } else {
    score += 1;
  }

  if (!requirements.hasLowercase) {
    feedback.push('Must contain at least one lowercase letter (a-z)');
  } else {
    score += 1;
  }

  if (!requirements.hasNumber) {
    feedback.push('Must contain at least one number (0-9)');
  } else {
    score += 1;
  }

  if (!requirements.hasSpecialChar) {
    feedback.push('Must contain at least one special character (!@#$%^&*...)');
  } else {
    score += 1;
  }

  if (!requirements.notCommon) {
    feedback.push('Password is too common, please choose a more unique password');
    score = Math.max(0, score - 2); // Heavily penalize common passwords
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score += 1;
  }
  if (password.length >= 16) {
    score += 1;
  }

  // Cap score at 4
  score = Math.min(4, score);

  const isValid = Object.values(requirements).every(req => req === true);

  return {
    score,
    feedback,
    isValid,
    requirements
  };
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Very Weak';
  }
}

/**
 * Get password strength color code
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return '#f44336'; // Red
    case 2:
      return '#ff9800'; // Orange
    case 3:
      return '#2196f3'; // Blue
    case 4:
      return '#4caf50'; // Green
    default:
      return '#f44336';
  }
}

/**
 * Check if password meets minimum requirements for registration
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Get user-friendly error message for invalid password
 */
export function getPasswordErrorMessage(password: string): string {
  const validation = validatePassword(password);
  
  if (validation.isValid) {
    return '';
  }

  if (validation.feedback.length === 1) {
    return validation.feedback[0];
  }

  return `Password must meet the following requirements: ${validation.feedback.join(', ')}`;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate barcode format and content
 */
export function validateBarcode(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') {
    return false;
  }

  // Remove whitespace
  const cleanBarcode = barcode.trim();
  
  // Check minimum length
  if (cleanBarcode.length < 8) {
    return false;
  }

  // Check if it contains only valid characters (digits and some special chars)
  const validPattern = /^[0-9A-Za-z\-\.\_\+\s]+$/;
  if (!validPattern.test(cleanBarcode)) {
    return false;
  }

  // Check for common barcode formats
  const formats = {
    UPC_A: /^\d{12}$/,
    UPC_E: /^\d{8}$/,
    EAN_13: /^\d{13}$/,
    EAN_8: /^\d{8}$/,
    CODE_128: /^[0-9A-Za-z\-\.\_\+\s]{8,}$/,
    CODE_39: /^[0-9A-Z\-\.\_\+\s\$\/\%]{8,}$/
  };

  // Check if barcode matches any known format
  return Object.values(formats).some(pattern => pattern.test(cleanBarcode));
}

/**
 * Validate carbon footprint value
 */
export function validateCarbonFootprint(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value < 1000000;
}

/**
 * Validate goal target value
 */
export function validateGoalTarget(value: number, timeframe: 'weekly' | 'monthly'): boolean {
  if (typeof value !== 'number' || value <= 0) {
    return false;
  }

  // Reasonable limits: weekly max 500kg, monthly max 2000kg
  const maxLimits = {
    weekly: 500,
    monthly: 2000
  };

  return value <= maxLimits[timeframe];
}

