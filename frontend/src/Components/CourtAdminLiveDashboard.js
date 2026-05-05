import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, XCircle, Calendar, Edit2, RotateCcw, Trash2, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import '../ComponentsCSS/CourtAdminLiveDashboard.css';

const CourtAdminLiveDashboard = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [courtNo, setCourtNo] = useState('');
  const [adminProfile, setAdminProfile] = useState(null);
  
  // Scheduling form states
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [availableCases, setAvailableCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  
  // Manual time picker states
  const [schedulingMode, setSchedulingMode] = useState('auto');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [timeConflict, setTimeConflict] = useState(null);

  // Edit timing states
  const [editingCase, setEditingCase] = useState(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [cascadeUpdates, setCascadeUpdates] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (courtNo) {
      loadSchedule();
    }
  }, [courtNo]);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      // Read admin data stored at login time
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setAdminProfile(userData);
      const court = userData.court_no || userData.court_name || userData.courtNo || 'COURT-1';
      setCourtNo(court);
    } catch (err) {
      console.error('Error reading admin profile:', err);
      setCourtNo('COURT-1'); // fallback
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onScheduleUpdated((data) => {
      if (data.court_no === courtNo) {
        loadSchedule();
        showSuccess('Schedule updated in real-time');
      }
    });

    socketService.onCaseStarted((data) => {
      if (data.court_no === courtNo) loadSchedule();
    });

    socketService.onCaseEnded((data) => {
      if (data.court_no === courtNo) loadSchedule();
    });

    socketService.onCaseDismissed((data) => {
      if (data.court_no === courtNo) loadSchedule();
    });

    socketService.socket?.on('hearing_reopened', (data) => {
      if (data.court_no === courtNo) {
        loadSchedule();
        showSuccess(`Hearing ${data.case_num} reopened`);
      }
    });

    socketService.socket?.on('case_removed', (data) => {
      if (data.court_no === courtNo) {
        loadSchedule();
        showSuccess(`Case ${data.case_num} removed from schedule`);
      }
    });
  };

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error: err } = await supabase
        .from('court_schedule')
        .select('*')
        .eq('court_no', courtNo)
        .eq('schedule_date', today)
        .maybeSingle();
      if (err) throw err;
      setSchedule(data || { scheduled_cases: [], court_no: courtNo, schedule_date: today });
      setError(null);
    } catch (err) {
      console.error('Error loading schedule:', err);
      // If table doesn't exist yet, show empty schedule instead of error
      setSchedule({ scheduled_cases: [], court_no: courtNo });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCases = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error: err } = await supabase
        .from('legal_cases')
        .select('*')
        .not('hearings', 'is', null);
      if (err) throw err;
      const casesForToday = (data || []).filter(c => {
        if (!c.hearings || c.hearings.length === 0) return false;
        return c.hearings.some(h => {
          if (!h.next_hearing_date) return false;
          return h.next_hearing_date.split('T')[0] === today && !h.is_listed_for_today;
        });
      });
      setAvailableCases(casesForToday);
      if (casesForToday.length === 0) setError('No cases available for listing today.');
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSuggestedSlots = async () => {
    // Compute locally from current schedule
    const cases = schedule?.scheduled_cases || [];
    const now = new Date();
    const endOfDay = new Date(); endOfDay.setHours(17, 0, 0, 0);
    const suggestions = [];
    let cur = new Date(Math.max(now.getTime(), new Date().setHours(10,0,0,0)));
    while (cur < endOfDay && suggestions.length < 5) {
      const end = new Date(cur.getTime() + estimatedDuration * 60000);
      const conflict = cases.some(c => {
        const s = new Date(c.listing_time_start), e = new Date(c.listing_time_end);
        return cur < e && end > s;
      });
      if (!conflict && end <= endOfDay) suggestions.push({ start_time: new Date(cur), end_time: end });
      cur = new Date(cur.getTime() + 30 * 60000);
    }
    setSuggestedSlots(suggestions);
  };

  useEffect(() => {
    if (schedulingMode === 'manual' && manualStartTime && manualEndTime) {
      const cases = schedule?.scheduled_cases || [];
      const s = new Date(manualStartTime), e = new Date(manualEndTime);
      const conflicts = cases.filter(c => {
        const cs = new Date(c.listing_time_start), ce = new Date(c.listing_time_end);
        return s < ce && e > cs;
      });
      setTimeConflict(conflicts.length > 0 ? conflicts : null);
    } else {
      setTimeConflict(null);
    }
  }, [manualStartTime, manualEndTime, schedulingMode]);

  const handleStartHearing = async (caseNum) => {
    try {
      const cases = (schedule?.scheduled_cases || []).map(c =>
        c.case_num === caseNum ? { ...c, status: 'in_progress', actual_start_time: new Date().toISOString() } : c
      );
      await updateSchedule(cases);
      showSuccess('Hearing started successfully');
    } catch (err) { setError(err.message); }
  };

  const handleEndHearing = async (caseNum) => {
    try {
      const cases = (schedule?.scheduled_cases || []).map(c =>
        c.case_num === caseNum ? { ...c, status: 'completed', actual_end_time: new Date().toISOString() } : c
      );
      await updateSchedule(cases);
      showSuccess('Hearing ended successfully');
    } catch (err) { setError(err.message); }
  };

  const handleDismissHearing = async (caseNum) => {
    try {
      const cases = (schedule?.scheduled_cases || []).map(c =>
        c.case_num === caseNum ? { ...c, status: 'dismissed' } : c
      );
      await updateSchedule(cases);
      showSuccess('Hearing dismissed');
    } catch (err) { setError(err.message); }
  };

  const handleReopenHearing = async (caseNum) => {
    if (!window.confirm('Reopen this hearing?')) return;
    try {
      const cases = (schedule?.scheduled_cases || []).map(c =>
        c.case_num === caseNum ? { ...c, status: 'scheduled', actual_start_time: null, actual_end_time: null } : c
      );
      await updateSchedule(cases);
      showSuccess('Hearing reopened successfully');
    } catch (err) { setError(err.message); }
  };

  const handleRemoveCase = async (caseNum) => {
    if (!window.confirm('Remove this case from schedule?')) return;
    try {
      const cases = (schedule?.scheduled_cases || []).filter(c => c.case_num !== caseNum);
      await updateSchedule(cases);
      showSuccess('Case removed from schedule');
    } catch (err) { setError(err.message); }
  };

  // Helper: persist updated scheduled_cases array to Supabase
  const updateSchedule = async (updatedCases) => {
    const today = new Date().toISOString().split('T')[0];
    if (schedule?.id) {
      const { error: err } = await supabase
        .from('court_schedule')
        .update({ scheduled_cases: updatedCases })
        .eq('id', schedule.id);
      if (err) throw err;
    } else {
      const { data, error: err } = await supabase
        .from('court_schedule')
        .insert({ court_no: courtNo, schedule_date: today, scheduled_cases: updatedCases })
        .select().single();
      if (err) throw err;
      setSchedule(prev => ({ ...prev, id: data.id }));
    }
    setSchedule(prev => ({ ...prev, scheduled_cases: updatedCases }));
  };

  const handleEditTiming = (caseItem) => {
    setEditingCase(caseItem.case_num);
    
    const start = new Date(caseItem.listing_time_start);
    const end = new Date(caseItem.listing_time_end);
    
    setEditStartTime(formatDateTimeLocal(start));
    setEditEndTime(formatDateTimeLocal(end));
  };

  const handleSaveEditedTiming = async (caseNum) => {
    try {
      const startDate = new Date(editStartTime);
      const endDate = new Date(editEndTime);
      const now = new Date();

      if (startDate < now) {
        setError('Cannot schedule in the past');
        return;
      }

      if (endDate <= startDate) {
        setError('End time must be after start time');
        return;
      }

      await updateCaseTiming({
        schedule_id: schedule.schedule_id,
        case_num: caseNum,
        new_start_time: startDate.toISOString(),
        new_end_time: endDate.toISOString(),
        cascade_updates: cascadeUpdates
      });

      setEditingCase(null);
      loadSchedule();
      showSuccess('Timing updated successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddToSchedule = async () => {
    if (!selectedCase || !selectedHearing) {
      setError('Please select a case and hearing');
      return;
    }
    try {
      const now = new Date();
      const startTime = schedulingMode === 'manual' && manualStartTime
        ? new Date(manualStartTime)
        : now;
      const endTime = schedulingMode === 'manual' && manualEndTime
        ? new Date(manualEndTime)
        : new Date(startTime.getTime() + estimatedDuration * 60000);

      const newEntry = {
        case_num: selectedCase.case_num,
        case_type: selectedCase.case_type,
        plaintiff_name: selectedCase.plaintiff_details?.name || '',
        respondent_name: selectedCase.respondent_details?.name || '',
        listing_time_start: startTime.toISOString(),
        listing_time_end: endTime.toISOString(),
        status: 'scheduled',
        listing_order: (schedule?.scheduled_cases?.length || 0) + 1
      };

      const updatedCases = [...(schedule?.scheduled_cases || []), newEntry];
      await updateSchedule(updatedCases);

      setShowScheduleForm(false);
      setSelectedCase(null);
      setSelectedHearing(null);
      setEstimatedDuration(60);
      setSchedulingMode('auto');
      setManualStartTime('');
      setManualEndTime('');
      setError(null);
      showSuccess('Case added to schedule successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const calculateElapsedTime = (startTime) => {
    const elapsed = Math.floor((currentTime - new Date(startTime)) / 1000 / 60);
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#fbbf24',
      in_progress: '#10b981',
      completed: '#6b7280',
      dismissed: '#ef4444',
      adjourned: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const currentCase = schedule?.scheduled_cases?.find(c => c.status === 'in_progress') 
    || schedule?.scheduled_cases?.[schedule.current_case_index];
    
  const upcomingCases = schedule?.scheduled_cases?.filter(c => 
    c.status === 'scheduled' && 
    (!currentCase || c.listing_order > currentCase.listing_order)
  ) || [];

  if (loading && !schedule) {
    return (
      <div className="cadash-loading-container">
        <Clock size={24} className="cadash-loading-icon" />
        <span>Loading court schedule...</span>
      </div>
    );
  }

  return (
    <div className="cadash-wrapper">
      <div className="cadash-header">
        <div className="cadash-header-info">
          <h1 className="cadash-title">Live Court Dashboard</h1>
          <div className="cadash-court-info">
            <div className="cadash-info-item">
              <span className="cadash-info-label">Court No:</span>
              <span className="cadash-info-value">{courtNo}</span>
            </div>
            <div className="cadash-info-item">
              <span className="cadash-info-label">Current Time:</span>
              <span className="cadash-info-value">{currentTime.toLocaleTimeString()}</span>
            </div>
            {schedule && (
              <div className="cadash-info-item">
                <span className="cadash-info-label">Cases Today:</span>
                <span className="cadash-info-value">{schedule.scheduled_cases?.length || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="cadash-alert cadash-alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="cadash-alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="cadash-alert cadash-alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="cadash-alert-close">×</button>
        </div>
      )}

      <div className="cadash-add-section">
        <button
          onClick={() => {
            setShowScheduleForm(!showScheduleForm);
            if (!showScheduleForm) {
              loadAvailableCases();
              if (schedulingMode === 'manual') {
                loadSuggestedSlots();
              }
            }
          }}
          className="cadash-btn cadash-btn-add"
        >
          <Plus size={14} />
          {showScheduleForm ? 'Cancel' : 'Add Case to Schedule'}
        </button>
      </div>

      {showScheduleForm && (
        <div className="cadash-schedule-form">
          <h3 className="cadash-form-title">Schedule New Case</h3>
          
          {availableCases.length === 0 ? (
            <div className="cadash-empty-state">
              <p>No cases available for listing today.</p>
            </div>
          ) : (
            <>
              <div className="cadash-form-group">
                <label className="cadash-label">Select Case:</label>
                <select
                  value={selectedCase?.case_num || ''}
                  onChange={(e) => {
                    const c = availableCases.find(c => c.case_num === e.target.value);
                    setSelectedCase(c);
                    setSelectedHearing(null);
                  }}
                  className="cadash-select"
                >
                  <option value="">-- Select Case --</option>
                  {availableCases.map(c => (
                    <option key={c.case_num} value={c.case_num}>
                      {c.case_num} - {c.case_type} ({c.plaintiff_details?.name} vs {c.respondent_details?.name})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCase && (
                <div className="cadash-form-group">
                  <label className="cadash-label">Select Hearing:</label>
                  <select
                    value={selectedHearing?._id || ''}
                    onChange={(e) => {
                      const h = selectedCase.hearings.find(h => h._id === e.target.value);
                      setSelectedHearing(h);
                    }}
                    className="cadash-select"
                  >
                    <option value="">-- Select Hearing --</option>
                    {selectedCase.hearings
                      .filter(h => {
                        const hearingDate = new Date(h.next_hearing_date);
                        hearingDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return hearingDate.toISOString().split('T')[0] === today.toISOString().split('T')[0] 
                          && !h.is_listed_for_today;
                      })
                      .map(h => (
                        <option key={h._id} value={h._id}>
                          {h.hearing_type} - {new Date(h.next_hearing_date).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="cadash-form-group">
                <label className="cadash-label">Scheduling Mode:</label>
                <div className="cadash-mode-toggle">
                  <button
                    onClick={() => {
                      setSchedulingMode('auto');
                      setManualStartTime('');
                      setManualEndTime('');
                    }}
                    className={`cadash-mode-btn ${schedulingMode === 'auto' ? 'cadash-mode-active' : ''}`}
                  >
                    Auto Schedule
                  </button>
                  <button
                    onClick={() => {
                      setSchedulingMode('manual');
                      loadSuggestedSlots();
                    }}
                    className={`cadash-mode-btn ${schedulingMode === 'manual' ? 'cadash-mode-active' : ''}`}
                  >
                    Manual Time
                  </button>
                </div>
              </div>

              <div className="cadash-form-group">
                <label className="cadash-label">Estimated Duration (minutes):</label>
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => {
                    setEstimatedDuration(parseInt(e.target.value));
                    if (schedulingMode === 'manual') {
                      loadSuggestedSlots();
                    }
                  }}
                  min="15"
                  max="240"
                  step="15"
                  className="cadash-input"
                />
              </div>

              {schedulingMode === 'manual' && (
                <>
                  {suggestedSlots.length > 0 && (
                    <div className="cadash-form-group">
                      <label className="cadash-label">Suggested Time Slots:</label>
                      <div className="cadash-slot-list">
                        {suggestedSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setManualStartTime(formatDateTimeLocal(slot.start_time));
                              setManualEndTime(formatDateTimeLocal(slot.end_time));
                            }}
                            className="cadash-slot-btn"
                          >
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            {slot.gap_after_case && (
                              <span className="cadash-slot-hint">(after {slot.gap_after_case})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="cadash-form-group">
                    <label className="cadash-label">Start Time:</label>
                    <input
                      type="datetime-local"
                      value={manualStartTime}
                      onChange={(e) => setManualStartTime(e.target.value)}
                      min={formatDateTimeLocal(new Date())}
                      className="cadash-input"
                    />
                  </div>

                  <div className="cadash-form-group">
                    <label className="cadash-label">End Time:</label>
                    <input
                      type="datetime-local"
                      value={manualEndTime}
                      onChange={(e) => setManualEndTime(e.target.value)}
                      min={manualStartTime || formatDateTimeLocal(new Date())}
                      className="cadash-input"
                    />
                  </div>

                  {timeConflict && timeConflict.length > 0 && (
                    <div className="cadash-conflict-warning">
                      <strong>⚠️ Time Conflict!</strong>
                      <p>Conflicts with: {timeConflict.map(c => c.case_num).join(', ')}</p>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleAddToSchedule}
                className="cadash-btn cadash-btn-submit"
                disabled={!selectedCase || !selectedHearing || (schedulingMode === 'manual' && timeConflict)}
              >
                Add to Schedule
              </button>
            </>
          )}
        </div>
      )}

      {currentCase ? (
        <div className="cadash-current-case">
          <div className={`cadash-status-badge cadash-status-${currentCase.status.toLowerCase().replace(' ', '-')}`}>
            <span className={`cadash-status-dot ${currentCase.status === 'in_progress' ? 'cadash-dot-green' : 'cadash-dot-yellow'}`}></span>
            {currentCase.status === 'in_progress' ? 'IN PROGRESS' : 'SCHEDULED'}
          </div>

          <div className="cadash-case-details">
            <div className="cadash-case-number">Case #{currentCase.case_num}</div>
            
            <div className="cadash-case-info">
              <div className="cadash-info-row">
                <span className="cadash-case-label">Case Type</span>
                <span className="cadash-case-value">{currentCase.case_type}</span>
              </div>
              
              <div className="cadash-info-row">
                <span className="cadash-case-label">Plaintiff</span>
                <span className="cadash-case-value">{currentCase.plaintiff_name}</span>
              </div>
              
              <div className="cadash-info-row">
                <span className="cadash-case-label">Respondent</span>
                <span className="cadash-case-value">{currentCase.respondent_name}</span>
              </div>
              
              <div className="cadash-info-row">
                <span className="cadash-case-label">Scheduled Time</span>
                <span className="cadash-time-display">
                  {formatTime(currentCase.listing_time_start)} - {formatTime(currentCase.listing_time_end)}
                  {currentCase.actual_start_time && (
                    <span className="cadash-elapsed-time">
                      ({calculateElapsedTime(currentCase.actual_start_time)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="cadash-action-buttons">
            {currentCase.status === 'scheduled' && (
              <>
                <button onClick={() => handleStartHearing(currentCase.case_num)} className="cadash-btn cadash-btn-success">
                  <Play size={14} />
                  Start
                </button>
                <button onClick={() => handleEditTiming(currentCase)} className="cadash-btn cadash-btn-primary">
                  <Edit2 size={14} />
                  Edit
                </button>
                <button onClick={() => handleRemoveCase(currentCase.case_num)} className="cadash-btn cadash-btn-danger">
                  <Trash2 size={14} />
                  Remove
                </button>
              </>
            )}
            
            {currentCase.status === 'in_progress' && (
              <>
                <button onClick={() => handleEndHearing(currentCase.case_num)} className="cadash-btn cadash-btn-success">
                  <Square size={14} />
                  End
                </button>
                <button onClick={() => handleDismissHearing(currentCase.case_num)} className="cadash-btn cadash-btn-danger">
                  <XCircle size={14} />
                  Dismiss
                </button>
              </>
            )}

            {(currentCase.status === 'completed' || currentCase.status === 'dismissed') && (
              <button onClick={() => handleReopenHearing(currentCase.case_num)} className="cadash-btn cadash-btn-primary">
                <RotateCcw size={14} />
                Reopen
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="cadash-no-case">
          <div className="cadash-empty-icon">⚖️</div>
          <p>No active case in progress</p>
        </div>
      )}

      <div className="cadash-queue-section">
        <div className="cadash-queue-header">
          <Calendar size={18} />
          UPCOMING QUEUE
        </div>
        
        {upcomingCases.length === 0 ? (
          <div className="cadash-no-case">
            <p>No upcoming cases in queue</p>
          </div>
        ) : (
          <div className="cadash-queue-list">
            {upcomingCases.map((queueCase, index) => (
              <div key={queueCase.case_num} className="cadash-queue-item">
                <div className="cadash-queue-info">
                  <div className="cadash-queue-order">{index + 1}</div>
                  <div>
                    <div className="cadash-queue-case-num">{queueCase.case_num}</div>
                    <div className="cadash-queue-case-type">{queueCase.case_type}</div>
                  </div>
                </div>
                <div className="cadash-queue-actions">
                  {editingCase === queueCase.case_num ? (
                    <div className="cadash-edit-time-form">
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        min={formatDateTimeLocal(new Date())}
                        className="cadash-time-input"
                      />
                      <input
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        min={editStartTime}
                        className="cadash-time-input"
                      />
                      <label className="cadash-checkbox-label">
                        <input
                          type="checkbox"
                          checked={cascadeUpdates}
                          onChange={(e) => setCascadeUpdates(e.target.checked)}
                        />
                        Adjust subsequent cases
                      </label>
                      <div className="cadash-edit-actions">
                        <button onClick={() => handleSaveEditedTiming(queueCase.case_num)} className="cadash-btn-sm cadash-btn-success">
                          Save
                        </button>
                        <button onClick={() => setEditingCase(null)} className="cadash-btn-sm cadash-btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="cadash-queue-time">
                        {formatTime(queueCase.listing_time_start)} - {formatTime(queueCase.listing_time_end)}
                      </div>
                      <div className="cadash-queue-btn-group">
                        <button onClick={() => handleEditTiming(queueCase)} className="cadash-btn-sm cadash-btn-primary">
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button onClick={() => handleRemoveCase(queueCase.case_num)} className="cadash-btn-sm cadash-btn-danger">
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {schedule && schedule.scheduled_cases && schedule.scheduled_cases.length > 0 && (
        <div className="cadash-all-cases">
          <div className="cadash-all-cases-header">
            All Cases Today ({schedule.scheduled_cases.length})
          </div>
          <div className="cadash-table-wrapper">
            <table className="cadash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Case No</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.scheduled_cases.map((caseItem, idx) => (
                  <tr key={caseItem.case_num}>
                    <td>{idx + 1}</td>
                    <td className="cadash-table-case-num">{caseItem.case_num}</td>
                    <td>{caseItem.case_type}</td>
                    <td className="cadash-table-time">
                      {formatTime(caseItem.listing_time_start)} - {formatTime(caseItem.listing_time_end)}
                    </td>
                    <td>
                      <span className={`cadash-table-status cadash-status-${caseItem.status}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td>
                      <div className="cadash-table-actions">
                        {caseItem.status === 'scheduled' && (
                          <>
                            <button onClick={() => handleStartHearing(caseItem.case_num)} className="cadash-btn-xs cadash-btn-success">
                              Start
                            </button>
                            <button onClick={() => handleEditTiming(caseItem)} className="cadash-btn-xs cadash-btn-primary">
                              Edit
                            </button>
                          </>
                        )}
                        {caseItem.status === 'in_progress' && (
                          <button onClick={() => handleEndHearing(caseItem.case_num)} className="cadash-btn-xs cadash-btn-secondary">
                            End
                          </button>
                        )}
                        {(caseItem.status === 'completed' || caseItem.status === 'dismissed') && (
                          <button onClick={() => handleReopenHearing(caseItem.case_num)} className="cadash-btn-xs cadash-btn-warning">
                            Reopen
                          </button>
                        )}
                        <button onClick={() => handleRemoveCase(caseItem.case_num)} className="cadash-btn-xs cadash-btn-danger">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtAdminLiveDashboard;