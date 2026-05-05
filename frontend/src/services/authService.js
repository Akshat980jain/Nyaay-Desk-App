/**
 * authService.js
 * 
 * Centralized authentication service using Supabase Edge Functions.
 * Replaces all direct axios calls to the Node.js backend for auth.
 * 
 * Usage:
 *   import authService from '../services/authService';
 *   await authService.loginLitigant(email, password);
 */
import { supabase, callEdgeFunction } from './supabaseClient';

// ─── Session Helpers ──────────────────────────────────────────────────────────

/**
 * Get the current logged-in user's session
 */
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Get the current user's profile from localStorage (fast)
 */
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

export const getUserType = () => localStorage.getItem('userType');
export const getToken = () => localStorage.getItem('token');

/**
 * Save session to localStorage (mirrors existing app structure)
 */
const saveSession = (data) => {
  localStorage.setItem('token', data.access_token);
  // Store refresh_token so Supabase can silently renew the access token
  if (data.refresh_token) {
    localStorage.setItem('refreshToken', data.refresh_token);
  }
  // Ensure userType is always lowercase for consistent routing
  localStorage.setItem('userType', (data.user_type || '').toLowerCase());
  localStorage.setItem('userData', JSON.stringify(data.profile));
};

/**
 * Clear session from localStorage
 */
const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userType');
  localStorage.removeItem('userData');
};

// ─── Login Functions ──────────────────────────────────────────────────────────

export const loginLitigant = async (email, password) => {
  const data = await callEdgeFunction('login-user', { email, password, expected_role: 'litigant' });
  saveSession(data);
  return data;
};

export const loginAdvocate = async (email, password) => {
  const data = await callEdgeFunction('login-user', { email, password, expected_role: 'advocate' });
  saveSession(data);
  return data;
};

export const loginClerk = async (email, password) => {
  const data = await callEdgeFunction('login-user', { email, password, expected_role: 'clerk' });
  saveSession(data);
  return data;
};

export const loginAdmin = async (email, password) => {
  const data = await callEdgeFunction('login-user', { email, password, expected_role: 'admin' });
  saveSession(data);
  return data;
};

// ─── Registration Functions ───────────────────────────────────────────────────

export const registerLitigant = async (profileData) => {
  return await callEdgeFunction('register-user', { user_type: 'litigant', ...profileData });
};

export const registerAdvocate = async (profileData) => {
  return await callEdgeFunction('register-user', { user_type: 'advocate', ...profileData });
};

export const registerClerk = async (profileData) => {
  return await callEdgeFunction('register-user', { user_type: 'clerk', ...profileData });
};

// ─── Password Reset ───────────────────────────────────────────────────────────

export const forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return { message: 'Password reset email sent. Please check your inbox.' };
};

export const resetPassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { message: 'Password updated successfully.' };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async () => {
  await supabase.auth.signOut();
  clearSession();
};

// ─── Auth State Listener ──────────────────────────────────────────────────────

/**
 * Restore the Supabase session from localStorage tokens.
 * Call this ONCE at app startup (before rendering protected routes).
 * This lets the Supabase SDK pick up the stored refresh_token and
 * silently renew the access_token — keeping the user logged in across
 * page reloads without requiring them to re-enter credentials.
 */
export const restoreSession = async () => {
  const accessToken  = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) return null;

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token:  accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      // Tokens are invalid / revoked — clear everything
      clearSession();
      return null;
    }

    // Persist the (possibly refreshed) access token
    if (data?.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
    }
    if (data?.session?.refresh_token) {
      localStorage.setItem('refreshToken', data.session.refresh_token);
    }

    return data?.session ?? null;
  } catch (err) {
    console.error('restoreSession error:', err);
    clearSession();
    return null;
  }
};

/**
 * Subscribe to auth state changes (session refresh, logout, etc.)
 * Call this in your App.js useEffect
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      clearSession();
    } else if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session) {
      // Keep stored tokens in sync whenever Supabase auto-refreshes
      localStorage.setItem('token', session.access_token);
      if (session.refresh_token) {
        localStorage.setItem('refreshToken', session.refresh_token);
      }
    }
    callback(event, session);
  });
  return subscription;
};

const authService = {
  loginLitigant,
  loginAdvocate,
  loginClerk,
  loginAdmin,
  registerLitigant,
  registerAdvocate,
  registerClerk,
  forgotPassword,
  resetPassword,
  logout,
  getSession,
  getCurrentUser,
  getUserType,
  getToken,
  onAuthStateChange,
  restoreSession,
};

export default authService;
