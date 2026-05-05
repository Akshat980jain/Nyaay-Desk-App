import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../ComponentsCSS/LitigantLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();

  const [view, setView] = useState('login');
  const [animating, setAnimating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [resetData, setResetData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData({ ...resetData, [name]: value });
    if (name === 'newPassword') checkPasswordStrength(value);
  };

  const handleChangePasswordChange = (e) => {
    const { name, value } = e.target;
    setChangePasswordData({ ...changePasswordData, [name]: value });
    if (name === 'newPassword') checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password) => {
    if (!password) { setPasswordStrength(0); return; }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength >= 4 ? 3 : (strength >= 2 ? 2 : 1));
  };

  const changeView = (newView) => {
    setAnimating(true);
    setTimeout(() => {
      setView(newView);
      setError('');
      setMessage('');
      setAnimating(false);
    }, 300);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.loginAdmin(loginData.email, loginData.password);
      navigate('/admindash');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setError('Please enter your email address first');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(loginData.email);
      setMessage(res.message);
      changeView('resetPassword');
    } catch (err) {
      setError(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      setLoading(false);
      return;
    }
    try {
      const res = await authService.resetPassword(resetData.newPassword);
      setMessage(res.message);
      setTimeout(() => changeView('login'), 3000);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      setLoading(false);
      return;
    }
    try {
      const res = await authService.resetPassword(changePasswordData.newPassword);
      setMessage(res.message);
      setTimeout(() => changeView('login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthClass = () => {
    switch (passwordStrength) {
      case 1: return 'strength-weak';
      case 2: return 'strength-medium';
      case 3: return 'strength-strong';
      default: return '';
    }
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return '';
    }
  };

  const renderLoginForm = () => (
    <div className={`view-transition ${animating ? 'fade-out' : 'fade-in'}`}>
      <h2 className="litigant-title">Court Clerk Login</h2>
      {error && <div className="litigant-error-box">{error}</div>}
      {message && <div className="litigant-success-box">{message}</div>}
      <form onSubmit={handleLoginSubmit}>
        <div className="litigant-form-group">
          <label className="litigant-label">Email</label>
          <input
            type="email"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            className="litigant-input"
            required
            autoFocus
          />
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">Password</label>
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="litigant-input"
            required
          />
        </div>
        <div className="forgot-password-link">
          <span onClick={handleForgotPassword} className="text-link">
            Forgot Password?
          </span>
        </div>
        <button
          type="submit"
          className="litigant-submit-btn"
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
  );

  const renderResetPasswordForm = () => (
    <div className={`view-transition ${animating ? 'fade-out' : 'fade-in'}`}>
      <h2 className="litigant-title">Reset Password</h2>
      {error && <div className="litigant-error-box">{error}</div>}
      {message && <div className="litigant-success-box">{message}</div>}
      <form onSubmit={handleResetSubmit}>
        <div className="litigant-form-group">
          <label className="litigant-label">Reset Token</label>
          <input
            type="text"
            name="token"
            className="litigant-input"
            required
            autoFocus
            placeholder="Enter token from email"
          />
          <div className="form-hint">Enter the token from the reset link sent to your email</div>
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={resetData.newPassword}
            onChange={handleResetChange}
            className="litigant-input"
            required
          />
          {resetData.newPassword && (
            <>
              <div className="password-strength">
                <div className={`password-strength-meter ${getPasswordStrengthClass()}`}></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: '0.25rem', color: passwordStrength === 1 ? '#dc3545' : passwordStrength === 2 ? '#ffc107' : '#198754' }}>
                {getPasswordStrengthLabel()}
              </div>
            </>
          )}
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={resetData.confirmPassword}
            onChange={handleResetChange}
            className="litigant-input"
            required
          />
          {resetData.confirmPassword && resetData.newPassword !== resetData.confirmPassword && (
            <div style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Passwords do not match
            </div>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="litigant-secondary-btn" onClick={() => changeView('login')}>
            Back to Login
          </button>
          <button
            type="submit"
            className="litigant-submit-btn"
            disabled={loading || resetData.newPassword !== resetData.confirmPassword || passwordStrength < 2}
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderChangePasswordForm = () => (
    <div className={`view-transition ${animating ? 'fade-out' : 'fade-in'}`}>
      <h2 className="litigant-title">Change Password</h2>
      {error && <div className="litigant-error-box">{error}</div>}
      {message && <div className="litigant-success-box">{message}</div>}
      <form onSubmit={handleChangePasswordSubmit}>
        <div className="litigant-form-group">
          <label className="litigant-label">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={changePasswordData.currentPassword}
            onChange={handleChangePasswordChange}
            className="litigant-input"
            required
            autoFocus
          />
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={changePasswordData.newPassword}
            onChange={handleChangePasswordChange}
            className="litigant-input"
            required
          />
          {changePasswordData.newPassword && (
            <>
              <div className="password-strength">
                <div className={`password-strength-meter ${getPasswordStrengthClass()}`}></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: '0.25rem', color: passwordStrength === 1 ? '#dc3545' : passwordStrength === 2 ? '#ffc107' : '#198754' }}>
                {getPasswordStrengthLabel()}
              </div>
            </>
          )}
        </div>
        <div className="litigant-form-group">
          <label className="litigant-label">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={changePasswordData.confirmPassword}
            onChange={handleChangePasswordChange}
            className="litigant-input"
            required
          />
          {changePasswordData.confirmPassword && changePasswordData.newPassword !== changePasswordData.confirmPassword && (
            <div style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Passwords do not match
            </div>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="litigant-secondary-btn" onClick={() => changeView('login')}>
            Back to Login
          </button>
          <button
            type="submit"
            className="litigant-submit-btn"
            disabled={loading || changePasswordData.newPassword !== changePasswordData.confirmPassword || passwordStrength < 2}
          >
            {loading ? 'Processing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderCurrentView = () => {
    switch (view) {
      case 'resetPassword':
        return renderResetPasswordForm();
      case 'changePassword':
        return renderChangePasswordForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <div className="litigant-container">
      <div className="litigant-login-box">
        <img
          src="../images/aadiimage4.svg"
          alt="Official Logo"
          className="official-logo"
        />
        <div className="secure-authentication">
          Secure Authentication
        </div>
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default AdminLogin;