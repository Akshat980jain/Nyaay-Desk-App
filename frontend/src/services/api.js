/**
 * Centralized Axios instance for all API calls.
 * 
 * FIX #1 & #7: Eliminates hardcoded `http://localhost:5000` across every
 * component. Set REACT_APP_API_URL in your .env to point to the backend.
 * Falls back to localhost for local development.
 */
import axios from 'axios';

const BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://nyaay-desk-app-backend.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 300; // ms

api.interceptors.request.use(
  async (config) => {
    // Throttling logic for Render free tier
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_GAP) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
    }
    
    lastRequestTime = Date.now();

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
