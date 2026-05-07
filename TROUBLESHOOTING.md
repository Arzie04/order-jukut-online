# Troubleshooting Guide

## Common Issues and Solutions

### 1. Supabase Environment Variables Error

**Error Message:**
```
[SUPABASE_SERVER] Missing required server env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Error: Supabase server environment variables are not configured. Missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

**Cause:** 
The delivery driver system requires Supabase database but the environment variables are not configured.

**Solution:**

#### Option 1: Configure Supabase (Recommended if you need delivery features)
1. Create a new project at [https://supabase.com](https://supabase.com)
2. Create the required `drivers` table:
   ```sql
   CREATE TABLE drivers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     status TEXT NOT NULL CHECK (status IN ('standby', 'busy', 'offline')),
     is_verified BOOLEAN DEFAULT false,
     telegram_id TEXT,
     name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
3. Get your credentials from Settings > API in Supabase dashboard
4. Create/update `.env.local` file in project root:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Restart the development server

#### Option 2: Use without delivery features
If you don't need delivery features, the application will automatically disable them when Supabase is not configured. The error has been fixed to handle this gracefully.

**Status:** ✅ Fixed - The application now handles missing Supabase configuration gracefully and will disable delivery features automatically.

### 2. Google Apps Script CORS Issues

**Error Message:**
```
Failed to fetch: CORS policy
NetworkError when attempting to fetch resource
```

**Solution:**
- Use the proxy endpoints in `/api/proxy/` instead of calling Google Apps Script directly
- Ensure Google Apps Script is deployed with "Anyone" access
- Check that the APPS_SCRIPT_URL in `app/lib/api-config.ts` is correct

### 3. Development Server Issues

**Common Commands:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 4. Environment Variables

**Required for basic functionality:**
- `APPS_SCRIPT_URL` - Google Apps Script deployment URL

**Optional for delivery features:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Optional for Google Form integration:**
- `GOOGLE_FORM_URL` - Google Form submission URL
- Form field entry IDs (FORM_FIELD_NAMA, etc.)

### 5. Database Connection Issues

**Google Sheets:**
- Verify spreadsheet ID in configuration
- Ensure Google Apps Script is properly deployed
- Check sheet names match the configuration

**Supabase (if used):**
- Verify URL format: `https://xxxxx.supabase.co`
- Ensure service role key is correct
- Check table structure matches requirements

## Getting Help

If you encounter issues not covered here:

1. Check the browser console for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure all dependencies are installed (`npm install`)
4. Try restarting the development server
5. Check the network tab for failed API requests

## Recent Fixes

- **2026-05-07**: Fixed Supabase environment variables error by adding graceful fallback handling
- **2026-05-07**: Added automatic delivery feature disabling when Supabase is not configured
- **2026-05-07**: Created comprehensive setup documentation for Supabase integration