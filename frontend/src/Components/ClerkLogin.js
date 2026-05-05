import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { Turnstile } from '@marsidev/react-turnstile';
import '../ComponentsCSS/ClerkLogin.css';

/**
 * ClerkLogin — shared login UI for both the Clerk and Admin portals.
 *
 * Props:
 *   expectedRole {string} — 'clerk' or 'admin'
 *     • 'clerk' → calls authService.loginClerk (expected_role='clerk' sent to Edge Function)
 *     • 'admin' → calls authService.loginAdmin (expected_role='admin' sent to Edge Function)
 *
 * On success the Edge Function returns the actual user_type, and this component
 * navigates to the correct dashboard (/clerkdash or /admindash) automatically.
 */
const ClerkLogin = ({ expectedRole = 'clerk' }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // On localhost, bypass Cloudflare Turnstile (production site key won't validate locally)
  const isDev = window.location.hostname === 'localhost';
  const [turnstileToken, setTurnstileToken] = useState(isDev ? 'dev-bypass' : null);
  const turnstileRef = useRef(null);

  const siteKey = '0x4AAAAAABUex35iY9OmXSBB';

  // Derive display title from the prop
  const pageTitle = expectedRole === 'admin' ? 'Admin Login' : 'Court Clerk Login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isDev && !turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      // Choose the correct auth method based on the expectedRole prop.
      // The Edge Function uses expected_role to validate against user_metadata.user_role.
      const loginFn = expectedRole === 'admin'
        ? authService.loginAdmin
        : authService.loginClerk;

      const result = await loginFn(formData.email, formData.password);

      // Edge Function returns the *actual* user_type in the token.
      // Route to the correct dashboard regardless of which portal was used.
      if (result.user_type === 'admin') {
        navigate('/admindash');
      } else {
        navigate('/clerkdash');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      // Restore the dev bypass token so the button stays enabled after an error
      if (isDev) {
        setTurnstileToken('dev-bypass');
      } else {
        setTurnstileToken(null);
        if (turnstileRef.current) turnstileRef.current.reset();
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
        <div className="secure-authentication2">Secure Authentication</div>
        <h2 className="clerk-title">{pageTitle}</h2>

        {error && (
          <div className="clerk-error-box">{error}</div>
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

          <div className="clerk-form-group turnstile-container">
            {!isDev && (
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={(token) => { setTurnstileToken(token); setError(''); }}
                onError={() => { setError('CAPTCHA verification failed. Please try again.'); setTurnstileToken(null); }}
                onExpire={() => { setError('CAPTCHA expired. Please verify again.'); setTurnstileToken(null); }}
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
            className="clerk-submit-btn"
            disabled={loading || (!isDev && !turnstileToken)}
          >
            {loading ? (
              <>
                <span style={{ marginRight: '8px' }}>Login</span>
                <span className="btn-spinner" />
              </>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClerkLogin;