/**
 * config.js — Backend URL Configuration
 *
 * ✅ App fully migrated to Supabase.
 * All API calls now use direct Supabase client or Edge Functions.
 * This file is kept to avoid import errors in legacy files.
 */

// Points to Supabase URL — no Render backend needed
const API_BASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  'https://pnneversthhxilensrzq.supabase.co';

export default API_BASE_URL;
