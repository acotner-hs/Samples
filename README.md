# MLO Profile Management - Google Apps Script

This Google Apps Script project manages Mortgage Loan Officer (MLO) profiles via API integration with the HomeStory Rewards platform.

## Features

- **Profile Management**: Create and update MLO profiles via REST API
- **Bulk Processing**: Process multiple profiles from Google Sheets
- **Environment Support**: Switch between BETA and PROD environments
- **Dry Run Mode**: Test operations without making actual API calls
- **Comprehensive Logging**: Detailed logging of all operations to a Log sheet
- **Field Comparison**: Smart comparison of existing vs new data to minimize unnecessary updates
- **Phone Normalization**: Automatic phone number formatting to +1XXXXXXXXXX format
- **Error Handling**: Robust error handling with detailed error messages

## Project Structure

### Main Project
```
├── Code.gs           # Main processing logic and menu functions
├── Config.gs         # Configuration settings (environment, API keys, etc.)
├── ApiService.gs     # API integration wrapper (calls library functions)
├── Utils.gs          # Utility wrapper (calls library functions + logging)
├── appsscript.json   # Apps Script manifest file
└── README.md         # This file
```

### Shared Library (library/)
```
├── ApiClient.gs      # Reusable API client functions
├── Utils.gs          # Reusable utility functions
├── appsscript.json   # Library manifest file
└── README.md         # Library documentation
```

**Note:** This project uses a shared library for API and utility functions. The library can be deployed once and reused across multiple projects.

## Setup Instructions

### 1. Create a Google Spreadsheet

