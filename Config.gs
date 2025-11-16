// ============================================
// CONFIGURATION
// ============================================

// Environment setting - change this to switch between beta and prod
const ENVIRONMENT = 'PROD'; // Options: 'BETA' or 'PROD'

// Dry run mode - set to true to simulate without making changes
const DRY_RUN = true; // Set to true to simulate CREATE/UPDATE operations without executing them

// Server configurations
const SERVERS = {
  'BETA': 'https://homestory-connect.beta-api.homestoryrewards.com/api/v1.0',
  'PROD': 'https://homestory-connect.api.homestoryrewards.com/api/v1.0'
};

// Get current server URL based on environment
const BASE_URL = SERVERS[ENVIRONMENT];

// Authentication
const BEARER_TOKEN = ''; // Replace with actual token

// Partner ID (same for both environments)
const PARTNER_ID = 'e2a46d0a-6544-4116-8631-f08d749045ac';
const PARTNER_API_KEY = '77DACCC1-1178-4FD2-B95E-4F291476CBD9';

// API Endpoints (constructed from BASE_URL)
const ENDPOINTS = {
  GET_PROFILE: (email) => `${BASE_URL}/partner/${PARTNER_ID}/profiles/${encodeURIComponent(email)}`,
  CREATE_PROFILE: `${BASE_URL}/partner/${PARTNER_ID}/profiles`,
  UPDATE_PROFILE: (aggregateId) => `${BASE_URL}/partner/${PARTNER_ID}/profiles/${aggregateId}`
};

// Sheet names
const INPUT_SHEET_NAME = 'Sheet1'; // Change to your input sheet name
const LOG_SHEET_NAME = 'Log';

// Column names in input sheet
const COLUMNS = {
  LO_FIRST_NAME: 'lo_first_name',
  LO_LAST_NAME: 'lo_last_name',
  LO_PHONE: 'lo_phone_number',
  LO_EMAIL: 'lo_email',
  NMLS_ID: 'nmls_id',
  MLO_STATUS: 'mlo_status',
  LM_FIRST_NAME: 'lm_first_name',
  LM_LAST_NAME: 'lm_last_name',
  LM_EMAIL: 'lm_email',
  SLM_FIRST_NAME: 'slm_first_name',
  SLM_LAST_NAME: 'slm_last_name',
  SLM_EMAIL: 'slm_email',
  RESULT: 'Result of last update'
};
