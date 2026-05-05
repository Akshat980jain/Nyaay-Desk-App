import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/Login.css';

const AdvocateLogin = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType')?.toLowerCase();
    if (token && userType === 'advocate') {
      navigate('/advdash');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isDev = window.location.hostname === 'localhost';
  const [turnstileToken, setTurnstileToken] = useState(isDev ? 'dev-bypass' : null);
  const turnstileRef = useRef(null);
  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isDev && !turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      await authService.loginAdvocate(formData.email, formData.password);
      navigate('/advdash');
    } catch (err) {
      setError(err.message || 'Login failed');
      setTurnstileToken(null);
      if (turnstileRef.current) turnstileRef.current.reset();
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
          <div className="advocate-form-group turnstile-container">
            {!isDev && (
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setError('');
                }}
                onError={() => {
                  setError('CAPTCHA verification failed. Please try again.');
                  setTurnstileToken(null);
                }}
                onExpire={() => {
                  setError('CAPTCHA expired. Please verify again.');
                  setTurnstileToken(null);
                }}
                theme="light"
                size="normal"
                responseField={false}
                refreshExpired="auto"
                appearance="interaction-only"
              />
            )}
          </div>
          <button 
            type="submit" 
            className="advocate-submit-btn"
            disabled={loading || !turnstileToken}
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvocateLogin;