/**
 * Authentication Middleware — FIX #3 & #9
 *
 * Extracted from app.js into its own module so every route file can reuse it.
 * Checks that:
 *   1. A Bearer token is present in Authorization header
 *   2. The token has NOT been blacklisted (logout invalidation)
 *   3. The token is valid and not expired (jwt.verify)
 *
 * Mounted via: const { authenticateToken } = require('../middleware/auth');
 */
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // 1. Check blacklist in Supabase
    const { data: isBlacklisted } = await supabase
      .from('blacklisted_tokens')
      .select('token')
      .eq('token', token)
      .single();

    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been invalidated. Please log in again.' });
    }

    // 2. Verify token with Supabase Auth
    // This is the source of truth for Supabase-based authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Fallback for transition period: Try legacy JWT verification if needed
      // but for a clean migration, we expect Supabase tokens.
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // 3. Map Supabase user to legacy req.user structure
    const userRole = user.user_metadata?.user_role;
    if (!userRole) {
      return res.status(403).json({ message: 'User role not found in token' });
    }

    // Determine profile table
    const tableMap = {
      litigant: 'litigants',
      advocate: 'advocates',
      clerk: 'clerks',
      admin: 'court_admins'
    };

    const tableName = tableMap[userRole];
    if (!tableName) {
      return res.status(403).json({ message: 'Invalid user role' });
    }

    // Fetch the profile to get the legacy ID (e.g., advocate_id)
    const { data: profile, error: profileError } = await supabase
      .from(tableName)
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Populate req.user with fields expected by existing routes
    req.user = {
      ...profile,
      id: user.id,
      email: user.email,
      user_type: userRole,
      // Add explicit mappings for common legacy fields
      advocate_id: profile.advocate_id,
      litigant_id: profile.litigant_id,
      clerk_id: profile.clerk_id,
      admin_id: profile.admin_id
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = { authenticateToken };
