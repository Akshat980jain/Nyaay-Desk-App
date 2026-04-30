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
const BlacklistedToken = require('../models/Blaclisttoken');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // FIX #9: Check blacklist BEFORE verifying — this catches logged-out tokens
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been invalidated. Please log in again.' });
    }

    // jwt.verify also throws TokenExpiredError if expired — caught by errorHandler
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Pass JWT-specific errors to the global error handler for consistent messaging
    next(error);
  }
};

module.exports = { authenticateToken };
