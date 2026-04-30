/**
 * Global Error Handler Middleware — FIX #8
 *
 * Catches all errors thrown in route handlers and returns a consistent,
 * safe JSON error response. Prevents raw stack traces from leaking to
 * the client in production.
 *
 * Must be the LAST middleware registered in app.js:
 *   app.use(errorHandler);
 */

const errorHandler = (err, req, res, next) => {
  // Log the full error server-side for debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Determine appropriate status code
  const statusCode = err.statusCode || err.status || 500;

  // Mongoose validation error — map to 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation failed',
      errors: messages
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      message: `A record with this ${field} already exists.`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authentication token has expired. Please log in again.' });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File size exceeds the allowed limit.' });
  }

  // Generic fallback — never expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    message: isProduction ? 'An internal server error occurred.' : (err.message || 'Internal Server Error'),
    ...(isProduction ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
