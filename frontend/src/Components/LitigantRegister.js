import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ComponentsCSS/Register.css';

const LitigantRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [partyId, setPartyId] = useState('');
  const [emailOTP, setEmailOTP] = useState('');

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const [formData, setFormData] = useState({
    party_type: '',
    full_name: '',
    parentage: '',
    gender: '',
    street: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // List of Indian states for dropdown
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const registrationData = {
        party_type: formData.party_type,
        full_name: formData.full_name,
        parentage: formData.parentage,
        gender: formData.gender,
        street: formData.street,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password
      };

      const response = await axios.post(
        'https://nyaay-desk-app-backend.onrender.com/api/litigant/register',
        registrationData
      );

      setPartyId(response.data.party_id);
      setStep(4); // Move to OTP step
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://nyaay-desk-app-backend.onrender.com/api/litigant/verify-email', {
        party_id: partyId,
        otp: emailOTP
      });

      navigate('/litilogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div className="advocate-reg-container">
      <div className="advocate-reg-box">
        <h2 className="advocate-reg-heading">Litigant Registration</h2>

        {error && (
          <div className="advocate-reg-error">
            {error}
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <form onSubmit={nextStep} className="advocate-reg-form">
            <h3 className="advocate-reg-subheading">Step 1: Personal Details</h3>
            
            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Party Type</label>
              <select
                name="party_type"
                value={formData.party_type}
                onChange={handleChange}
                className="advocate-reg-select"
                required
              >
                <option value="">Select Party Type</option>
                <option value="plaintiff">Plaintiff</option>
                <option value="defendant">Defendant</option>
              </select>
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Parent's Name</label>
              <input
                type="text"
                name="parentage"
                value={formData.parentage}
                onChange={handleChange}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="advocate-reg-select"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="advocate-reg-submit-btn">
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Address Details */}
        {step === 2 && (
          <form onSubmit={nextStep} className="advocate-reg-form">
            <h3 className="advocate-reg-subheading">Step 2: Address Details</h3>
            
            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Street/House/Village</label>
              <textarea
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="advocate-reg-input textarea"
                required
              />
            </div>
            
            <div className="advocate-reg-grid">
              <div className="advocate-reg-field">
                <label className="advocate-reg-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="advocate-reg-input"
                  required
                />
              </div>
              
              <div className="advocate-reg-field">
                <label className="advocate-reg-label">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="advocate-reg-input"
                  required
                />
              </div>
            </div>
            
            <div className="advocate-reg-grid">
              <div className="advocate-reg-field">
                <label className="advocate-reg-label">State</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="advocate-reg-select"
                  required
                >
                  <option value="">Select State</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="advocate-reg-input"
                  pattern="[0-9]{6}"
                  placeholder="6-digit pincode"
                />
              </div>
            </div>

            <div className="advocate-reg-grid">
              <button type="button" onClick={prevStep} className="advocate-reg-submit-btn" style={{backgroundColor: '#64748b'}}>
                Back
              </button>
              <button type="submit" className="advocate-reg-submit-btn">
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Account Details */}
        {step === 3 && (
          <form onSubmit={handleRegistration} className="advocate-reg-form">
            <h3 className="advocate-reg-subheading">Step 3: Account Details</h3>
            
            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Mobile</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="advocate-reg-input"
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-grid">
              <button type="button" onClick={prevStep} className="advocate-reg-submit-btn" style={{backgroundColor: '#64748b'}}>
                Back
              </button>
              <button type="submit" className="advocate-reg-submit-btn">
                Register
              </button>
            </div>
          </form>
        )}

        {/* Step 4: OTP Verification */}
        {step === 4 && (
          <form onSubmit={handleEmailVerification} className="advocate-verification-form">
            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Email OTP</label>
              <input
                type="text"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                className="advocate-verification-input"
                required
              />
              <p className="advocate-verification-instructions">
                Please enter the OTP sent to your email address
              </p>
            </div>
            <button
              type="submit"
              className="advocate-reg-submit-btn"
            >
              Verify Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LitigantRegistration;