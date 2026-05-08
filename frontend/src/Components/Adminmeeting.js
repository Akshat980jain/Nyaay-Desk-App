import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import '../ComponentsCSS/adminmeeting.css';

const AdminMeetingPanel = () => {
  const [meetingData, setMeetingData] = useState({
    meetingLink: '',
    startDateTime: '',
    endDateTime: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [error, setError] = useState(null);
  const [existingMeeting, setExistingMeeting] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  // Fetch all cases from Supabase
  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('legal_cases')
        .select('case_num, plaintiff_details, respondent_details, status')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setCases(data || []);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch cases: ${err.message}`);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseChange = (e) => {
    const caseNum = e.target.value;
    setSelectedCase(caseNum);
    setMeetingData({ meetingLink: '', startDateTime: '', endDateTime: '', isActive: true });
    setExistingMeeting(null);
    setMessage({ text: '', type: '' });
    setError(null);
    if (caseNum) fetchExistingMeeting(caseNum);
  };

  // Fetch existing meeting from Supabase video_meetings table
  const fetchExistingMeeting = async (caseNum) => {
    if (!caseNum) return;
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('video_meetings')
        .select('*')
        .eq('case_number', caseNum)
        .maybeSingle();
      if (err) throw err;

        if (data?.meeting_link) {
          setExistingMeeting(data);
          const fmt = (d) => {
            try {
              return d ? new Date(d).toISOString().slice(0, 16) : '';
            } catch (e) {
              return '';
            }
          };
          setMeetingData({
            meetingLink: data.meeting_link,
            startDateTime: fmt(data.start_datetime),
            endDateTime: fmt(data.end_datetime),
            isActive: data.is_active,
          });
        setMessage({ text: 'Existing meeting loaded.', type: 'info' });
      } else {
        setMessage({ text: 'No existing meeting found for this case.', type: 'info' });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to fetch meeting details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMeetingData({ ...meetingData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase) { setMessage({ text: 'Please select a case first.', type: 'error' }); return; }
    const start = new Date(meetingData.startDateTime);
    const end = new Date(meetingData.endDateTime);
    if (start >= end) { setMessage({ text: 'End time must be after start time.', type: 'error' }); return; }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const payload = {
        case_number: selectedCase,
        meeting_link: meetingData.meetingLink,
        start_datetime: meetingData.startDateTime,
        end_datetime: meetingData.endDateTime,
        is_active: meetingData.isActive,
        updated_at: new Date().toISOString(),
      };

      let err;
      if (existingMeeting) {
        ({ error: err } = await supabase
          .from('video_meetings')
          .update(payload)
          .eq('case_number', selectedCase));
      } else {
        ({ error: err } = await supabase
          .from('video_meetings')
          .insert([{ ...payload, created_at: new Date().toISOString() }]));
      }
      if (err) throw err;

      setMessage({ text: existingMeeting ? 'Meeting updated successfully' : 'Meeting added successfully', type: 'success' });
      setExistingMeeting(payload);
    } catch (err) {
      setMessage({ text: err.message || 'Error saving meeting details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!existingMeeting || !selectedCase) return;
    try {
      setLoading(true);
      const { error: err } = await supabase
        .from('video_meetings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('case_number', selectedCase);
      if (err) throw err;
      setMessage({ text: 'Meeting deactivated successfully', type: 'success' });
      setMeetingData({ ...meetingData, isActive: false });
      setExistingMeeting({ ...existingMeeting, is_active: false });
    } catch (err) {
      setMessage({ text: err.message || 'Error deactivating meeting', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2 className="panel-title">Video Meeting Administration</h2>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      {error && <div className="message error">{error}</div>}
      {loading && (
        <div className="loading-indicator">
          <span className="loading-spinner"></span>
          <span>Loading...</span>
        </div>
      )}

      <div className="case-selection">
        <label className="form-label">Select Case</label>
        <select value={selectedCase} onChange={handleCaseChange} className="case-select" disabled={loading}>
          <option value="">-- Select a Case --</option>
          {cases.map((caseItem) => (
            <option key={caseItem.case_num} value={caseItem.case_num}>
              Case #{caseItem.case_num} —{' '}
              {caseItem.plaintiff_details?.name || 'Plaintiff'} vs{' '}
              {caseItem.respondent_details?.name || 'Respondent'}
            </option>
          ))}
        </select>
      </div>

      {cases.length === 0 && !loading && !error && (
        <p className="no-cases-message">No cases found. Please check with the system administrator.</p>
      )}

      {selectedCase && (
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label className="form-label">Meeting Link</label>
            <input type="url" name="meetingLink" value={meetingData.meetingLink} onChange={handleInputChange} required className="form-input" placeholder="https://meet.zoom.us/..." />
          </div>
          <div className="date-group">
            <div className="form-group">
              <label className="form-label">Start Date &amp; Time</label>
              <input type="datetime-local" name="startDateTime" value={meetingData.startDateTime} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date &amp; Time</label>
              <input type="datetime-local" name="endDateTime" value={meetingData.endDateTime} onChange={handleInputChange} required className="form-input" />
            </div>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" name="isActive" id="isActive" checked={meetingData.isActive} onChange={handleInputChange} className="form-checkbox" />
            <label htmlFor="isActive" className="checkbox-label">Meeting is active</label>
          </div>
          <div className="button-group">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : existingMeeting ? 'Update Meeting' : 'Add Meeting'}
            </button>
            {existingMeeting && meetingData.isActive && (
              <button type="button" onClick={handleDeactivate} disabled={loading} className="btn btn-danger">
                {loading ? 'Deactivating...' : 'Deactivate Meeting'}
              </button>
            )}
          </div>
        </form>
      )}

      {existingMeeting && (
        <div className="info-box">
          <h4 className="info-title">Meeting Information</h4>
          <p className="info-text"><strong>Status:</strong> {meetingData.isActive ? 'Active' : 'Inactive'}</p>
          <p className="info-text"><strong>Note:</strong> Meeting links are accessible to litigants only after OTP verification.</p>
        </div>
      )}

      {!selectedCase && cases.length > 0 && !loading && (
        <p className="select-case-prompt">Please select a case to manage video meeting details.</p>
      )}
    </div>
  );
};

export default AdminMeetingPanel;