# 🚀 CORS Fix - Deployment Instructions

## Problem
API responses showing:
```
Access-Control-Allow-Origin: Not set
Access-Control-Allow-Methods: Not set  
Access-Control-Allow-Headers: Not set
```

## ✅ Solution

The CORS code is already correct in `spreadsheet-script.gs`. The issue is that the updated script needs to be properly deployed.

### Step 1: Update Google Apps Script

1. Open your Google Spreadsheet: `1pKnLsQ-hs1uWfEpyd4rkde0abNx0PtiikB1aAptcJGU`
2. Click **Extensions > Apps Script**
3. **DELETE ALL EXISTING CODE** in the script editor
4. Copy the entire content from `spreadsheet-script.gs` in this project
5. Paste it into the Google Apps Script editor
6. Save the project (Ctrl+S)

### Step 2: Deploy New Version

**CRITICAL**: You must create a NEW deployment version:

1. Click **Deploy > Manage deployments**
2. Click the ⚙️ (gear icon) next to your existing deployment
3. Select **New version** from the dropdown
4. Add description: "CORS headers fix"
5. Click **Deploy**
6. Copy the new web app URL

### Step 3: Verify CORS Headers

The script includes these essential functions:

```javascript
// Handles CORS preflight requests
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
}

// Adds CORS headers to all API responses
function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
}
```

### Step 4: Test the Fix

1. Open `test-cors-fix.html` in your browser
2. Enter your new deployment URL
3. Click "Run All Tests"
4. All tests should show ✅ Success with proper CORS headers

### Step 5: Update Frontend (if needed)

If you're using a different URL in your frontend code, update it to the new deployment URL.

## 🔍 Troubleshooting

### If CORS headers still show "Not set":

1. **Check deployment permissions**:
   - Execute as: **Me** (your account)
   - Who has access: **Anyone**

2. **Clear browser cache** and test again

3. **Wait 1-2 minutes** after deployment for changes to propagate

4. **Verify the script was saved** before deploying

### If you get "Authorization required" errors:

1. Go back to **Deploy > Manage deployments**
2. Click ⚙️ and ensure "Who has access" is set to **Anyone**
3. You may need to re-authorize the script

## ✅ Expected Result

After successful deployment, your API should return:

```
✅ Success - Status: 200

CORS Headers:
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 📝 Notes

- Always create a **new version** when deploying changes
- The old deployment URL will still work but won't have the fixes
- Test with the `test-cors-fix.html` file to verify everything works