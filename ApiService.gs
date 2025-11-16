// ============================================
// API SERVICE - LIBRARY WRAPPER
// ============================================
// This file wraps the MLOProfileLib library functions
// It provides a simpler interface for the main application

// NOTE: This file assumes you have added the MLOProfileLib library to this project
// If the library is not yet added, you'll need to:
// 1. Deploy the library project
// 2. Add it to this project via Resources > Libraries
// 3. Set the identifier to "MLOProfileLib"

function getProfile(email) {
  const config = {
    baseUrl: BASE_URL,
    partnerId: PARTNER_ID,
    bearerToken: BEARER_TOKEN,
    apiKey: PARTNER_API_KEY
  };

  try {
    return MLOProfileLib.getProfile(email, config);
  } catch (error) {
    throw error;
  }
}

function createProfile(loData, rowNum, logSheet) {
  const config = {
    baseUrl: BASE_URL,
    partnerId: PARTNER_ID,
    bearerToken: BEARER_TOKEN,
    apiKey: PARTNER_API_KEY
  };

  try {
    const result = MLOProfileLib.createProfile(loData, config, DRY_RUN);

    if (result.dryRun) {
      const payloadPreview = JSON.stringify(result.payload, null, 2);
      logToSheet(logSheet, loData.email, 'Create (Simulated)', 'Success',
        `🔍 DRY RUN: ${result.message}. Payload:\n${payloadPreview.substring(0, 1500)}...`, rowNum);
      return '[DRY RUN] added';
    }

    if (result.success) {
      logToSheet(logSheet, loData.email, 'Create', 'Success', result.message, rowNum);
      return 'added';
    }
  } catch (error) {
    logToSheet(logSheet, loData.email, 'Create', 'Failed', error.message, rowNum);
    throw new Error(`Failed to create profile: ${error.message}`);
  }
}

function updateProfile(existingProfile, loData, mergedData, rowNum, logSheet) {
  const config = {
    baseUrl: BASE_URL,
    partnerId: PARTNER_ID,
    bearerToken: BEARER_TOKEN,
    apiKey: PARTNER_API_KEY
  };

  try {
    const result = MLOProfileLib.updateProfile(existingProfile, loData, mergedData, config, DRY_RUN);

    if (result.dryRun) {
      const payloadPreview = JSON.stringify(result.payload, null, 2);
      logToSheet(logSheet, loData.email, 'Update (Simulated)', 'Success',
        `🔍 DRY RUN: ${result.message}. Payload:\n${payloadPreview.substring(0, 1500)}...`, rowNum);
      return true;
    }

    if (result.success) {
      return true;
    }
  } catch (error) {
    logToSheet(logSheet, loData.email, 'Update', 'Failed', error.message, rowNum);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}
