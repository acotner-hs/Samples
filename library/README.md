# MLO Profile Management Library

This is a shared Google Apps Script library that provides reusable functions for managing Mortgage Loan Officer (MLO) profiles via the HomeStory Rewards API.

## Library Contents

### ApiClient.gs
API client functions for profile management:
- `getProfile(email, config)` - Retrieve a profile by email
- `createProfile(profileData, config, dryRun)` - Create a new MLO profile
- `updateProfile(existingProfile, profileData, mergedData, config, dryRun)` - Update an existing profile

### Utils.gs
Utility functions for data processing:
- `normalizePhone(phone)` - Normalize US phone numbers to +1XXXXXXXXXX format
- `normalizePhoneForComparison(phone)` - Strip phone formatting for comparison
- `normalizeEmail(email)` - Normalize email to lowercase
- `deepMerge(target, source)` - Deep merge two objects
- `isObject(item)` - Check if value is an object
- `compareProfiles(existingProfile, newProfileData)` - Compare profiles and return changed fields
- `buildMergedData(existingData, newProfileData)` - Build merged data object for updates
- `formatTimestamp(date)` - Format timestamp for logging
- `createLogEntry(email, action, status, details, rowNum)` - Create log entry object

## How to Deploy This Library

### 1. Create a New Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name it "MLO Profile Library" (or similar)

### 2. Add the Library Files

1. Delete the default `Code.gs` content
2. Create three files:
   - `ApiClient.gs` - Copy content from this library's ApiClient.gs
   - `Utils.gs` - Copy content from this library's Utils.gs
   - Update `appsscript.json` - Copy content from this library's appsscript.json

### 3. Deploy as Library

