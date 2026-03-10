# CORS Fix - Google Apps Script Deployment Guide

## Problem
The application is showing CORS errors:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://script.google.com/macros/s/AKfycbwhQv8nQxzbxESJddGaAZQNpVFF20HepUwe8lzddBqtydqvcQyIB0_KdcWFpOaIbLIZ/exec. (Reason: CORS header 'Access-Control-Allow-Origin' missing). Status code: 500.

Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://script.google.com/macros/s/AKfycbwhQv8nQxzbxESJddGaAZQNpVFF20HepUwe8lzddBqtydqvcQyIB0_KdcWFpOaIbLIZ/exec. (Reason: CORS request did not succeed). Status code: (null).

Error updating stock: TypeError: NetworkError when attempting to fetch resource.
```

This causes all stock items to appear red (unavailable) and prevents config loading and order processing.

## Root Cause
The Google Apps Script deployment has two main CORS issues:
1. The `doOptions` function was commented out, preventing proper handling of CORS preflight requests
2. The `jsonOutput` helper function was missing CORS headers in all API responses

## ✅ FIXED - What Was Changed
The following fixes have been applied to `spreadsheet-script.gs`:

### 1. Enabled doOptions Function
```javascript
// BEFORE: Function was commented out
// function doOptions(e) { ... }

// AFTER: Function is now active
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
```

### 2. Updated jsonOutput Function
```javascript
// BEFORE: No CORS headers
function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// AFTER: Includes CORS headers
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

## Solution Steps

### Step 1: Update Google Apps Script Code
1. Open your Google Spreadsheet: `https://docs.google.com/spreadsheets/d/1pKnLsQ-hs1uWfEpyd4rkde0abNx0PtiikB1aAptcJGU/edit`
2. Click **Extensions > Apps Script**
3. **Delete all existing code** in the script editor
4. Copy the entire content from `spreadsheet-script.gs` in this project
5. Paste it into the Apps Script editor
6. Click **Save** (Ctrl+S or Cmd+S)

### Step 1.5: Test CORS Fix (Optional)
Before deploying, you can test if the CORS headers are working:
1. Open `test-cors-fix.html` in your browser
2. Enter your Google Apps Script URL
3. Click "Run All Tests" to verify CORS headers are present
4. All tests should pass with green checkmarks

### Step 2: Create New Deployment
**IMPORTANT**: You must create a new deployment for CORS changes to take effect.

1. In the Apps Script editor, click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description**: "CORS Fix - v2" (or any descriptive name)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. **Copy the new Web app URL** that appears

### Step 3: Update Frontend (if URL changed)
If you got a new URL from step 2, you need to update the frontend code:

1. Open `app/components/OrderingPage.tsx`
2. Find all instances of the old URL and replace with the new one:
   ```typescript
   // Replace this URL with your new deployment URL
   const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
   ```

### Step 4: Test the Fix
1. Open your browser's Developer Tools (F12)
2. Go to the **Network** tab
3. Refresh your application
4. Look for the API calls to your Google Apps Script
5. Check that the response headers include:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

### Step 5: Clear Browser Cache
If you're still seeing CORS errors:
1. Clear your browser cache completely
2. Or open the application in an incognito/private window
3. Or try a different browser

## Verification Checklist
- [ ] Google Apps Script code updated with latest version
- [ ] New deployment created (not just saved)
- [ ] Deployment permissions set to "Anyone"
- [ ] Frontend URL updated (if changed)
- [ ] Browser cache cleared
- [ ] Stock items showing correct colors (not all red)
- [ ] Config loading without errors
- [ ] No CORS errors in browser console

## Troubleshooting

### Still Getting CORS Errors?
1. **Check deployment permissions**: Make sure "Who has access" is set to "Anyone"
2. **Verify the URL**: Make sure you're using the latest deployment URL
3. **Check browser console**: Look for any other error messages
4. **Test API directly**: Try accessing the API URL directly in browser:
   ```
   https://your-script-url/exec?api=stock
   ```

### Stock Still Showing Red?
1. **Check spreadsheet data**: Verify the "Stok outlet Cempaka" sheet has data
2. **Check column structure**: Ensure columns are: A=id_item, B=nama_item, C=stok, D=status, E=catatan
3. **Check API response**: Look in browser console for API response data

### Config Not Loading?
1. **Check config data**: Verify cells F2:H2 in the stock sheet contain: jam_buka, jam_tutup, max_pesanan
2. **Check API response**: Look for config API calls in browser network tab

## Technical Details
The updated Google Apps Script includes:
- Proper CORS headers in `doOptions()` function for preflight requests
- CORS headers in `jsonOutput()` helper function for all responses
- Support for all required HTTP methods (GET, POST, OPTIONS)
- Proper error handling with CORS headers

## Need Help?
If you're still experiencing issues after following this guide:
1. Check the browser console for specific error messages
2. Verify the Google Apps Script execution transcript for errors
3. Test the API endpoints individually to isolate the problem