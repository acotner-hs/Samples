// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

function processMLOProfiles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName(INPUT_SHEET_NAME);

  if (!inputSheet) {
    throw new Error(`Input sheet "${INPUT_SHEET_NAME}" not found`);
  }

  // Get or create log sheet
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    logSheet.appendRow(['Timestamp', 'LO Email', 'Action', 'Status', 'Details', 'Row Number']);
    logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  // Log if in dry run mode
  if (DRY_RUN) {
    logToSheet(logSheet, 'SYSTEM', 'Dry Run Mode', 'Active', '⚠️ DRY RUN MODE - No CREATE or UPDATE operations will be executed', 0);
  }

  // Get data from input sheet
  const data = inputSheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const colIndices = {};
  for (const [key, colName] of Object.entries(COLUMNS)) {
    const index = headers.indexOf(colName);
    if (index === -1 && key !== 'RESULT') {
      throw new Error(`Column "${colName}" not found in input sheet`);
    }
    colIndices[key] = index;
  }

  // Handle "Update Results" column - create if doesn't exist
  if (colIndices.RESULT === -1) {
    // Column doesn't exist, add it
    const lastCol = headers.length;
    inputSheet.getRange(1, lastCol + 1).setValue(COLUMNS.RESULT);
    colIndices.RESULT = lastCol; // 0-indexed
    Logger.log(`Created new column "${COLUMNS.RESULT}" at position ${lastCol + 1}`);
  }

  // Process each row (skip header)
  for (let i = 1; i < data.length; i++) {
    const rowNum = i + 1;
    const row = data[i];
    let loData = null; // Initialize loData before try block

    try {
      // Extract data from row
      loData = {
        firstName: row[colIndices.LO_FIRST_NAME],
        lastName: row[colIndices.LO_LAST_NAME],
        phone: row[colIndices.LO_PHONE],
        email: String(row[colIndices.LO_EMAIL]).toLowerCase(),
        nmlsId: row[colIndices.NMLS_ID],
        mloStatus: row[colIndices.MLO_STATUS],
        lm: {
          firstName: row[colIndices.LM_FIRST_NAME],
          lastName: row[colIndices.LM_LAST_NAME],
          email: String(row[colIndices.LM_EMAIL]).toLowerCase()
        },
        slm: {
          firstName: row[colIndices.SLM_FIRST_NAME],
          lastName: row[colIndices.SLM_LAST_NAME],
          email: String(row[colIndices.SLM_EMAIL]).toLowerCase()
        }
      };

      // Validate and process the row
      const result = processRow(loData, rowNum, logSheet);

      // Update result column
      inputSheet.getRange(rowNum, colIndices.RESULT + 1).setValue(result);

    } catch (error) {
      const errorMsg = `error: ${error.message}`;
      const emailForLog = loData && loData.email ? loData.email : `Row ${rowNum}`;

      inputSheet.getRange(rowNum, colIndices.RESULT + 1).setValue(errorMsg);
      logToSheet(logSheet, emailForLog, 'Error', 'Failed', error.message, rowNum);
    }

    // Add a small delay to avoid rate limiting
    Utilities.sleep(100);
  }

  const completionMsg = DRY_RUN
    ? 'Dry run complete! Check the Log sheet for simulated operations. No actual changes were made.'
    : 'Processing complete! Check the Log sheet for details.';

  SpreadsheetApp.getUi().alert(completionMsg);
}

// ============================================
// ROW PROCESSING LOGIC
// ============================================

