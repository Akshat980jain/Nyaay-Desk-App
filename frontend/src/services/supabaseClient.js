/**
 * Supabase Client for Frontend
 * Uses anon key — safe to expose in the browser
 * All write operations are protected by Row Level Security (RLS)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Edge Functions base URL
export const EDGE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;

/**
 * Call a Supabase Edge Function
 * @param {string} functionName - Name of the edge function
 * @param {object} body - Request body
 * @param {boolean} requiresAuth - Whether to include auth token
 */
export const callEdgeFunction = async (functionName, body = {}, requiresAuth = false, method = 'POST') => {
  // Supabase gateway requires BOTH apikey AND Authorization headers.
  // Default to anon key; override with session token if requiresAuth is true.
  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
  };

  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  const options = {
    method,
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, options);


  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Edge function error: ${response.status}`);
  }

  return data;
};

export default supabase;
