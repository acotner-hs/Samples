// ============================================
// API FUNCTIONS
// ============================================

function getProfile(email) {
  const url = ENDPOINTS.GET_PROFILE(email);

  const options = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'apiKey': PARTNER_API_KEY
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

function createProfile(loData, rowNum, logSheet) {
  // Generate a new UUID for the aggregateId
  const newAggregateId = Utilities.getUuid();

  const payload = {
    aggregateId: newAggregateId,
    role: 'MLO',
    firstName: loData.firstName,
    lastName: loData.lastName,
    email: loData.email,
    phone: loData.phone,
    phones: [
      {
        phoneType: 'office',
        phoneNumber: loData.phone
      }
    ],
    data: {
      nmlsid: String(loData.nmlsId),
      mloStatus: loData.mloStatus,
      lm: {
        firstName: loData.lm.firstName,
        lastName: loData.lm.lastName,
        email: loData.lm.email
      },
      slm: {
        firstName: loData.slm.firstName,
        lastName: loData.slm.lastName,
        email: loData.slm.email
      }
    }
  };

  // Always log the payload
  Logger.log(`[CREATE] Payload for ${loData.email}:\n${JSON.stringify(payload, null, 2)}`);

  if (DRY_RUN) {
    // Simulate the create operation
    const payloadPreview = JSON.stringify(payload, null, 2);
    logToSheet(logSheet, loData.email, 'Create (Simulated)', 'Success',
      `🔍 DRY RUN: Would create profile with aggregateId ${newAggregateId}. Payload:\n${payloadPreview.substring(0, 1500)}...`, rowNum);
    return '[DRY RUN] added';
  }

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'apiKey': PARTNER_API_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(ENDPOINTS.PROFILES, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      logToSheet(logSheet, loData.email, 'Create', 'Success', `Profile created with aggregateId: ${newAggregateId}`, rowNum);
      return 'added';
    } else {
      throw new Error(`API error ${responseCode}: ${response.getContentText()}`);
    }
  } catch (error) {
    logToSheet(logSheet, loData.email, 'Create', 'Failed', error.message, rowNum);
    throw new Error(`Failed to create profile: ${error.message}`);
  }
}

function updateProfile(existingProfile, loData, mergedData, rowNum, logSheet) {
  const payload = {
    aggregateId: existingProfile.aggregateId, // Use existing aggregateId
    role: 'MLO',
    firstName: loData.firstName,
    lastName: loData.lastName,
    email: loData.email,
    phone: loData.phone,
    phones: [
      {
        phoneType: 'office',
        phoneNumber: loData.phone
      }
    ],
    data: mergedData
  };

  // Always log the payload
  Logger.log(`[UPDATE] Payload for ${loData.email}:\n${JSON.stringify(payload, null, 2)}`);

  if (DRY_RUN) {
    // Simulate the update operation
    const payloadPreview = JSON.stringify(payload, null, 2);
    logToSheet(logSheet, loData.email, 'Update (Simulated)', 'Success',
      `🔍 DRY RUN: Would update profile ${existingProfile.aggregateId}. Payload:\n${payloadPreview.substring(0, 1500)}...`, rowNum);
    return true;
  }

  const options = {
    method: 'post', // POST for update (not PUT)
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'apiKey': PARTNER_API_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(ENDPOINTS.PROFILES, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      return true;
    } else {
      throw new Error(`API error ${responseCode}: ${response.getContentText()}`);
    }
  } catch (error) {
    logToSheet(logSheet, loData.email, 'Update', 'Failed', error.message, rowNum);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}
