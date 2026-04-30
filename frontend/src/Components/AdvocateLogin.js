import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/Login.css';

const AdvocateLogin = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (token && userType === 'advocate') {
      navigate('/advdash');
    }
  }, [navigate]);

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

  // FIX #2: Read from environment variable — never hardcode secrets in source
  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      // FIX #1: Uses centralized api instance — no hardcoded URL
      const response = await api.post('/api/advocate/login', {
        ...formData,
        'cf-turnstile-response': turnstileToken
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'advocate');
      localStorage.setItem('userData', JSON.stringify(response.data.advocate));
      navigate('/advdash');
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
    <div className="advocate-container">
      <div className="advocate-login-box">
        <img 
          src="../images/aadiimage4.svg" 
          alt="Official Logo" 
          className="official-logo"
        />
        <div className="secure-authentication">
          Secure Authentication
        </div>
        <h2 className="advocate-title">Advocate Login</h2>
        {error && (
          <div className="advocate-error-box">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="advocate-form-group">
            <label className="advocate-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="advocate-input"
              required
            />
          </div>
          <div className="advocate-form-group">
            <label className="advocate-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="advocate-input"
              required
            />
          </div>
          <button 
            type="submit" 
            className="advocate-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvocateLogin;