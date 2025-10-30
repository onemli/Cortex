/**
 * Cortex - Security Validation Utilities
 * validation.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Comprehensive validation and sanitization utilities for URLs, text inputs, and data structures to ensure security and integrity
 * @author Kerem Can ONEMLI
 */

/**
 * URL Validation - Prevents XSS and malicious URLs
 */
export class URLValidator {
  // Allowed protocols
  static SAFE_PROTOCOLS = ['http:', 'https:', 'ftp:','ssh','telnet'];

  // Dangerous protocols that could execute code
  static DANGEROUS_PROTOCOLS = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'blob:'
  ];

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate
   * @returns {Object} - { isValid: boolean, sanitized: string, error: string }
   */
  static validate(url) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, sanitized: '', error: 'URL is required' };
    }

    // Trim whitespace
    url = url.trim();

    // Check minimum length
    if (url.length < 3) {
      return { isValid: false, sanitized: url, error: 'URL too short' };
    }

    // Check maximum length (prevent DoS)
    if (url.length > 2048) {
      return { isValid: false, sanitized: url, error: 'URL too long (max 2048 chars)' };
    }

    try {
      // Add protocol if missing
      if (!url.match(/^[a-zA-Z]+:\/\//)) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);

      // Check for dangerous protocols
      if (this.DANGEROUS_PROTOCOLS.includes(urlObj.protocol)) {
        return {
          isValid: false,
          sanitized: '',
          error: `Dangerous protocol detected: ${urlObj.protocol}`
        };
      }

      // Only allow safe protocols
      if (!this.SAFE_PROTOCOLS.includes(urlObj.protocol)) {
        return {
          isValid: false,
          sanitized: '',
          error: `Protocol not allowed: ${urlObj.protocol}`
        };
      }

      // Check for embedded scripts in URL
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // onclick=, onerror=, etc.
        /eval\(/i,
        /expression\(/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(url)) {
          return {
            isValid: false,
            sanitized: '',
            error: 'Potentially malicious content detected in URL'
          };
        }
      }

      return {
        isValid: true,
        sanitized: urlObj.href,
        error: null
      };

    } catch (error) {
      return {
        isValid: false,
        sanitized: url,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Quick validation (returns boolean only)
   */
  static isValid(url) {
    return this.validate(url).isValid;
  }
}

/**
 * Text Input Sanitization
 */
export class TextSanitizer {
  /**
   * Sanitize bookmark title
   * @param {string} title - Title to sanitize
   * @returns {Object} - { isValid: boolean, sanitized: string, error: string }
   */
  static sanitizeTitle(title) {
    if (!title || typeof title !== 'string') {
      return { isValid: false, sanitized: '', error: 'Title is required' };
    }

    // Trim whitespace
    title = title.trim();

    // Check minimum length
    if (title.length < 1) {
      return { isValid: false, sanitized: '', error: 'Title cannot be empty' };
    }

    // Check maximum length
    if (title.length > 200) {
      return {
        isValid: false,
        sanitized: title.substring(0, 200),
        error: 'Title too long (max 200 chars)'
      };
    }

    // Remove potentially dangerous characters
    const sanitized = title
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters

    // Check for script injection attempts
    if (/<script|javascript:|on\w+\s*=/i.test(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Potentially malicious content detected'
      };
    }

    return {
      isValid: true,
      sanitized: sanitized.trim(),
      error: null
    };
  }

  /**
   * Sanitize tag name
   * @param {string} tag - Tag to sanitize
   * @returns {Object} - { isValid: boolean, sanitized: string, error: string }
   */
  static sanitizeTag(tag) {
    if (!tag || typeof tag !== 'string') {
      return { isValid: false, sanitized: '', error: 'Tag is required' };
    }

    // Trim and lowercase
    tag = tag.trim().toLowerCase();

    // Check minimum length
    if (tag.length < 1) {
      return { isValid: false, sanitized: '', error: 'Tag cannot be empty' };
    }

    // Check maximum length
    if (tag.length > 30) {
      return {
        isValid: false,
        sanitized: tag.substring(0, 15),
        error: 'Tag too long (max 30 chars)'
      };
    }

    // Only allow alphanumeric, dash, and underscore
    const sanitized = tag.replace(/[^a-z0-9\-_]/g, '');

    if (sanitized.length === 0) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Tag contains invalid characters'
      };
    }

    return {
      isValid: true,
      sanitized,
      error: null
    };
  }

  /**
   * Sanitize category name
   * @param {string} name - Category name to sanitize
   * @returns {Object} - { isValid: boolean, sanitized: string, error: string }
   */
  static sanitizeCategoryName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, sanitized: '', error: 'Category name is required' };
    }

    // Trim
    name = name.trim();

    // Check minimum length
    if (name.length < 1) {
      return { isValid: false, sanitized: '', error: 'Category name cannot be empty' };
    }

    // Check maximum length
    if (name.length > 250) {
      return {
        isValid: false,
        sanitized: name.substring(0, 250),
        error: 'Category name too long (max 250 chars)'
      };
    }

    // Remove potentially dangerous characters
    const sanitized = name
      .replace(/[<>]/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // Check for script injection
    if (/<script|javascript:|on\w+\s*=/i.test(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Potentially malicious content detected'
      };
    }

    return {
      isValid: true,
      sanitized: sanitized.trim(),
      error: null
    };
  }
}