function processRow(loData, rowNum, logSheet) {
  // Validate required fields
  if (!loData.email) {
    throw new Error('LO email is required');
  }

  // Validate and normalize mloStatus
  if (!loData.mloStatus) {
    throw new Error('mlo_status is required');
  }

  const mloStatus = String(loData.mloStatus).toLowerCase().trim();
  if (mloStatus !== 'active' && mloStatus !== 'inactive') {
    throw new Error(`Invalid mlo_status value: '${loData.mloStatus}'. Must be 'active' or 'inactive'`);
  }
  loData.mloStatus = mloStatus;

  // Normalize phone number
  try {
    loData.phone = normalizePhone(loData.phone);
  } catch (error) {
    throw new Error(`Invalid phone number: ${error.message}`);
  }

  // Step 1: Lookup existing profile
  logToSheet(logSheet, loData.email, 'Lookup', 'In Progress', 'Getting profile...', rowNum);

  const existingProfile = getProfile(loData.email);

  if (!existingProfile) {
    // Step 2: Create new profile (not found)
    logToSheet(logSheet, loData.email, 'Lookup', 'Success', 'Profile not found, will create', rowNum);
    return createProfile(loData, rowNum, logSheet);
  }

  // Step 3: Compare and update if needed
  logToSheet(logSheet, loData.email, 'Lookup', 'Success', 'Profile found, comparing data', rowNum);
  return compareAndUpdate(loData, existingProfile, rowNum, logSheet);
}

// ============================================
// COMPARISON AND UPDATE LOGIC
// ============================================

function compareAndUpdate(loData, existingProfile, rowNum, logSheet) {
  const changedFields = [];

  // Compare root level fields
  if (existingProfile.firstName !== loData.firstName) {
    changedFields.push('firstName');
  }
  if (existingProfile.lastName !== loData.lastName) {
    changedFields.push('lastName');
  }
  if (existingProfile.email !== loData.email) {
    changedFields.push('email');
  }

  // Normalize existing phone for comparison
  const existingPhone = normalizePhoneForComparison(existingProfile.phone);
  const newPhone = normalizePhoneForComparison(loData.phone);
  if (existingPhone !== newPhone) {
    changedFields.push('phone');
  }

  // Get existing data object
  const existingData = existingProfile.data || {};

  // Compare data fields
  if (String(existingData.nmlsid) !== String(loData.nmlsId)) {
    changedFields.push('nmlsid');
  }

  if (existingData.mloStatus !== loData.mloStatus) {
    changedFields.push('mloStatus');
  }

  // Compare LM fields
  const existingLm = existingData.lm || {};
  if (existingLm.firstName !== loData.lm.firstName) {
    changedFields.push('lm.firstName');
  }
  if (existingLm.lastName !== loData.lm.lastName) {
    changedFields.push('lm.lastName');
  }
  if (existingLm.email !== loData.lm.email) {
    changedFields.push('lm.email');
  }

  // Compare SLM fields
  const existingSlm = existingData.slm || {};
  if (existingSlm.firstName !== loData.slm.firstName) {
    changedFields.push('slm.firstName');
  }
  if (existingSlm.lastName !== loData.slm.lastName) {
    changedFields.push('slm.lastName');
  }
  if (existingSlm.email !== loData.slm.email) {
    changedFields.push('slm.email');
  }

  // If no changes, return early
  if (changedFields.length === 0) {
    const skipMsg = DRY_RUN ? '🔍 DRY RUN: No changes detected' : 'No changes detected';
    logToSheet(logSheet, loData.email, 'Skip', 'Success', skipMsg, rowNum);
    return DRY_RUN ? '[DRY RUN] no update needed' : 'no update needed';
  }

  // Build new data object with deep merge
  const newData = {
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
  };

  // Deep merge to preserve other fields in data object
  const mergedData = deepMerge(existingData, newData);

  // Perform update
  const success = updateProfile(existingProfile, loData, mergedData, rowNum, logSheet);

  if (success) {
    const details = `Updated fields: ${changedFields.join(', ')}`;
    logToSheet(logSheet, loData.email, DRY_RUN ? 'Update (Simulated)' : 'Update', 'Success', details, rowNum);
    const resultPrefix = DRY_RUN ? '[DRY RUN] updated: ' : 'updated: ';
    return resultPrefix + changedFields.join(', ');
  }
}

// ============================================
// MENU FUNCTION
// ============================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('MLO Processing')
    .addItem('Process All Rows', 'processMLOProfiles')
    .addToUi();
}
