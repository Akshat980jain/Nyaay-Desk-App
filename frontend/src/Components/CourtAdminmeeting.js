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
  const [loading, setLoading]           = useState(false);
  const [message, setMessage]           = useState({ text: '', type: '' });
  const [error, setError]               = useState(null);
  const [existingMeeting, setExistingMeeting] = useState(null);
  const [cases, setCases]               = useState([]);
  const [selectedCase, setSelectedCase] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  // ── Fetch all cases from Supabase ──────────────────────────────────────────
  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('legal_cases')
        .select('case_num, case_no, plaintiff_details, respondent_details, status')
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

  // ── Handle case selection ──────────────────────────────────────────────────
  const handleCaseChange = (e) => {
    const caseNum = e.target.value;
    setSelectedCase(caseNum);
    setMeetingData({ meetingLink: '', startDateTime: '', endDateTime: '', isActive: true });
    setExistingMeeting(null);
    setMessage({ text: '', type: '' });
    setError(null);
    if (caseNum) fetchExistingMeeting(caseNum);
  };

  // ── Fetch existing meeting for selected case ───────────────────────────────
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

      if (data) {
        setExistingMeeting(data);
        const fmt = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
        setMeetingData({
          meetingLink:   data.meeting_link   || '',
          startDateTime: fmt(data.start_datetime),
          endDateTime:   fmt(data.end_datetime),
          isActive:      data.is_active ?? true,
        });
        setMessage({ text: 'Existing meeting loaded.', type: 'info' });
      } else {
        setMessage({ text: 'No existing meeting for this case.', type: 'info' });
      }
    } catch (err) {
      setMessage({ text: `Failed to load meeting: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMeetingData({ ...meetingData, [name]: type === 'checkbox' ? checked : value });
  };

  // ── Save / update meeting ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase) { setMessage({ text: 'Please select a case first.', type: 'error' }); return; }

    const start = new Date(meetingData.startDateTime);
    const end   = new Date(meetingData.endDateTime);
    if (start >= end) { setMessage({ text: 'End time must be after start time.', type: 'error' }); return; }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const payload = {
        case_number:    selectedCase,
        meeting_link:   meetingData.meetingLink,
        start_datetime: meetingData.startDateTime,
        end_datetime:   meetingData.endDateTime,
        is_active:      meetingData.isActive,
      };

      let err;
      if (existingMeeting) {
        ({ error: err } = await supabase
          .from('video_meetings')
          .update(payload)
          .eq('id', existingMeeting.id));
      } else {
        ({ error: err } = await supabase
          .from('video_meetings')
          .insert(payload));
      }

      if (err) throw err;

      setMessage({ text: existingMeeting ? 'Meeting updated successfully.' : 'Meeting added successfully.', type: 'success' });
      setExistingMeeting({ ...existingMeeting, ...payload });
    } catch (err) {
      setMessage({ text: `Error saving meeting: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Deactivate meeting ─────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!existingMeeting || !selectedCase) return;
    try {
      setLoading(true);
      const { error: err } = await supabase
        .from('video_meetings')
        .update({ is_active: false })
        .eq('id', existingMeeting.id);

      if (err) throw err;

      setMeetingData({ ...meetingData, isActive: false });
      setExistingMeeting({ ...existingMeeting, is_active: false });
      setMessage({ text: 'Meeting deactivated successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: `Error deactivating meeting: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2 className="panel-title">Video Meeting Administration</h2>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      {error         && <div className="message error">{error}</div>}
      {loading       && (
        <div className="loading-indicator">
          <span className="loading-spinner"></span>
          <span>Loading...</span>
        </div>
      )}

      <div className="case-selection">
        <label className="form-label">Select Case</label>
        <select value={selectedCase} onChange={handleCaseChange} className="case-select" disabled={loading}>
          <option value="">-- Select a Case --</option>
          {cases.map((c) => (
            <option key={c.case_num} value={c.case_num}>
              Case #{c.case_num} — {c.plaintiff_details?.name || 'Plaintiff'} vs {c.respondent_details?.name || 'Respondent'}
            </option>
          ))}
        </select>
      </div>

      {cases.length === 0 && !loading && !error && (
        <p className="no-cases-message">No cases found in the system.</p>
      )}

      {selectedCase && (
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label className="form-label">Meeting Link</label>
            <input type="url" name="meetingLink" value={meetingData.meetingLink}
              onChange={handleInputChange} required className="form-input"
              placeholder="https://meet.zoom.us/..." />
          </div>

          <div className="date-group">
            <div className="form-group">
              <label className="form-label">Start Date &amp; Time</label>
              <input type="datetime-local" name="startDateTime" value={meetingData.startDateTime}
                onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date &amp; Time</label>
              <input type="datetime-local" name="endDateTime" value={meetingData.endDateTime}
                onChange={handleInputChange} required className="form-input" />
            </div>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" name="isActive" id="isActive"
              checked={meetingData.isActive} onChange={handleInputChange} className="form-checkbox" />
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
          <p className="info-text"><strong>Note:</strong> Notifications will be sent to all parties involved in this case.</p>
        </div>
      )}

      {!selectedCase && cases.length > 0 && !loading && (
        <p className="select-case-prompt">Please select a case to manage video meeting details.</p>
      )}
    </div>
  );
};

export default AdminMeetingPanel;