1. Click **Deploy > New deployment**
2. Select type: **Library**
3. Add description: "MLO Profile Management Library"
4. Click **Deploy**
5. **Copy the Script ID** (you'll need this to add it to other projects)

### 4. Manage Versions

- Each time you update the library, create a new deployment
- Projects using the library can choose which version to use
- Use semantic versioning in your deployment descriptions (v1.0.0, v1.1.0, etc.)

## How to Use This Library in Your Project

### 1. Add Library to Your Project

1. Open your Google Apps Script project
2. Click the **+** next to **Libraries**
3. Paste the **Script ID** from the library deployment
4. Click **Look up**
5. Select the version you want to use
6. Set the **Identifier** to `MLOProfileLib`
7. Click **Add**

### 2. Call Library Functions

Once added, you can call library functions using the identifier:

```javascript
// Example: Normalize a phone number
const normalized = MLOProfileLib.normalizePhone('(555) 123-4567');
// Returns: '+15551234567'

// Example: Get a profile
const config = {
  baseUrl: 'https://homestory-connect.beta-api.homestoryrewards.com',
  partnerId: 'your-partner-id',
  bearerToken: 'your-bearer-token',
  apiKey: 'your-api-key'
};

const profile = MLOProfileLib.getProfile('user@example.com', config);

// Example: Compare profiles
const changedFields = MLOProfileLib.compareProfiles(existingProfile, newData);
```

### 3. Configuration Object

All API functions require a configuration object with these properties:

```javascript
const config = {
  baseUrl: 'https://homestory-connect.beta-api.homestoryrewards.com',  // Base API URL
  partnerId: 'your-partner-id',                                          // Partner ID
  bearerToken: 'your-bearer-token',                                      // Bearer token for auth
  apiKey: 'your-api-key'                                                 // API key for auth
};
```

## API Function Reference

### getProfile(email, config)

Retrieves a profile by email address.

**Parameters:**
- `email` (string) - Email address to search for
- `config` (Object) - Configuration object

**Returns:**
- Profile object if found
- `null` if not found

**Throws:**
- Error if API call fails or authentication fails

**Example:**
```javascript
const config = { baseUrl, partnerId, bearerToken, apiKey };
const profile = MLOProfileLib.getProfile('user@example.com', config);

if (profile) {
  Logger.log(`Found profile: ${profile.aggregateId}`);
} else {
  Logger.log('Profile not found');
}
```

### createProfile(profileData, config, dryRun)

Creates a new MLO profile with auto-generated aggregateId.

**Parameters:**
- `profileData` (Object) - Profile data with required fields
- `config` (Object) - Configuration object
- `dryRun` (boolean) - If true, simulates without executing

**Profile Data Structure:**
```javascript
{
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+15551234567',
  nmlsId: '123456',
  mloStatus: 'active',  // 'active' or 'inactive'
  lm: {
    firstName: 'Jane',
    lastName: 'Manager',
    email: 'jane@example.com'
  },
  slm: {
    firstName: 'Bob',
    lastName: 'Senior',
    email: 'bob@example.com'
  }
}
```

**Returns:**
```javascript
{
  success: true,
  message: 'Profile created successfully with aggregateId: xxx',
  aggregateId: 'xxx',
  dryRun: false  // true if dryRun was true
}
```

**Example:**
```javascript
const profileData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+15551234567',
  nmlsId: '123456',
  mloStatus: 'active',
  lm: { firstName: 'Jane', lastName: 'Manager', email: 'jane@example.com' },
  slm: { firstName: 'Bob', lastName: 'Senior', email: 'bob@example.com' }
};

const result = MLOProfileLib.createProfile(profileData, config, false);
Logger.log(result.message);
```

### updateProfile(existingProfile, profileData, mergedData, config, dryRun)

Updates an existing MLO profile.

**Parameters:**
- `existingProfile` (Object) - Existing profile with aggregateId
- `profileData` (Object) - New profile data
- `mergedData` (Object) - Merged data object (from buildMergedData)
- `config` (Object) - Configuration object
- `dryRun` (boolean) - If true, simulates without executing

**Returns:**
```javascript
{
  success: true,
  message: 'Profile updated successfully',
  dryRun: false  // true if dryRun was true
}
```

**Example:**
```javascript
const existingProfile = MLOProfileLib.getProfile('user@example.com', config);
const newData = { /* updated profile data */ };
const mergedData = MLOProfileLib.buildMergedData(existingProfile.data, newData);

const result = MLOProfileLib.updateProfile(
  existingProfile,
  newData,
  mergedData,
  config,
  false
);
Logger.log(result.message);
```

## Utility Function Reference

### compareProfiles(existingProfile, newProfileData)

Compares two profiles and returns list of changed fields.

**Returns:** Array of field names (e.g., `['firstName', 'lm.email', 'mloStatus']`)

### buildMergedData(existingData, newProfileData)

Builds merged data object that preserves existing fields.

**Returns:** Merged data object

### normalizePhone(phone)

Normalizes US phone number to +1XXXXXXXXXX format.

**Input:** `'(555) 123-4567'`, `'555-123-4567'`, `'5551234567'`
**Output:** `'+15551234567'`

### normalizeEmail(email)

Normalizes email to lowercase and trims whitespace.

**Input:** `'User@Example.COM'`
**Output:** `'user@example.com'`

## Error Handling

All library functions throw errors that should be caught by the calling code:

```javascript
try {
  const profile = MLOProfileLib.getProfile(email, config);
} catch (error) {
  Logger.log(`Error: ${error.message}`);
  // Handle error appropriately
}
```

## Best Practices

1. **Version Management**: Always specify a library version in production projects
2. **Configuration Security**: Never hardcode tokens/keys in library calls; pass them via config
3. **Dry Run Testing**: Use `dryRun: true` for testing before making actual API calls
4. **Error Handling**: Always wrap library calls in try-catch blocks
5. **Logging**: Library functions log payloads to console; review logs for debugging

## Support and Updates

- **Library Version**: 1.0.0
- **Last Updated**: 2025-11-16
- **Compatible With**: Google Apps Script V8 runtime

## License

This library is provided as-is for use with the HomeStory Rewards platform.
