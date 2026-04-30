/**
 * Centralized backend URL configuration.
 * 
 * Uses REACT_APP_API_URL from environment:
 *   - npm start (dev):   http://localhost:5000  (from .env.development)
 *   - npm run build:     https://nyaay-desk-app-backend.onrender.com (from .env.production)
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
