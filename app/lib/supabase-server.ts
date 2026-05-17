import { createClient } from '@supabase/supabase-js';

import { devError } from '@/app/lib/logger';

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || '';
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes('your_supabase_url_here') ||
    normalized.includes('your_supabase_service_role_key_here')
  );
}

export function createSupabaseServerClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    const missingVariables = [
      !supabaseUrl ? 'SUPABASE_URL' : null,
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ].filter(Boolean);

    devError(
      '[SUPABASE_SERVER] Missing required server env:',
      missingVariables.join(', ')
    );

    throw new Error(
      `Supabase server environment variables are not configured. Missing: ${missingVariables.join(', ')}`
    );
  }

  if (!isValidHttpUrl(supabaseUrl) || isPlaceholderValue(supabaseUrl)) {
    const message = 'SUPABASE_URL is invalid. Expected a valid HTTP/HTTPS Supabase URL.';
    devError('[SUPABASE_SERVER] Invalid SUPABASE_URL:', supabaseUrl);
    throw new Error(message);
  }

  if (isPlaceholderValue(serviceRoleKey)) {
    const message = 'SUPABASE_SERVICE_ROLE_KEY is invalid. Replace placeholder with real key.';
    devError('[SUPABASE_SERVER] Invalid SUPABASE_SERVICE_ROLE_KEY placeholder detected.');
    throw new Error(message);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client with graceful fallback for missing environment variables
 * Returns null if Supabase is not configured, allowing callers to handle gracefully
 */
export function createSupabaseServerClientSafe() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    const missingVariables = [
      !supabaseUrl ? 'SUPABASE_URL' : null,
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ].filter(Boolean);

    devError(
      '[SUPABASE_SERVER] Missing required server env (safe mode):',
      missingVariables.join(', ')
    );

    return null;
  }

  if (!isValidHttpUrl(supabaseUrl) || isPlaceholderValue(supabaseUrl) || isPlaceholderValue(serviceRoleKey)) {
    devError(
      '[SUPABASE_SERVER] Invalid server env (safe mode): SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
    );
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