1. Create a new Google Sheet or use an existing one
2. Set up the input sheet with the following columns (you can change the sheet name in Config.gs):
   - `lo_first_name`
   - `lo_last_name`
   - `lo_phone_number`
   - `lo_email`
   - `nmls_id`
   - `mlo_status` (must be "active" or "inactive")
   - `lm_first_name`
   - `lm_last_name`
   - `lm_email`
   - `slm_first_name`
   - `slm_last_name`
   - `slm_email`
   - `Update Results` (automatically populated, will be created if doesn't exist)

### 2. Deploy the Shared Library (First Time Only)

**If you haven't deployed the library yet:**

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name it "MLO Profile Library"
4. Create the library files from the `library/` folder:
   - `ApiClient.gs`
   - `Utils.gs`
   - Update `appsscript.json`
5. Click **Deploy > New deployment**
6. Select type: **Library**
7. Add description: "MLO Profile Management Library v1.0"
8. Click **Deploy**
9. **Copy the Script ID** (you'll need this in the next step)

**See `library/README.md` for detailed library documentation.**

### 3. Create Apps Script Project

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete the default `Code.gs` content
3. Create the following files and copy the code:
   - `Config.gs`
   - `Code.gs`
   - `ApiService.gs`
   - `Utils.gs`
4. Update the `appsscript.json` file (click the gear icon ⚙️ to access it)

### 4. Add the Library to Your Project

1. In your Apps Script project, click the **+** next to **Libraries**
2. Paste the **Script ID** from step 2
3. Click **Look up**
4. Select the latest version
5. Set the **Identifier** to `MLOProfileLib`
6. Click **Add**

### 5. Configure the Script

In `Config.gs`, update the following:

```javascript
// Set environment (BETA or PROD)
const ENVIRONMENT = 'BETA';

// Set dry run mode (true for testing, false for actual execution)
const DRY_RUN = true;

// Add your bearer token
const BEARER_TOKEN = 'your-bearer-token-here';

// Update sheet name if different
const INPUT_SHEET_NAME = 'LO-Hierarchy';
```

### 6. Authorize the Script

1. Save the script
2. Refresh your Google Sheet
3. You'll see a new menu: **MLO Processing**
4. Click **MLO Processing > Process All Rows**
5. Authorize the script when prompted (it will request permissions for the library too)

## Usage

### Processing Profiles

1. Fill in your MLO data in the input sheet
2. Go to **MLO Processing > Process All Rows**
3. The script will:
   - Look up each profile by email
   - Create new profiles if they don't exist
   - Update existing profiles if data has changed
   - Skip profiles with no changes
   - Log all operations to the "Log" sheet
   - Update the "Update Results" column

### Understanding Results

The "Update Results" column will show:
- `added` - New profile created
- `updated: field1, field2, ...` - Profile updated with changed fields
- `no update needed` - Profile exists and matches
- `error: message` - Error occurred during processing
- `[DRY RUN] added` - Would create (dry run mode)
- `[DRY RUN] updated: field1, field2` - Would update (dry run mode)

### Dry Run Mode

**Always test with DRY_RUN = true first!**

When `DRY_RUN = true`:
- Profile lookups are performed normally
- CREATE and UPDATE operations are simulated but not executed
- All operations are logged with "[DRY RUN]" or "Simulated" in the action
- Results show what would happen without making actual changes

### Environment Switching

To switch between BETA and PROD:

```javascript
const ENVIRONMENT = 'PROD'; // or 'BETA'
```

The URLs will automatically update:
- **BETA**: `https://homestory-connect.beta-api.homestoryrewards.com`
- **PROD**: `https://homestory-connect.api.homestoryrewards.com`

## API Integration

### Endpoints

- **GET Profile**: `GET /api/v1.0/partner/{partnerId}/profiles?email={email}` (query parameter)
- **CREATE Profile**: `POST /api/v1.0/partner/{partnerId}/profiles`
- **UPDATE Profile**: `POST /api/v1.0/partner/{partnerId}/profiles` (same endpoint as CREATE, uses aggregateId in payload)

### Authentication

The script uses Bearer token authentication plus an API key. Set both in `Config.gs`:

```javascript
const BEARER_TOKEN = 'your-token-here';
const PARTNER_API_KEY = 'your-api-key-here';
```

Both are sent as headers:
- `Authorization: Bearer {token}`
- `apiKey: {api-key}`

### Profile Payload Structure

Both CREATE and UPDATE use the same payload structure. For CREATE, a new UUID is generated for `aggregateId`. For UPDATE, the existing `aggregateId` is used.

```json
{
  "aggregateId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "role": "MLO",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+15551234567",
  "phones": [
    {
      "phoneType": "office",
      "phoneNumber": "+15551234567"
    }
  ],
  "data": {
    "nmlsid": "123456",
    "mloStatus": "active",
    "lm": {
      "firstName": "Jane",
      "lastName": "Manager",
      "email": "jane.manager@example.com"
    },
    "slm": {
      "firstName": "Bob",
      "lastName": "Senior",
      "email": "bob.senior@example.com"
    }
  }
}
```

## Logging

All operations are logged to the "Log" sheet with:
- **Timestamp**: When the operation occurred
- **LO Email**: Email of the profile being processed
- **Action**: Lookup, Create, Update, Skip, Error
- **Status**: Success, Failed, In Progress
- **Details**: Additional information about the operation
- **Row Number**: Source row in the input sheet

Additionally, all log entries are written to the Apps Script console using `Logger.log()` for debugging purposes. API payloads for CREATE and UPDATE operations are also logged to the console.

## Phone Number Normalization

Phone numbers are automatically normalized to `+1XXXXXXXXXX` format:
- Input: `(555) 123-4567` → Output: `+15551234567`
- Input: `555-123-4567` → Output: `+15551234567`
- Input: `15551234567` → Output: `+15551234567`
- Input: `5551234567` → Output: `+15551234567`

## Error Handling

The script handles:
- **401 Unauthorized**: Invalid or expired bearer token
- **403 Forbidden**: Permission denied
- **404 Not Found**: Profile doesn't exist (triggers create)
- **Invalid phone numbers**: Detailed error messages
- **Missing required fields**: Clear validation errors
- **API errors**: Full error details in logs

## Best Practices

1. **Always test with DRY_RUN = true first**
2. **Review the Log sheet** after each run
3. **Start with a small batch** (5-10 rows) to verify behavior
4. **Keep your bearer token secure** - never commit it to version control
5. **Monitor rate limits** - the script includes a 100ms delay between rows
6. **Validate data** before processing - ensure emails, phone numbers, and mlo_status are correct
7. **Back up your data** before running bulk updates

## Troubleshooting

### "Column not found" error
- Ensure all column names in your sheet match exactly (case-sensitive)
- Check the `COLUMNS` object in `Config.gs`

### "Unauthorized" error
- Verify your bearer token is valid
- Check if the token has expired
- Ensure you have the correct permissions

### Phone number errors
- Phone numbers must be 10 digits (US format)
- Leading 1 is optional
- All formatting characters are automatically removed

### No updates happening in DRY_RUN mode
- This is expected! DRY_RUN mode simulates operations
- Set `DRY_RUN = false` to execute actual operations

### "MLOProfileLib is not defined" error
- The shared library hasn't been added to your project
- Follow step 4 in Setup Instructions to add the library
- Make sure the identifier is exactly `MLOProfileLib`
- Verify the library is enabled in your project settings

## Support

For API-related questions, contact your HomeStory Rewards API administrator.

For Google Apps Script questions, refer to the [Apps Script documentation](https://developers.google.com/apps-script).

## Architecture

This project uses a **shared library architecture** for better code reusability:

- **Main Project**: Contains business logic, configuration, and sheet-specific processing
- **Shared Library (MLOProfileLib)**: Contains reusable API client and utility functions

### Benefits:
- **Reusability**: Deploy library once, use in multiple projects
- **Maintainability**: Update library independently from projects
- **Separation of Concerns**: Business logic separate from infrastructure code
- **Versioning**: Projects can use different library versions

### Library Functions Used:
- `MLOProfileLib.getProfile()` - API call to get profile
- `MLOProfileLib.createProfile()` - API call to create profile
- `MLOProfileLib.updateProfile()` - API call to update profile
- `MLOProfileLib.compareProfiles()` - Compare profile data
- `MLOProfileLib.buildMergedData()` - Build merged data object
- `MLOProfileLib.normalizePhone()` - Phone number normalization
- `MLOProfileLib.deepMerge()` - Deep object merging

## Version History

- **v2.0** - Refactored to use shared library architecture
  - Extracted API client functions to shared library
  - Extracted utility functions to shared library
  - Main project now uses library wrappers
  - Added comprehensive library documentation
  - Improved code modularity and reusability
  - Simplified main project code

- **v1.1** - Updated API integration
  - Changed GET endpoint to use query parameter (?email=)
  - Unified CREATE and UPDATE to use same POST endpoint
  - Added aggregateId generation for new profiles
  - Added apiKey header authentication
  - Added console logging for all operations
  - Email addresses now normalized to lowercase
  - Auto-create "Update Results" column if missing
  - Handle paginated API responses
  - Default sheet name changed to 'LO-Hierarchy'

- **v1.0** - Initial release with full CRUD operations, dry run mode, and comprehensive logging
