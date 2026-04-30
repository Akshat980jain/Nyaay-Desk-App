import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, FileText, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import '../ComponentsCSS/AdvocateChangeReview.css';

const AdvocateChangeReview = ({ profile }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Review form state
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://nyaay-desk-app-backend.onrender.com/api/advocate-change/court-pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!selectedRequest) return;
    
    if (action === 'Reject' && remarks.length < 10) {
      alert("Please provide remarks for rejection (min 10 chars).");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        action,
        remarks,
        adminId: profile?.admin_id || 'Admin'
      };

      await axios.put(
        `https://nyaay-desk-app-backend.onrender.com/api/advocate-change/review/${selectedRequest._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reset state and refresh list
      setSelectedRequest(null);
      setRemarks('');
      fetchPendingRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openNocDocument = (url) => {
    if (!url) return;
    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const fileUrl = `${API}/${url.replace(/\\\\/g, '/')}`;
    window.open(fileUrl, '_blank');
  };

  const viewGeneratedApplication = (id) => {
    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.open(`${API}/api/advocate-change/generate-application/${id}`, '_blank', 'width=800,height=800');
  };

  if (loading) return <div className="adv-review-loading">Loading pending requests...</div>;
  if (error) return <div className="adv-review-error">{error}</div>;

  return (
    <div className="adv-review-container">
      <h2>Advocate Change Requests (NOC)</h2>
      
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
                <tr key={req._id}>
                  <td>{req.caseId?.case_num || 'Unknown'}</td>
                  <td><span className={`status-badge ${req.status.replace(/\\s+/g, '-').toLowerCase()}`}>{req.status}</span></td>
                  <td>
                    {req.hasNoc ? (
                      <span className="noc-yes"><CheckCircle size={16}/> Yes</span>
                    ) : (
                      <span className="noc-no"><AlertCircle size={16}/> No</span>
                    )}
                  </td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
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
              <button className="close-btn" onClick={() => {
                setSelectedRequest(null);
                setRemarks('');
              }}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>Case Number:</label>
                  <span>{selectedRequest.caseId?.case_num}</span>
                </div>
                <div className="info-item">
                  <label>Litigant ID:</label>
                  <span>{selectedRequest.litigantId}</span>
                </div>
                <div className="info-item">
                  <label>Discharging Advocate:</label>
                  <span>{selectedRequest.existingAdvocateId}</span>
                </div>
              </div>

              <div className="review-section mt-4">
                <h4>Legal Documentation</h4>
                <div className="doc-actions">
                  <button className="btn-outline" onClick={() => viewGeneratedApplication(selectedRequest._id)}>
                    <FileText size={18} /> View Formal Court Application
                  </button>
                  
                  {selectedRequest.hasNoc ? (
                    <div className="noc-details-box mt-3">
                      <h5><CheckCircle size={18} color="green" /> NOC Details Provided</h5>
                      <p><strong>Advocate:</strong> {selectedRequest.nocDetails?.advocateName}</p>
                      <p><strong>Enrollment:</strong> {selectedRequest.nocDetails?.enrollmentNumber}</p>
                      <p><strong>Date Signed:</strong> {new Date(selectedRequest.nocDetails?.dateSigned).toLocaleDateString()}</p>
                      {selectedRequest.nocDocumentUrl && (
                        <button className="btn-outline mt-2" onClick={() => openNocDocument(selectedRequest.nocDocumentUrl)}>
                          View Uploaded NOC PDF
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="no-noc-box mt-3">
                      <h5><AlertCircle size={18} color="#d97706" /> Proceeding Without NOC</h5>
                      <p className="mt-2"><strong>Litigant's Justification:</strong></p>
                      <div className="justification-text">
                        "{selectedRequest.reasonForNoNoc}"
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
                    <ShieldCheck size={18} /> Approve & Discharge Advocate
                  </button>
                  
                  <button 
                    className="btn-reject" 
                    onClick={() => handleAction('Reject')}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} /> Reject Request
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdvocateChangeReview;
