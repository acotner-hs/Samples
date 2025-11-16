// ============================================
// MLO PROFILE API CLIENT LIBRARY
// ============================================
// This library provides API client functions for managing MLO profiles
// It can be used across multiple Google Apps Script projects

/**
 * Get a profile by email address
 * @param {string} email - The email address to search for
 * @param {Object} config - Configuration object containing baseUrl, partnerId, bearerToken, apiKey
 * @returns {Object|null} - Profile object or null if not found
 */
function getProfile(email, config) {
  const url = `${config.baseUrl}/api/v1.0/partner/${config.partnerId}/profiles?email=${encodeURIComponent(email)}`;

  const options = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.bearerToken}`,
      'apiKey': config.apiKey
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      const result = JSON.parse(response.getContentText());

      // Handle the paginated response structure
      if (result.data && Array.isArray(result.data)) {
        // Check if any profiles were found
        if (result.query && result.query.total === 0) {
          return null; // No profiles found
        }

        // Return the first profile from the data array
        if (result.data.length > 0) {
          return result.data[0];
        } else {
          return null; // Empty data array
        }
      }

      // Fallback: if response doesn't match expected structure, return as-is
      return result;

    } else if (responseCode === 404) {
      return null; // Profile not found
    } else if (responseCode === 401) {
      throw new Error('Unauthorized: Invalid or expired bearer token. Please check the BEARER_TOKEN configuration.');
    } else if (responseCode === 403) {
      throw new Error('Forbidden: You do not have permission to access this profile.');
    } else {
      throw new Error(`API error ${responseCode}: ${response.getContentText()}`);
    }
  } catch (error) {
    // Check if it's an authorization error we already threw
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      throw error;
    }
    throw new Error(`Failed to get profile: ${error.message}`);
  }
}

/**
 * Create a new MLO profile
 * @param {Object} profileData - Profile data object containing firstName, lastName, email, phone, nmlsId, mloStatus, lm, slm
 * @param {Object} config - Configuration object containing baseUrl, partnerId, bearerToken, apiKey
 * @param {boolean} dryRun - If true, simulates the operation without executing
 * @returns {Object} - Result object with success, message, and aggregateId
 */
function createProfile(profileData, config, dryRun) {
  // Generate a new UUID for the aggregateId
  const newAggregateId = Utilities.getUuid();

  const payload = {
    aggregateId: newAggregateId,
    role: 'MLO',
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    email: profileData.email,
    phone: profileData.phone,
    phones: [
      {
        phoneType: 'office',
        phoneNumber: profileData.phone
      }
    ],
    data: {
      nmlsid: String(profileData.nmlsId),
      mloStatus: profileData.mloStatus,
      lm: {
        firstName: profileData.lm.firstName,
        lastName: profileData.lm.lastName,
        email: profileData.lm.email
      },
      slm: {
        firstName: profileData.slm.firstName,
        lastName: profileData.slm.lastName,
        email: profileData.slm.email
      }
    }
  };

  // Log the payload
  Logger.log(`[CREATE] Payload for ${profileData.email}:\n${JSON.stringify(payload, null, 2)}`);

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `DRY RUN: Would create profile with aggregateId ${newAggregateId}`,
      aggregateId: newAggregateId,
      payload: payload
    };
  }

  const url = `${config.baseUrl}/api/v1.0/partner/${config.partnerId}/profiles`;

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.bearerToken}`,
      'apiKey': config.apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      return {
        success: true,
        message: `Profile created successfully with aggregateId: ${newAggregateId}`,
        aggregateId: newAggregateId
      };
    } else {
      throw new Error(`API error ${responseCode}: ${response.getContentText()}`);
    }
  } catch (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }
}

/**
 * Update an existing MLO profile
 * @param {Object} existingProfile - Existing profile object with aggregateId
 * @param {Object} profileData - New profile data object
 * @param {Object} mergedData - Merged data object to preserve existing fields
 * @param {Object} config - Configuration object containing baseUrl, partnerId, bearerToken, apiKey
 * @param {boolean} dryRun - If true, simulates the operation without executing
 * @returns {Object} - Result object with success and message
 */
function updateProfile(existingProfile, profileData, mergedData, config, dryRun) {
  const payload = {
    aggregateId: existingProfile.aggregateId,
    role: 'MLO',
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    email: profileData.email,
    phone: profileData.phone,
    phones: [
      {
        phoneType: 'office',
        phoneNumber: profileData.phone
      }
    ],
    data: mergedData
  };

  // Log the payload
  Logger.log(`[UPDATE] Payload for ${profileData.email}:\n${JSON.stringify(payload, null, 2)}`);

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `DRY RUN: Would update profile ${existingProfile.aggregateId}`,
      payload: payload
    };
  }

  const url = `${config.baseUrl}/api/v1.0/partner/${config.partnerId}/profiles`;

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.bearerToken}`,
      'apiKey': config.apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } else {
      throw new Error(`API error ${responseCode}: ${response.getContentText()}`);
    }
  } catch (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}
