// ============================================
// API FUNCTIONS
// ============================================

function getProfile(email) {
  const url = ENDPOINTS.GET_PROFILE(email);

  const options = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      return JSON.parse(response.getContentText());
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
  const payload = {
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

  if (DRY_RUN) {
    // Simulate the create operation
    const payloadPreview = JSON.stringify(payload, null, 2);
    logToSheet(logSheet, loData.email, 'Create (Simulated)', 'Success',
      `🔍 DRY RUN: Would create profile with payload:\n${payloadPreview.substring(0, 500)}...`, rowNum);
    return '[DRY RUN] added';
  }

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(ENDPOINTS.CREATE_PROFILE, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      logToSheet(logSheet, loData.email, 'Create', 'Success', 'Profile created successfully', rowNum);
      return 'added';
    } else {
      throw new Error(`API error ${responseCode}: ${response.getContentText()}`);
    }
  } catch (error) {
    logToSheet(logSheet, loData.email, 'Create', 'Failed', error.message, rowNum);
    throw new Error(`Failed to create profile: ${error.message}`);
  }
}

function updateProfile(aggregateId, loData, mergedData, rowNum, logSheet) {
  const payload = {
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

  if (DRY_RUN) {
    // Simulate the update operation
    const payloadPreview = JSON.stringify(payload, null, 2);
    logToSheet(logSheet, loData.email, 'Update (Simulated)', 'Success',
      `🔍 DRY RUN: Would update profile ${aggregateId} with payload:\n${payloadPreview.substring(0, 500)}...`, rowNum);
    return true;
  }

  const url = ENDPOINTS.UPDATE_PROFILE(aggregateId);

  const options = {
    method: 'put',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
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
