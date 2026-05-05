import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../ComponentsCSS/ClerkLogin.css';

/**
 * ClerkLogin — shared login UI for both the Clerk and Admin portals.
 *
 * Props:
 *   expectedRole {string} — 'clerk' or 'admin'
 *     • 'clerk' → calls authService.loginClerk
 *     • 'admin' → calls authService.loginAdmin
 *
 * On success the Edge Function returns the actual user_type, and this component
 * navigates to the correct dashboard (/clerkdash or /admindash) automatically.
 */
const ClerkLogin = ({ expectedRole = 'clerk' }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pageTitle = expectedRole === 'admin' ? 'Admin Login' : 'Court Clerk Login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginFn = expectedRole === 'admin'
        ? authService.loginAdmin
        : authService.loginClerk;

      const result = await loginFn(formData.email, formData.password);

      if (result.user_type === 'admin') {
        navigate('/admindash');
      } else {
        navigate('/clerkdash');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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

          <button
            type="submit"
            className="clerk-submit-btn"
            disabled={loading}
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