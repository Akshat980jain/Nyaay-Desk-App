import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — FIX #9
 *
 * Guards a dashboard route. Now also:
 *   1. Checks for a token in localStorage
 *   2. Decodes the JWT payload to check the `exp` (expiry) field client-side
 *      so expired tokens are caught before making any API call.
 *   3. Validates the `user_type` matches the required role.
 *
 * If invalid/expired, clears localStorage and redirects to the login page.
 *
 * @param {string} requiredRole - The userType required ('litigant', 'advocate', 'clerk', 'admin')
 * @param {string} redirectTo   - Where to send unauthenticated users
 */
const decodeJwtPayload = (token) => {
  try {
    // JWT is three Base64URL segments: header.payload.signature
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userType');
  localStorage.removeItem('userData');
};

const ProtectedRoute = ({ children, requiredRole, redirectTo = '/' }) => {
  const token        = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const userType     = localStorage.getItem('userType');

  // No token AND no refresh token → definitely logged out
  if (!token && !refreshToken) {
    return <Navigate to={redirectTo} replace />;
  }

  if (token) {
    const payload = decodeJwtPayload(token);

    if (!payload || !payload.exp) {
      // Malformed token — only hard-redirect if there's no refresh token either
      if (!refreshToken) {
        clearSession();
        return <Navigate to={redirectTo} replace />;
      }
      // Else: let the child render; App.js restoreSession() will fix the token
    } else {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSeconds && !refreshToken) {
        // Access token expired and no refresh token — force login
        clearSession();
        return <Navigate to={redirectTo} replace />;
      }
      // If expired but refreshToken exists: restoreSession() in App.js has already
      // renewed it. Allow render; the next API call will use the refreshed token.
    }
  }

  // Wrong role for this route → redirect to home
  if (requiredRole && userType?.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
