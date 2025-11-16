// ============================================
// UTILITY FUNCTIONS
// ============================================

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

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function logToSheet(logSheet, email, action, status, details, rowNum) {
  const timestamp = new Date();
  logSheet.appendRow([timestamp, email, action, status, details, rowNum]);
}
