import {
  validatePassword,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  isPasswordValid,
  getPasswordErrorMessage,
  validateEmail,
} from '../src/validation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should return weak for short passwords', () => {
      const result = validatePassword('test');
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return weak for common passwords', () => {
      const result = validatePassword('password123');
      expect(result.score).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('should return medium for decent passwords', () => {
      const result = validatePassword('TestPass123');
      expect(result.score).toBe(2);
      expect(result.isValid).toBe(true);
    });

    it('should return strong for complex passwords', () => {
      const result = validatePassword('TestPass123!@#');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.isValid).toBe(true);
    });

    it('should check for uppercase letters', () => {
      const weak = validatePassword('testpass123!');
      const strong = validatePassword('TestPass123!');
      expect(strong.score).toBeGreaterThan(weak.score);
    });

    it('should check for special characters', () => {
      const weak = validatePassword('TestPass123');
      const strong = validatePassword('TestPass123!');
      expect(strong.score).toBeGreaterThan(weak.score);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Weak');
      expect(getPasswordStrengthLabel(1)).toBe('Fair');
      expect(getPasswordStrengthLabel(2)).toBe('Good');
      expect(getPasswordStrengthLabel(3)).toBe('Strong');
      expect(getPasswordStrengthLabel(4)).toBe('Very Strong');
    });

    it('should handle out of range scores', () => {
      expect(getPasswordStrengthLabel(-1)).toBe('Weak');
      expect(getPasswordStrengthLabel(10)).toBe('Very Strong');
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return correct colors', () => {
      expect(getPasswordStrengthColor(0)).toBe('#dc3545');
      expect(getPasswordStrengthColor(1)).toBe('#fd7e14');
      expect(getPasswordStrengthColor(2)).toBe('#ffc107');
      expect(getPasswordStrengthColor(3)).toBe('#28a745');
      expect(getPasswordStrengthColor(4)).toBe('#20c997');
    });
  });

  describe('isPasswordValid', () => {
    it('should validate passwords correctly', () => {
      expect(isPasswordValid('test')).toBe(false);
      expect(isPasswordValid('password123')).toBe(false);
      expect(isPasswordValid('TestPass123')).toBe(true);
      expect(isPasswordValid('TestPass123!')).toBe(true);
    });
  });

  describe('getPasswordErrorMessage', () => {
    it('should return appropriate error messages', () => {
      expect(getPasswordErrorMessage('test')).toContain('at least 8 characters');
      expect(getPasswordErrorMessage('password123')).toContain('too common');
      expect(getPasswordErrorMessage('testpassword')).toContain('stronger password');
    });

    it('should return empty string for valid passwords', () => {
      expect(getPasswordErrorMessage('TestPass123')).toBe('');
      expect(getPasswordErrorMessage('TestPass123!')).toBe('');
    });
  });
});

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('first.last@company.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test..email@example.com')).toBe(false);
    });
  });
});

