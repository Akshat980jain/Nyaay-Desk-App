import React, { useState ,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../ComponentsCSS/Register.css';
const AdvocateRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [advocate_id, setAdvocateId] = useState('');
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  // Enrollment verification data
  const [enrollmentData, setEnrollmentData] = useState({
    enrollment_no: '',
    name: '',
    district: '',
    date_of_registration: '',
    fathers_name: ''
  });

  // Main registration form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    gender: '',
    dob: '',
    address: '',
    iCOP_number: '',
    barId: '',
    cop_document: null,
    practice_details: {
      district_court: false,
      high_court: false,
      state: '',
      district: '',
      high_court_bench: ''
    }
  });
  useEffect(() => {
    const fetchStates = async () => {
      try {
        // FIX #1: Use centralized api instance
        const response = await api.get('/api/states');
        setStates(response.data);
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);
  
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.practice_details.state) return;
      try {
        // FIX #1: Use centralized api instance
        const response = await api.get(`/api/districts/${formData.practice_details.state}`);
        setDistricts(response.data);
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };
    fetchDistricts();
  }, [formData.practice_details.state]);
  // OTP verification
  const [emailOTP, setEmailOTP] = useState('');

  const handleEnrollmentVerification = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const dateObj = new Date(enrollmentData.date_of_registration);
      const formattedDate = `${(dateObj.getMonth() + 1)}/${dateObj.getDate()}/${dateObj.getFullYear()}`;

      // FIX #1: Use centralized api instance
      const response = await api.post(
        '/api/advocate/verify-enrollment',
        { ...enrollmentData, date_of_registration: formattedDate }
      );

      if (response.data.message === 'Enrollment verified successfully') {
        setStep(2);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const registrationFormData = new FormData();
      
      // Add basic fields
      Object.keys(formData).forEach(key => {
        if (key !== 'practice_details' && key !== 'confirmPassword' && key !== 'cop_document') {
          registrationFormData.append(key, formData[key]);
        }
      });

      // Add enrollment data
      Object.keys(enrollmentData).forEach(key => {
        registrationFormData.append(key, enrollmentData[key]);
      });

      // Add practice details
      Object.keys(formData.practice_details).forEach(key => {
        registrationFormData.append(`practice_details[${key}]`, formData.practice_details[key]);
      });

      // Add COP document
      if (formData.cop_document) {
        registrationFormData.append('cop_document', formData.cop_document);
      }

      // FIX #1: Use centralized api instance
      const response = await api.post(
        '/api/advocate/register',
        registrationFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setAdvocateId(response.data.advocate_id);
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    try {
      // FIX #1: Use centralized api instance
      await api.post('/api/advocate/verify-email', {
        advocate_id,
        otp: emailOTP
      });
      navigate('/advlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="advocate-reg-container">
      <div className="advocate-reg-box">
        <h2 className="advocate-reg-heading">Advocate Registration</h2>

        {error && (
          <div className="advocate-reg-error">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEnrollmentVerification} className="advocate-reg-form">
            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Enrollment Number</label>
              <input
                type="text"
                value={enrollmentData.enrollment_no}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  enrollment_no: e.target.value
                })}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Name</label>
              <input
                type="text"
                value={enrollmentData.name}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  name: e.target.value
                })}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Father's Name</label>
              <input
                type="text"
                value={enrollmentData.fathers_name}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  fathers_name: e.target.value
                })}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">District</label>
              <input
                type="text"
                value={enrollmentData.district}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  district: e.target.value
                })}
                className="advocate-reg-input"
                required
              />
            </div>

            <div className="advocate-reg-field">
              <label className="advocate-reg-label">Date of Registration</label>
              <input
                type="date"
                value={enrollmentData.date_of_registration}
                onChange={(e) => setEnrollmentData({
                  ...enrollmentData,
                  date_of_registration: e.target.value
                })}
                className="advocate-reg-input"
                required
              />
            </div>

            <button
              type="submit"
              className="advocate-reg-submit-btn"
            >
              Verify Enrollment
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRegistration} className="advocate-reg-form">
            <div className="advocate-reg-grid">
              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Mobile</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="advocate-reg-select"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field full-width">
                <label className="advocate-reg-label">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="advocate-reg-input textarea"
                  required
                />
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">iCOP Number</label>
                <input
                  type="text"
                  value={formData.iCOP_number}
                  onChange={(e) => setFormData({...formData, iCOP_number: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field">
                <label className="advocate-reg-label">Bar ID</label>
                <input
                  type="text"
                  value={formData.barId}
                  onChange={(e) => setFormData({...formData, barId: e.target.value})}
                  className="advocate-reg-input"
                  required
                />
              </div>

              <div className="advocate-reg-field full-width">
                <label className="advocate-reg-label">COP Document (PDF only)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({
                    ...formData,
                    cop_document: e.target.files[0]
                  })}
                  className="advocate-reg-input file-input"
                  required
                />
              </div>
            </div>

            <div className="advocate-reg-section-box">
              <h3 className="advocate-reg-subheading">Practice Details</h3>
              
              <div className="advocate-reg-grid">
                <div className="advocate-reg-checkbox-group full-width">
                  <label className="advocate-reg-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.practice_details.district_court}
                      onChange={(e) => setFormData({
                        ...formData,
                        practice_details: {
                          ...formData.practice_details,
                          district_court: e.target.checked
                        }
                      })}
                    />
                    District Court
                  </label>
                  <label className="advocate-reg-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.practice_details.high_court}
                      onChange={(e) => setFormData({
                        ...formData,
                        practice_details: {
                          ...formData.practice_details,
                          high_court: e.target.checked
                        }
                      })}
                    />
                    High Court
                  </label>
                </div>
                
                <div className="advocate-reg-field">
                  <label className="advocate-reg-label">State</label>
                  <select
                    value={formData.practice_details.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      practice_details: {
                        ...formData.practice_details,
                        state: e.target.value,
                        district: ''
                      }
                    })}
                    className="advocate-reg-select"
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="advocate-reg-field">
                  <label className="advocate-reg-label">Practice District</label>
                  <select
                    value={formData.practice_details.district}
                    onChange={(e) => setFormData({
                      ...formData,
                      practice_details: {
                        ...formData.practice_details,
                        district: e.target.value
                      }
                    })}
                    className="advocate-reg-select"
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="advocate-reg-field full-width">
                  <label className="advocate-reg-label">High Court Bench</label>
                  <input
                    type="text"
                    value={formData.practice_details.high_court_bench}
                    onChange={(e) => setFormData({
                      ...formData,
                      practice_details: {
                        ...formData.practice_details,
                        high_court_bench: e.target.value
                      }
                    })}
                    className="advocate-reg-input"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="advocate-reg-submit-btn"
            >
              Register
            </button>
          </form>
        )}

        {step === 3 && (
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

export default AdvocateRegistration;