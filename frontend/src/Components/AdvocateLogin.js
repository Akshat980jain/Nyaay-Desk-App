import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.loginAdvocate(formData.email, formData.password);
      navigate('/advdash');
    } catch (err) {
      setError(err.message || 'Login failed');
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