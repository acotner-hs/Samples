// ============================================
// UTILITY FUNCTIONS - LIBRARY WRAPPER
// ============================================
// This file wraps the MLOProfileLib library utility functions
// and provides project-specific utilities

// NOTE: This file assumes you have added the MLOProfileLib library to this project
// If the library is not yet added, you'll need to:
// 1. Deploy the library project
// 2. Add it to this project via Resources > Libraries
// 3. Set the identifier to "MLOProfileLib"

// Wrapper functions for library utilities
function normalizePhone(phone) {
  return MLOProfileLib.normalizePhone(phone);
}

function normalizePhoneForComparison(phone) {
  return MLOProfileLib.normalizePhoneForComparison(phone);
}

function deepMerge(target, source) {
  return MLOProfileLib.deepMerge(target, source);
}

function isObject(item) {
  return MLOProfileLib.isObject(item);
}

// Project-specific utility function (not in library)
function logToSheet(logSheet, email, action, status, details, rowNum) {
  const timestamp = new Date();
  logSheet.appendRow([timestamp, email, action, status, details, rowNum]);

  // Console log every log sheet entry
  Logger.log(`[${timestamp.toISOString()}] ${email} | ${action} | ${status} | ${details} | Row ${rowNum}`);
}
