/**
 * Centralized Axios instance for all API calls.
 * 
 * FIX #1 & #7: Eliminates hardcoded `http://localhost:5000` across every
 * component. Set REACT_APP_API_URL in your .env to point to the backend.
 * Falls back to localhost for local development.
 */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Automatically attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
// Handle 401 Unauthorized globally (e.g., expired token) → force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired — clear session and redirect to home
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      // Only redirect if not already on a public page
      const publicPaths = ['/', '/advlogin', '/litilogin', '/clerklogin', '/adminlogin'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
