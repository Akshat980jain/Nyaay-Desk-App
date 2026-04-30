import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// ─── Dynamic API URL Configuration ──────────────────────────────────────────
// This interceptor ensures the app works BOTH locally and when hosted.
//   • npm start (dev)  → REACT_APP_API_URL = http://localhost:5000
//   • npm run build    → REACT_APP_API_URL = https://nyaay-desk-app-backend.onrender.com
// It rewrites any hardcoded Render URL to the correct environment URL.
const HOSTED_URL = 'https://nyaay-desk-app-backend.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Axios: intercept every request and rewrite the base URL
axios.interceptors.request.use((config) => {
  if (config.url) {
    config.url = config.url.replace(HOSTED_URL, API_BASE);
  }
  if (config.baseURL) {
    config.baseURL = config.baseURL.replace(HOSTED_URL, API_BASE);
  }
  return config;
});

// Fetch: wrap the native fetch to rewrite URLs too
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === 'string') {
    url = url.replace(HOSTED_URL, API_BASE);
  }
  return originalFetch.call(this, url, options);
};

console.log(`[API] Using backend: ${API_BASE}`);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
