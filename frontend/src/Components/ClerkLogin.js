import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/ClerkLogin.css';

const ClerkLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Auto-bypass Turnstile on localhost (site key is production-only)
  const isDev = window.location.hostname === 'localhost';
  const [turnstileToken, setTurnstileToken] = useState(isDev ? 'dev-bypass' : null);
  const turnstileRef = useRef(null);

  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      const response = await axios.post('https://nyaay-desk-app-backend.onrender.com/api/clerk/login', {
        ...formData,
        'cf-turnstile-response': turnstileToken
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'clerk');
      localStorage.setItem('userData', JSON.stringify(response.data.clerk));
      navigate('/clerkdash');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setTurnstileToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clerk-container">
      <div className="clerk-login-box">
        <img 
          src="../images/aadiimage4.svg" 
          alt="Official Logo" 
          className="official-logo"
        />
        <div className="secure-authentication2">
          Secure Authentication
        </div>
        <h2 className="clerk-title">Admin Login</h2>

        {error && (
          <div className="clerk-error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="clerk-form-group">
            <label className="clerk-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="clerk-input"
              required
            />
          </div>
          <div className="clerk-form-group">
            <label className="clerk-label">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="clerk-input"
              required
            />
          </div>
          <button 
            type="submit" 
            className="clerk-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClerkLogin;