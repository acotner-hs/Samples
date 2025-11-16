// ============================================
// UTILITY FUNCTIONS LIBRARY
// ============================================
// This library provides utility functions for phone normalization,
// data merging, and other common operations

/**
 * Normalize a US phone number to +1XXXXXXXXXX format
 * @param {string|number} phone - Phone number in any format
 * @returns {string} - Normalized phone number in +1XXXXXXXXXX format
 * @throws {Error} - If phone number is invalid
 */
function normalizePhone(phone) {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Convert to string and strip all non-digit characters
  let digits = String(phone).replace(/\D/g, '');

  // If starts with 1 and has 11 digits, drop the leading 1
  if (digits.length === 11 && digits.charAt(0) === '1') {
    digits = digits.substring(1);
  }

  // Should now have 10 digits
  if (digits.length !== 10) {
    throw new Error(`Phone must be 10 digits after normalization. Got ${digits.length} digits: ${digits}`);
  }

  return '+1' + digits;
}

/**
 * Normalize phone number for comparison (strips all formatting)
 * @param {string|number} phone - Phone number in any format
 * @returns {string} - Phone digits only (no +1 prefix)
 */
function normalizePhoneForComparison(phone) {
  if (!phone) return '';
  // Strip all non-digits for comparison
  let digits = String(phone).replace(/\D/g, '');
  // Remove leading 1 if present
  if (digits.length === 11 && digits.charAt(0) === '1') {
    digits = digits.substring(1);
  }
  return digits;
}

/**
 * Deep merge two objects, with source values overwriting target values
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge into target
 * @returns {Object} - Merged object
 */
function deepMerge(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

/**
 * Check if a value is an object (not array or null)
 * @param {*} item - Value to check
 * @returns {boolean} - True if item is an object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Normalize email address to lowercase
 * @param {string} email - Email address
 * @returns {string} - Lowercase email address
 */
function normalizeEmail(email) {
  if (!email) return '';
  return String(email).toLowerCase().trim();
}

/**
 * Compare two profile objects and return list of changed fields
 * @param {Object} existingProfile - Existing profile data
 * @param {Object} newProfileData - New profile data to compare
 * @returns {Array<string>} - Array of changed field names (e.g., ['firstName', 'lm.email'])
 */
function compareProfiles(existingProfile, newProfileData) {
  const changedFields = [];

  // Compare root level fields
  if (existingProfile.firstName !== newProfileData.firstName) {
    changedFields.push('firstName');
  }
  if (existingProfile.lastName !== newProfileData.lastName) {
    changedFields.push('lastName');
  }
  if (existingProfile.email !== newProfileData.email) {
    changedFields.push('email');
  }

  // Normalize existing phone for comparison
  const existingPhone = normalizePhoneForComparison(existingProfile.phone);
  const newPhone = normalizePhoneForComparison(newProfileData.phone);
  if (existingPhone !== newPhone) {
    changedFields.push('phone');
  }

  // Get existing data object
  const existingData = existingProfile.data || {};

  // Compare data fields
  if (String(existingData.nmlsid) !== String(newProfileData.nmlsId)) {
    changedFields.push('nmlsid');
  }

  if (existingData.mloStatus !== newProfileData.mloStatus) {
    changedFields.push('mloStatus');
  }

  // Compare LM fields
  const existingLm = existingData.lm || {};
  if (existingLm.firstName !== newProfileData.lm.firstName) {
    changedFields.push('lm.firstName');
  }
  if (existingLm.lastName !== newProfileData.lm.lastName) {
    changedFields.push('lm.lastName');
  }
  if (existingLm.email !== newProfileData.lm.email) {
    changedFields.push('lm.email');
  }

  // Compare SLM fields
  const existingSlm = existingData.slm || {};
  if (existingSlm.firstName !== newProfileData.slm.firstName) {
    changedFields.push('slm.firstName');
  }
  if (existingSlm.lastName !== newProfileData.slm.lastName) {
    changedFields.push('slm.lastName');
  }
  if (existingSlm.email !== newProfileData.slm.email) {
    changedFields.push('slm.email');
  }

  return changedFields;
}

/**
 * Build merged data object for profile update
 * @param {Object} existingData - Existing data object from profile
 * @param {Object} newProfileData - New profile data
 * @returns {Object} - Merged data object
 */
function buildMergedData(existingData, newProfileData) {
  const newData = {
    nmlsid: String(newProfileData.nmlsId),
    mloStatus: newProfileData.mloStatus,
    lm: {
      firstName: newProfileData.lm.firstName,
      lastName: newProfileData.lm.lastName,
      email: newProfileData.lm.email
    },
    slm: {
      firstName: newProfileData.slm.firstName,
      lastName: newProfileData.slm.lastName,
      email: newProfileData.slm.email
    }
  };

  // Deep merge to preserve other fields in data object
  return deepMerge(existingData || {}, newData);
}

/**
 * Format timestamp for logging
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} - ISO formatted timestamp
 */
function formatTimestamp(date) {
  return (date || new Date()).toISOString();
}

/**
 * Create a log entry object
 * @param {string} email - Email address being processed
 * @param {string} action - Action being performed
 * @param {string} status - Status of the action
 * @param {string} details - Additional details
 * @param {number} rowNum - Row number in sheet
 * @returns {Object} - Log entry object
 */
function createLogEntry(email, action, status, details, rowNum) {
  return {
    timestamp: new Date(),
    email: email,
    action: action,
    status: status,
    details: details,
    rowNum: rowNum
  };
}