/**
 * Data Structure Validation
 */
export class DataValidator {
  /**
   * Validate bookmark object
   * @param {Object} bookmark - Bookmark to validate
   * @returns {Object} - { isValid: boolean, errors: Array }
   */
  static validateBookmark(bookmark) {
    const errors = [];

    if (!bookmark || typeof bookmark !== 'object') {
      return { isValid: false, errors: ['Invalid bookmark object'] };
    }

    // Validate title
    const titleResult = TextSanitizer.sanitizeTitle(bookmark.title);
    if (!titleResult.isValid) {
      errors.push(`Title: ${titleResult.error}`);
    }

    // Validate URL
    const urlResult = URLValidator.validate(bookmark.url);
    if (!urlResult.isValid) {
      errors.push(`URL: ${urlResult.error}`);
    }

    // Validate tags
    if (bookmark.tags) {
      if (!Array.isArray(bookmark.tags)) {
        errors.push('Tags must be an array');
      } else if (bookmark.tags.length > 10) {
        errors.push('Too many tags (max 10)');
      } else {
        bookmark.tags.forEach((tag, index) => {
          const tagResult = TextSanitizer.sanitizeTag(tag);
          if (!tagResult.isValid) {
            errors.push(`Tag ${index + 1}: ${tagResult.error}`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate category object
   * @param {Object} category - Category to validate
   * @returns {Object} - { isValid: boolean, errors: Array }
   */
  static validateCategory(category) {
    const errors = [];

    if (!category || typeof category !== 'object') {
      return { isValid: false, errors: ['Invalid category object'] };
    }

    // Validate name
    const nameResult = TextSanitizer.sanitizeCategoryName(category.name);
    if (!nameResult.isValid) {
      errors.push(`Name: ${nameResult.error}`);
    }

    // Validate ID
    if (!category.id || typeof category.id !== 'number') {
      errors.push('Invalid category ID');
    }

    // Validate bookmarks array
    if (!Array.isArray(category.bookmarks)) {
      errors.push('Bookmarks must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate imported data structure
   * @param {Object} data - Imported data
   * @returns {Object} - { isValid: boolean, errors: Array }
   */
  static validateImportedData(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid data format'] };
    }

    // Check version
    if (!data.version) {
      errors.push('Missing version information');
    }

    // Validate categories
    if (!Array.isArray(data.categories)) {
      errors.push('Categories must be an array');
    } else {
      data.categories.forEach((cat, index) => {
        const result = this.validateCategory(cat);
        if (!result.isValid) {
          errors.push(`Category ${index + 1}: ${result.errors.join(', ')}`);
        }
      });
    }

    // Validate settings
    if (data.settings && typeof data.settings !== 'object') {
      errors.push('Invalid settings format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Security Helper Functions
 */
export class SecurityHelpers {
  /**
   * Generate secure random ID
   */
  static generateSecureId() {
    return Date.now() + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Rate limiting helper (prevents abuse)
   */
  static createRateLimiter(maxCalls, timeWindow) {
    const calls = [];

    return function () {
      const now = Date.now();

      // Remove old calls outside time window
      while (calls.length > 0 && calls[0] < now - timeWindow) {
        calls.shift();
      }

      // Check if rate limit exceeded
      if (calls.length >= maxCalls) {
        return false;
      }

      calls.push(now);
      return true;
    };
  }

  /**
   * Deep clone with security (prevents prototype pollution)
   */
  static secureClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Prevent prototype pollution
    if (obj.constructor !== Object && obj.constructor !== Array) {
      throw new Error('Invalid object type for cloning');
    }

    const cloned = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      // Skip prototype properties
      if (!obj.hasOwnProperty(key)) continue;

      // Skip dangerous properties
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      cloned[key] = this.secureClone(obj[key]);
    }

    return cloned;
  }
}

/**
 * Content Security Policy Helpers
 */
export class CSPHelpers {
  /**
   * Check if content violates CSP
   */
  static checkCSPViolation(content) {
    const violations = [];

    // Check for inline scripts
    if (/<script[^>]*>/i.test(content)) {
      violations.push('Inline script detected');
    }

    // Check for inline event handlers
    if (/on\w+\s*=/i.test(content)) {
      violations.push('Inline event handler detected');
    }

    // Check for eval
    if (/eval\s*\(/i.test(content)) {
      violations.push('eval() usage detected');
    }

    return {
      isViolation: violations.length > 0,
      violations
    };
  }
}

// Export all validators
export default {
  URLValidator,
  TextSanitizer,
  DataValidator,
  SecurityHelpers,
  CSPHelpers
};