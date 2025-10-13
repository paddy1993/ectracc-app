// Modern password validation utilities
// Following NIST and OWASP 2024 guidelines

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
 * Get password strength color
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
