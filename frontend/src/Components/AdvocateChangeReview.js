import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import supabaseApi from '../services/supabaseApi';
import { ShieldCheck, FileText, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import '../ComponentsCSS/AdvocateChangeReview.css';

const AdvocateChangeReview = ({ profile }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('advocate_change_requests')
        .select('*')
        .in('status', ['Under Court Review', 'NOC Signed', 'Application Filed', 'NOC Submitted', 'NOC Requested', 'Draft', 'pending'])
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRequests(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!selectedRequest) return;

    if (action === 'Reject' && remarks.length < 10) {
      showToast('Please provide remarks for rejection (min 10 chars).', 'warning');
      return;
    }

    try {
      setActionLoading(true);

      await supabaseApi.put('/api/advocate-change/review', {
        requestId: selectedRequest.request_id,
        reviewAction: action,
        remarks: remarks
      });

      showToast(
        action === 'Approve' 
          ? '✅ Advocate change approved! The old advocate has been discharged from the case.' 
          : '❌ Request has been rejected.',
        action === 'Approve' ? 'success' : 'error'
      );

      setSelectedRequest(null);
      setRemarks('');
      fetchPendingRequests();
    } catch (err) {
      showToast('Action failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openNocDocument = (url) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  if (loading) return <div className="adv-review-loading">Loading pending requests...</div>;

  if (error) return (
    <div className="adv-review-error">
      <AlertCircle size={20} />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="adv-review-container">
      <h2>Advocate Change Requests (NOC)</h2>

      {/* In-app Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 10000,
          padding: '16px 24px',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          maxWidth: '440px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          animation: 'toastSlideIn 0.35s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: toast.type === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
            : toast.type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
        }}>
          {toast.type === 'success' ? <CheckCircle size={22} /> : toast.type === 'warning' ? <AlertCircle size={22} /> : <XCircle size={22} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
          >×</button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="adv-review-empty">No pending advocate change requests at the moment.</div>
      ) : (
        <div className="adv-review-table-wrapper">
          <table className="adv-review-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Status</th>
                <th>Has NOC?</th>
                <th>Submitted On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.request_id}>
                  <td>{req.case_id || 'Unknown'}</td>
                  <td>
                    <span className={`status-badge ${(req.status || '').replace(/\s+/g, '-').toLowerCase()}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.has_noc ? (
                      <span className="noc-yes"><CheckCircle size={16}/> Yes</span>
                    ) : (
                      <span className="noc-no"><AlertCircle size={16}/> No</span>
                    )}
                  </td>
                  <td>{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button className="review-btn" onClick={() => setSelectedRequest(req)}>
                      <Eye size={16} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="adv-review-modal-overlay">
          <div className="adv-review-modal-content">
            <div className="modal-header">
              <h3>Review Advocate Change</h3>
              <button className="close-btn" onClick={() => { setSelectedRequest(null); setRemarks(''); }}>×</button>
            </div>

            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>Case Number:</label>
                  <span>{selectedRequest.case_id}</span>
                </div>
                <div className="info-item">
                  <label>Litigant ID:</label>
                  <span>{selectedRequest.litigant_id}</span>
                </div>
                <div className="info-item">
                  <label>Discharging Advocate:</label>
                  <span>{selectedRequest.existing_advocate_id}</span>
                </div>
                <div className="info-item">
                  <label>New Advocate:</label>
                  <span>{selectedRequest.new_advocate_id || '—'}</span>
                </div>
              </div>

              <div className="review-section mt-4">
                <h4>Legal Documentation</h4>
                <div className="doc-actions">
                  {selectedRequest.has_noc ? (
                    <div className="noc-details-box mt-3">
                      <h5><CheckCircle size={18} color="green" /> NOC Details Provided</h5>
                      <p><strong>Advocate:</strong> {selectedRequest.noc_details?.advocateName}</p>
                      <p><strong>Enrollment:</strong> {selectedRequest.noc_details?.enrollmentNumber}</p>
                      {selectedRequest.noc_details?.dateSigned && (
                        <p><strong>Date Signed:</strong> {new Date(selectedRequest.noc_details.dateSigned).toLocaleDateString()}</p>
                      )}
                      {selectedRequest.noc_document_url && (
                        <button className="btn-outline mt-2" onClick={() => openNocDocument(selectedRequest.noc_document_url)}>
                          <FileText size={16} /> View Uploaded NOC PDF
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="no-noc-box mt-3">
                      <h5><AlertCircle size={18} color="#d97706" /> Proceeding Without NOC</h5>
                      <p className="mt-2"><strong>Litigant's Justification:</strong></p>
                      <div className="justification-text">
                        "{selectedRequest.reason_for_no_noc}"
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="review-action-form mt-4">
                <h4>Court Decision</h4>
                <textarea
                  rows="3"
                  placeholder="Enter remarks/orders (required for rejection)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />

                <div className="action-buttons mt-3">
                  <button
                    className="btn-approve"
                    onClick={() => handleAction('Approve')}
                    disabled={actionLoading}
                  >
                    <ShieldCheck size={18} /> {actionLoading ? 'Processing...' : 'Approve & Discharge Advocate'}
                  </button>

                  <button
                    className="btn-reject"
                    onClick={() => handleAction('Reject')}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} /> {actionLoading ? 'Processing...' : 'Reject Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast animation */}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdvocateChangeReview;
