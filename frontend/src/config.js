/**
 * config.js — Backend URL Configuration
 * 
 * ⚠️  The app has been migrated to Supabase.
 * 
 * - Primary API: Supabase Edge Functions (via services/supabaseApi.js)
 * - Supabase URL: process.env.REACT_APP_SUPABASE_URL
 * - No local Node.js server (port 5000) is needed.
 * 
 * This file is kept for legacy components still using scheduleApi.js
 * (CourtAdmin, ClerkDashboard) which may still hit the Render backend.
 * Those will be migrated in the next phase.
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://nyaay-desk-app-backend.onrender.com';

export default API_BASE_URL;
