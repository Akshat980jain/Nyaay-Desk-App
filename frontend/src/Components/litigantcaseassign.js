import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/litigantcaseassign.css'; // Update this path if needed
import ChangeAdvocateModal from './ChangeAdvocateModal';
import Popup from './Popup';

const LitigantAdvocateSearch = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [advocates, setAdvocates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('cases');
  
  // Advocate Change Modal state
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [modalPartyType, setModalPartyType] = useState('plaintiff');
  const [advocateChangeRequests, setAdvocateChangeRequests] = useState([]);
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'success' });
  
  const getPartyIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).party_id;
    } catch (e) {
      return null;
    }
  };
  const currentPartyId = getPartyIdFromToken();
  
  // Fetch litigant's cases
  useEffect(() => {
    fetchCases();
    fetchPendingRequests();
    fetchAdvocateChangeRequests();
  }, []);

  const handleFinalSubmitToCourt = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://nyaay-desk-app-backend.onrender.com/api/advocate-change/court-pending`, {
        requestId,
        status: 'Court Pending'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopup({
        isOpen: true,
        message: 'Application submitted to court successfully!',
        type: 'success'
      });
      fetchAdvocateChangeRequests();
    } catch (err) {
      console.error('Error submitting to court:', err);
      setPopup({
        isOpen: true,
        message: 'Failed to submit to court. Please try again.',
        type: 'error'
      });
    }
  };

  const fetchAdvocateChangeRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://nyaay-desk-app-backend.onrender.com/api/advocate-change/litigant-requests/${currentPartyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvocateChangeRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching advocate change requests:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'https://nyaay-desk-app-backend.onrender.com/api/cases/litigant',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCases(response.data.cases);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError(error.response?.data?.message || 'Failed to fetch cases');
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'https://nyaay-desk-app-backend.onrender.com/litigant/pending-requests',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPendingRequests(response.data.pendingRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const searchAdvocates = async () => {
    try {
      if (!selectedCase || !selectedCase.district) {
        setError('No case or district selected');
        return;
      }
      
      setLoading(true);
      const district = selectedCase.district;
      console.log("Searching advocates in district:", district);
      
      const token = localStorage.getItem('token');
      // Fixed the URL to match the backend endpoint
      const response = await axios.get(
        `https://nyaay-desk-app-backend.onrender.com/advocates/search?district=${district}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Response received:", response.data);
      
      if (response.data.advocates && Array.isArray(response.data.advocates)) {
        console.log("Advocates found:", response.data.advocates.length);
        setAdvocates(response.data.advocates);
        if (response.data.advocates.length === 0) {
          setError('No advocates found in this district');
        }
      } else {
        console.log("No advocates found for this district");
        setAdvocates([]);
        setError('No advocates found in this district');
      }
    } catch (error) {
      console.error("Error fetching advocates:", error);
      setError(error.response?.data?.message || 'Failed to fetch advocates');
      setAdvocates([]);
    } finally {
      setLoading(false);
    }
  };

  const requestAdvocate = async (advocateId, advocateName, partyType) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `https://nyaay-desk-app-backend.onrender.com/cases/${selectedCase._id}/request-advocate`,
        {
          advocateId,
          advocateName,
          partyType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(`Request sent to advocate ${advocateName}`);
      
      // Re-fetch the specific case so the UI updates to show 'Request Pending'
      try {
        await fetchCases();
        const response = await axios.get(
          'https://nyaay-desk-app-backend.onrender.com/api/cases/litigant',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedCases = response.data.cases;
        const updatedSelectedCase = updatedCases.find(c => c._id === selectedCase._id);
        if (updatedSelectedCase) {
          setSelectedCase(updatedSelectedCase);
        }
      } catch (e) {
        console.error("Failed to update selected case data", e);
      }
      
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error requesting advocate:', error);
      setError(error.response?.data?.message || 'Failed to send request');
      setLoading(false);
    }
  };

  const removeAdvocate = async (partyType) => {
    if (!window.confirm(`Are you sure you want to remove your assigned ${partyType}'s advocate?`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `https://nyaay-desk-app-backend.onrender.com/cases/${selectedCase._id}/remove-advocate`,
        { partyType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Advocate removed successfully');
      
      // Update selected case and case list
      const updatedCase = { ...selectedCase };
      if (partyType === 'plaintiff') {
        updatedCase.plaintiff_details.advocate_id = null;
        updatedCase.plaintiff_details.advocate = '';
      } else {
        updatedCase.respondent_details.advocate_id = null;
        updatedCase.respondent_details.advocate = '';
      }
      setSelectedCase(updatedCase);
      
      await fetchCases();
      setLoading(false);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error removing advocate:', error);
      setError(error.response?.data?.message || 'Failed to remove advocate');
      setLoading(false);
    }
  };

  const cancelPendingRequest = async (partyType) => {
    if (!window.confirm(`Are you sure you want to cancel your pending advocate request?`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `https://nyaay-desk-app-backend.onrender.com/cases/${selectedCase._id}/cancel-request`,
        { partyType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Pending request cancelled successfully');
      await fetchCases();
      
      // Re-fetch the specific case so the UI immediately updates
      try {
        const response = await axios.get(
          'https://nyaay-desk-app-backend.onrender.com/api/cases/litigant',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedCases = response.data.cases;
        const updatedSelectedCase = updatedCases.find(c => c._id === selectedCase._id);
        if (updatedSelectedCase) {
          setSelectedCase(updatedSelectedCase);
        }
      } catch (e) {}
      
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error cancelling request:', error);
      setError(error.response?.data?.message || 'Failed to cancel request');
      setLoading(false);
    }
  };

  const handleApproveRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `https://nyaay-desk-app-backend.onrender.com/cases/${caseId}/advocate-requests/${requestId}`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Advocate request approved');
      
      // Update the local state to remove the request from pending
      setPendingRequests(pendingRequests.filter(req => req.request_id !== requestId));
      
      // Refresh the cases
      await fetchCases();
      
      // Re-fetch the specific case so the UI immediately updates
      try {
        const response = await axios.get(
          'https://nyaay-desk-app-backend.onrender.com/api/cases/litigant',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedCases = response.data.cases;
        
        if (selectedCase && selectedCase._id === caseId) {
          const updatedSelectedCase = updatedCases.find(c => c._id === caseId);
          if (updatedSelectedCase) {
            setSelectedCase(updatedSelectedCase);
          }
        }
      } catch (e) {
        console.error("Failed to update selected case data", e);
      }
      
      setLoading(false);
      
      // Clear success message
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setError(error.response?.data?.message || 'Failed to approve request');
      setLoading(false);
    }
  };

  const handleRejectRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `https://nyaay-desk-app-backend.onrender.com/cases/${caseId}/advocate-requests/${requestId}`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Request rejected successfully');
      fetchPendingRequests();
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(error.response?.data?.message || 'Failed to reject request');
      setLoading(false);
    }
  };

  const filteredAdvocates = advocates.filter(advocate => 
    advocate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="las-container">
      <h1 className="las-title">Advocate Search & Management</h1>
      
      {/* Tabs */}
      <div className="las-tabs">
        <button 
          className={`las-tab ${activeTab === 'cases' ? 'las-tab-active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          My Cases
        </button>
        <button 
          className={`las-tab ${activeTab === 'requests' ? 'las-tab-active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Pending Requests 
          {pendingRequests.length > 0 && <span className="las-tab-badge">{pendingRequests.length}</span>}
        </button>
        <button 
          className={`las-tab ${activeTab === 'change_requests' ? 'las-tab-active' : ''}`}
          onClick={() => setActiveTab('change_requests')}
        >
          Advocate Change Status
          {advocateChangeRequests.filter(r => !['Approved', 'Rejected', 'Under Court Review'].includes(r.status)).length > 0 && 
            <span className="las-tab-badge" style={{background: '#fbbf24'}}>
              {advocateChangeRequests.filter(r => !['Approved', 'Rejected', 'Under Court Review'].includes(r.status)).length}
            </span>
          }
        </button>
      </div>
      
      {/* Alert Messages */}
      {error && (
        <div className="las-alert las-alert-error">
          {error}
          <button className="las-alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="las-alert las-alert-success">
          {success}
          <button className="las-alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      
      {/* My Cases Tab */}
      {activeTab === 'cases' && (
        <div>
          <h2 className="las-card-title">My Cases</h2>
          
          {loading ? (
            <div className="las-loading">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="las-empty-state">No cases found.</div>
          ) : (
            <table className="las-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Court</th>
                  <th>Type</th>
                  <th>District</th>
                  <th>Plaintiff</th>
                  <th>Respondent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(caseItem => (
                  <tr key={caseItem._id}>
                    <td>{caseItem.case_num || 'N/A'}</td>
                    <td>{caseItem.court}</td>
                    <td>{caseItem.case_type}</td>
                    <td>{caseItem.district}</td>
                    <td>
                      {caseItem.plaintiff_details.name}
                      {caseItem.plaintiff_details.advocate && (
                        <div className="las-detail-note">
                          Advocate: {caseItem.plaintiff_details.advocate}
                        </div>
                      )}
                    </td>
                    <td>
                      {caseItem.respondent_details.name}
                      {caseItem.respondent_details.advocate && (
                        <div className="las-detail-note">
                          Advocate: {caseItem.respondent_details.advocate}
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        className="las-btn las-btn-primary las-btn-sm"
                        onClick={() => setSelectedCase(caseItem)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {selectedCase && (
            <div className="las-case-card">
              <h3 className="las-card-title">Selected Case: {selectedCase.case_num || 'New Case'}</h3>
              <div className="las-case-details">
                <div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Court:</span>
                    <span className="las-detail-value">{selectedCase.court}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Type:</span>
                    <span className="las-detail-value">{selectedCase.case_type}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">District:</span>
                    <span className="las-detail-value">{selectedCase.district}</span>
                  </div>
                </div>
                <div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Plaintiff:</span>
                    <span className="las-detail-value">{selectedCase.plaintiff_details.name}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Plaintiff's Advocate:</span>
                    <span className="las-detail-value">
                      {(() => {
                        const isAssigned = selectedCase.plaintiff_details.advocate && selectedCase.plaintiff_details.advocate !== 'None' && selectedCase.plaintiff_details.advocate.trim() !== '';
                        const isPending = selectedCase.advocate_requests && selectedCase.advocate_requests.some(req => req.party_type === 'plaintiff' && req.status === 'pending');
                        if (isAssigned) return selectedCase.plaintiff_details.advocate;
                        if (isPending) return <span style={{color: '#d97706', fontStyle: 'italic'}}>Request Pending</span>;
                        return 'None';
                      })()}
                      {selectedCase.plaintiff_details.advocate && 
                       selectedCase.plaintiff_details.advocate !== 'None' &&
                       selectedCase.plaintiff_details.advocate.trim() !== '' &&
                       (!currentPartyId || selectedCase.plaintiff_details.party_id === currentPartyId) && (
                        <button 
                          className="las-btn las-btn-danger las-btn-sm" 
                          style={{marginLeft: '10px', padding: '2px 8px', fontSize: '0.8rem'}}
                          onClick={() => {
                            setModalPartyType('plaintiff');
                            setIsChangeModalOpen(true);
                          }}
                        >
                          Fire Lawyer
                        </button>
                      )}
                      {!(selectedCase.plaintiff_details.advocate && selectedCase.plaintiff_details.advocate !== 'None' && selectedCase.plaintiff_details.advocate.trim() !== '') &&
                       selectedCase.advocate_requests && selectedCase.advocate_requests.some(req => req.party_type === 'plaintiff' && req.status === 'pending') &&
                       (!currentPartyId || selectedCase.plaintiff_details.party_id === currentPartyId) && (
                        <button 
                          className="las-btn las-btn-danger las-btn-sm" 
                          style={{marginLeft: '10px', padding: '2px 8px', fontSize: '0.8rem'}}
                          onClick={() => cancelPendingRequest('plaintiff')}
                        >
                          Cancel Request
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Respondent:</span>
                    <span className="las-detail-value">{selectedCase.respondent_details.name}</span>
                  </div>
                  <div className="las-detail-item">
                    <span className="las-detail-label">Respondent's Advocate:</span>
                    <span className="las-detail-value">
                      {(() => {
                        const isAssigned = selectedCase.respondent_details.advocate && selectedCase.respondent_details.advocate !== 'None' && selectedCase.respondent_details.advocate.trim() !== '';
                        const isPending = selectedCase.advocate_requests && selectedCase.advocate_requests.some(req => req.party_type === 'respondent' && req.status === 'pending');
                        if (isAssigned) return selectedCase.respondent_details.advocate;
                        if (isPending) return <span style={{color: '#d97706', fontStyle: 'italic'}}>Request Pending</span>;
                        return 'None';
                      })()}
                      {selectedCase.respondent_details.advocate && 
                       selectedCase.respondent_details.advocate !== 'None' &&
                       selectedCase.respondent_details.advocate.trim() !== '' &&
                       (!currentPartyId || selectedCase.respondent_details.party_id === currentPartyId) && (
                        <button 
                          className="las-btn las-btn-danger las-btn-sm" 
                          style={{marginLeft: '10px', padding: '2px 8px', fontSize: '0.8rem'}}
                          onClick={() => {
                            setModalPartyType('respondent');
                            setIsChangeModalOpen(true);
                          }}
                        >
                          Fire Lawyer
                        </button>
                      )}
                      {!(selectedCase.respondent_details.advocate && selectedCase.respondent_details.advocate !== 'None' && selectedCase.respondent_details.advocate.trim() !== '') &&
                       selectedCase.advocate_requests && selectedCase.advocate_requests.some(req => req.party_type === 'respondent' && req.status === 'pending') &&
                       (!currentPartyId || selectedCase.respondent_details.party_id === currentPartyId) && (
                        <button 
                          className="las-btn las-btn-danger las-btn-sm" 
                          style={{marginLeft: '10px', padding: '2px 8px', fontSize: '0.8rem'}}
                          onClick={() => cancelPendingRequest('respondent')}
                        >
                          Cancel Request
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <button 
                  className="las-btn las-btn-success"
                  onClick={searchAdvocates}
                >
                  Search Advocates in District
                </button>
              </div>
              
              {loading && <div className="las-loading">Searching advocates...</div>}
              
              {advocates.length > 0 && (
                <div className="mt-4">
                  <h4 className="las-card-title">Available Advocates</h4>
                  
                  <input
                    type="text"
                    placeholder="Search advocates by name..."
                    className="las-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  <div className="las-advocate-grid">
                    {filteredAdvocates.length > 0 ? (
                      filteredAdvocates.map(advocate => (
                        <div key={advocate.advocate_id} className="las-advocate-card">
                          <h5 className="las-advocate-name">{advocate.name}</h5>
                          <p className="las-advocate-info">
                            <strong>District:</strong> {advocate.practice_details?.district || 'Not specified'}
                          </p>
                          <p className="las-advocate-info">
                            <strong>Practice:</strong> {advocate.practice_details?.high_court ? 'High Court' : ''} 
                            {advocate.practice_details?.district_court && advocate.practice_details?.high_court ? ' & ' : ''}
                            {advocate.practice_details?.district_court ? 'District Court' : ''}
                            {!advocate.practice_details?.high_court && !advocate.practice_details?.district_court ? 'Not specified' : ''}
                          </p>
                          <div className="las-advocate-actions">
                            {(!selectedCase || selectedCase.plaintiff_details?.party_id === currentPartyId || !currentPartyId) && (() => {
                              const isAssigned = selectedCase && selectedCase.plaintiff_details.advocate && selectedCase.plaintiff_details.advocate !== 'None' && selectedCase.plaintiff_details.advocate.trim() !== '';
                              const isPending = selectedCase && selectedCase.advocate_requests && selectedCase.advocate_requests.some(req => req.advocate_id === advocate.advocate_id && req.party_type === 'plaintiff' && req.status === 'pending');
                              return (
                              <button
                                className="las-btn las-btn-primary las-btn-sm"
                                onClick={() => {
                                  if (isAssigned) {
                                    setModalPartyType('plaintiff');
                                    setIsChangeModalOpen(true);
                                  } else {
                                    requestAdvocate(advocate.advocate_id, advocate.name, 'plaintiff');
                                  }
                                }}
                                disabled={isPending}
                                title={isPending ? "Your request to this advocate is pending approval" : (isAssigned ? "Change your current lawyer" : "Request this lawyer")}
                              >
                                {isPending ? "Request Pending" : (isAssigned ? "Change Lawyer" : "Request as Plaintiff's Advocate")}
                              </button>
                              );
                            })()}
                            {(!selectedCase || selectedCase.respondent_details?.party_id === currentPartyId || !currentPartyId) && (() => {
                              const isAssigned = selectedCase && selectedCase.respondent_details.advocate && selectedCase.respondent_details.advocate !== 'None' && selectedCase.respondent_details.advocate.trim() !== '';
                              const isPending = selectedCase && selectedCase.advocate_requests && selectedCase.advocate_requests.some(req => req.advocate_id === advocate.advocate_id && req.party_type === 'respondent' && req.status === 'pending');
                              return (
                              <button
                                className="las-btn las-btn-secondary las-btn-sm"
                                onClick={() => {
                                  if (isAssigned) {
                                    setModalPartyType('respondent');
                                    setIsChangeModalOpen(true);
                                  } else {
                                    requestAdvocate(advocate.advocate_id, advocate.name, 'respondent');
                                  }
                                }}
                                disabled={isPending}
                                title={isPending ? "Your request to this advocate is pending approval" : (isAssigned ? "Change your current lawyer" : "Request this lawyer")}
                              >
                                {isPending ? "Request Pending" : (isAssigned ? "Change Lawyer" : "Request as Respondent's Advocate")}
                              </button>
                              );
                            })()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No advocates found matching your search criteria.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Pending Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <h2 className="las-card-title">Pending Advocate Requests</h2>
          
          {pendingRequests.length === 0 ? (
            <div className="las-empty-state">No pending requests from advocates.</div>
          ) : (
            <div>
              {pendingRequests.map(request => (
                <div key={request.case_id} className="las-request-card">
                  <h3 className="las-request-title">Case: {request.case_num || 'Case Number Not Assigned'}</h3>
                  
                  <div className="las-case-details">
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Court:</span>
                        <span className="las-detail-value">{request.court}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Type:</span>
                        <span className="las-detail-value">{request.case_type}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">District:</span>
                        <span className="las-detail-value">{request.district}</span>
                      </div>
                    </div>
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Plaintiff:</span>
                        <span className="las-detail-value">{request.plaintiff}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Respondent:</span>
                        <span className="las-detail-value">{request.respondent}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="las-request-title">Advocate Requests:</h4>
                    {request.requests.map(req => (
                      <div key={req._id} className="las-request-subcard">
                        <div className="las-detail-item">
                          <span className="las-detail-label">Advocate:</span>
                          <span className="las-detail-value">{req.advocate_name}</span>
                        </div>
                        <div className="las-detail-item">
                          <span className="las-detail-label">Requested for:</span>
                          <span className="las-detail-value">{req.party_type === 'plaintiff' ? 'Plaintiff' : 'Respondent'}</span>
                        </div>
                        <div className="las-detail-item">
                          <span className="las-detail-label">Requested on:</span>
                          <span className="las-detail-value">{new Date(req.requested_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="las-btn-group" style={{marginTop: '1rem'}}>
                          <button 
                            className="las-btn las-btn-success las-btn-sm"
                            onClick={() => handleApproveRequest(request.case_id, req._id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="las-btn las-btn-danger las-btn-sm"
                            onClick={() => handleRejectRequest(request.case_id, req._id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Advocate Change Requests Tab */}
      {activeTab === 'change_requests' && (
        <div>
          <h2 className="las-card-title">Advocate Change & NOC Status</h2>
          
          {advocateChangeRequests.length === 0 ? (
            <div className="las-empty-state">No active advocate change requests.</div>
          ) : (
            <div className="las-request-grid" style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1rem'}}>
              {advocateChangeRequests.map(req => (
                <div key={req._id} className="las-request-card" style={{borderLeft: `4px solid ${req.nocRequestStatus === 'Signed' ? '#22c55e' : req.nocRequestStatus === 'Declined' ? '#ef4444' : '#fbbf24'}`}}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="las-request-title">Case: {req.caseId?.case_num || 'Loading...'}</h3>
                    <span className={`las-status-badge ${req.nocRequestStatus?.toLowerCase()}`} style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: req.nocRequestStatus === 'Signed' ? '#dcfce7' : req.nocRequestStatus === 'Declined' ? '#fee2e2' : '#fef3c7',
                      color: req.nocRequestStatus === 'Signed' ? '#166534' : req.nocRequestStatus === 'Declined' ? '#991b1b' : '#92400e'
                    }}>
                      NOC: {req.nocRequestStatus}
                    </span>
                  </div>
                  
                  <div className="las-case-details">
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Current Advocate:</span>
                        <span className="las-detail-value">{req.currentAdvocateId}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Status:</span>
                        <span className="las-detail-value">{req.status}</span>
                      </div>
                    </div>
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Requested On:</span>
                        <span className="las-detail-value">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      {req.nocRequestStatus === 'Declined' && (
                        <div className="las-detail-item" style={{color: '#ef4444'}}>
                          <span className="las-detail-label">Decline Reason:</span>
                          <span className="las-detail-value">{req.nocDeclineReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{marginTop: '1rem', padding: '10px', background: '#f9fafb', borderRadius: '4px', fontSize: '0.85rem'}}>
                    {req.nocRequestStatus === 'Requested' && (
                      <p>⏳ Your request for NOC is pending with the advocate. Once signed, it will be automatically attached to your court application.</p>
                    )}
                    {req.nocRequestStatus === 'Signed' && (
                      <div style={{marginTop: '1rem'}}>
                        <p style={{marginBottom: '10px'}}>✅ <strong>NOC Digitally Signed.</strong> The signature certificate has been generated.</p>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button 
                            className="las-btn las-btn-success las-btn-sm"
                            onClick={() => handleFinalSubmitToCourt(req._id)}
                            disabled={req.status === 'Under Court Review' || req.status === 'Approved'}
                          >
                            {req.status === 'Under Court Review' ? 'Submitted to Court' : 'Submit to Court'}
                          </button>
                          <button 
                            className="las-btn las-btn-secondary las-btn-sm"
                            onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/advocate-change/generate-application/${req._id}`, '_blank')}
                          >
                            Print NOC
                          </button>
                        </div>
                      </div>
                    )}
                    {req.nocRequestStatus === 'Declined' && (
                      <p>❌ <strong>NOC Declined.</strong> Your lawyer has refused to sign the NOC. You may need to provide additional justification to the court or resolve any pending dues.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Change Advocate Modal */}
      {isChangeModalOpen && selectedCase && (
        <ChangeAdvocateModal
          isOpen={isChangeModalOpen}
          onClose={() => {
            setIsChangeModalOpen(false);
            fetchCases(); // Refresh cases after potential change
          }}
          legalCase={selectedCase}
          litigantProfile={{ party_id: currentPartyId }}
          partyType={modalPartyType}
        />
      )}
      <Popup 
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ ...popup, isOpen: false })}
      />
    </div>
  );
};

export default LitigantAdvocateSearch;