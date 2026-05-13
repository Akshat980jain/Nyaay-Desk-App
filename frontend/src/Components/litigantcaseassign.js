import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import supabaseApi from '../services/supabaseApi';
import '../ComponentsCSS/litigantcaseassign.css';
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
  
  const currentPartyId = (() => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      return userData.litigant_id || userData.party_id || null;
    } catch { return null; }
  })();
  
  // Fetch litigant's cases
  useEffect(() => {
    fetchCases();
    fetchPendingRequests();
    fetchAdvocateChangeRequests();
  }, []);

  const handleFinalSubmitToCourt = async (requestId) => {
    try {
      await supabaseApi.put('/api/advocate-change/court-pending', { requestId });
      setPopup({ isOpen: true, message: 'Application submitted to court successfully!', type: 'success' });
      fetchAdvocateChangeRequests();
    } catch (err) {
      console.error('Error submitting to court:', err);
      setPopup({ isOpen: true, message: 'Failed to submit to court. Please try again.', type: 'error' });
    }
  };

  const fetchAdvocateChangeRequests = async () => {
    try {
      if (!currentPartyId) return;
      const { data, error } = await supabase
        .from('advocate_change_requests')
        .select('*')
        .eq('litigant_id', currentPartyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAdvocateChangeRequests(data || []);
    } catch (err) {
      console.error('Error fetching advocate change requests:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      if (!currentPartyId) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .or(`plaintiff_details->>party_id.eq.${currentPartyId},respondent_details->>party_id.eq.${currentPartyId}`);
      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      if (!currentPartyId) return;
      const { data, error } = await supabase
        .from('advocate_change_requests')
        .select('*')
        .eq('status', 'pending')
        .eq('litigant_id', currentPartyId);
      if (error) throw error;
      // Group by case_num for display
      const grouped = (data || []).reduce((acc, req) => {
        const caseNum = req.case_num;
        if (!acc[caseNum]) acc[caseNum] = { case_id: caseNum, case_num: caseNum, requests: [] };
        acc[caseNum].requests.push(req);
        return acc;
      }, {});
      setPendingRequests(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const searchAdvocates = async () => {
    try {
      setLoading(true);
      setError('');
      let district = selectedCase?.district?.trim();
      if (district && district.toLowerCase() === 'unknown') district = '';
      
      console.log('Searching for advocates in district:', district);

      // Query advocates table directly
      let query = supabase
        .from('advocates')
        .select('*')
        .eq('status', 'active');
      
      if (district) {
        query = query.ilike('district', `%${district}%`);
      }

      const { data, error: fetchError } = await query.order('name', { ascending: true });
      
      if (fetchError) throw fetchError;

      console.log('Search Results:', data);
      setAdvocates(data || []);
      if (!data || data.length === 0) {
        setError(district
          ? `No advocates found in ${district}.`
          : 'No advocates found');
      }
    } catch (error) {
      console.error('Error fetching advocates:', error);
      setError('Failed to fetch advocates. Check browser console for details.');
      setAdvocates([]);
    } finally {
      setLoading(false);
    }
  };

  const requestAdvocate = async (advocateId, advocateName, partyType) => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch latest case data to ensure we have current advocate_requests
      const { data: caseData, error: fetchError } = await supabase
        .from('legal_cases')
        .select('advocate_requests, case_num')
        .eq('case_num', selectedCase.case_num)
        .single();
      
      if (fetchError) throw fetchError;
      
      const existingRequests = Array.isArray(caseData.advocate_requests) ? caseData.advocate_requests : [];
      
      // 2. Check if a pending request already exists for this advocate and party
      const isAlreadyPending = existingRequests.some(
        req => req.advocate_id === advocateId && req.party_type === partyType && req.status === 'pending'
      );
      
      if (isAlreadyPending) {
        setSuccess(`A request is already pending with ${advocateName}.`);
        setLoading(false);
        return;
      }
      
      // 3. Create the new request object
      const timestamp = new Date().toISOString();
      const newRequest = {
        _id: `REQ-${Date.now()}`,
        request_id: `REQ-${Date.now()}`,
        advocate_id: advocateId,
        advocate_name: advocateName,
        party_type: partyType,
        status: 'pending',
        requested_at: timestamp,
        updated_at: timestamp,
        litigant_id: currentPartyId
      };
      
      // 4. Update the legal_cases table by appending the new request
      const { error: updateError } = await supabase
        .from('legal_cases')
        .update({ 
          advocate_requests: [...existingRequests, newRequest] 
        })
        .eq('case_num', selectedCase.case_num);
      
      if (updateError) throw updateError;
      
      setSuccess(`Join request sent to Advocate ${advocateName}!`);
      
      // 5. Update local state and refresh cases
      await fetchCases();
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error requesting advocate:', error);
      setError('Failed to send join request. Please try again.');
      setLoading(false);
    }
  };

  const removeAdvocate = async (partyType) => {
    if (!window.confirm(`Are you sure you want to remove your assigned ${partyType}'s advocate?`)) return;
    try {
      setLoading(true);
      // Clear advocate from the JSONB field in legal_cases
      const update = partyType === 'plaintiff'
        ? { 'plaintiff_details': { ...selectedCase.plaintiff_details, advocate_id: null, advocate: '' } }
        : { 'respondent_details': { ...selectedCase.respondent_details, advocate_id: null, advocate: '' } };
      const { error } = await supabase.from('legal_cases').update(update).eq('case_num', selectedCase.case_num);
      if (error) throw error;
      setSuccess('Advocate removed successfully');
      const updatedCase = { ...selectedCase, ...update };
      setSelectedCase(updatedCase);
      await fetchCases();
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing advocate:', error);
      setError('Failed to remove advocate');
      setLoading(false);
    }
  };

  const cancelPendingRequest = async (partyType) => {
    if (!window.confirm(`Are you sure you want to cancel your pending advocate request?`)) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('advocate_change_requests')
        .update({ status: 'cancelled' })
        .eq('case_num', selectedCase.case_num)
        .eq('litigant_id', currentPartyId)
        .eq('status', 'pending');
      if (error) throw error;
      setSuccess('Pending request cancelled successfully');
      await fetchCases();
      await fetchPendingRequests();
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error cancelling request:', error);
      setError('Failed to cancel request');
      setLoading(false);
    }
  };

  const handleApproveRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('advocate_change_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
      setSuccess('Advocate request approved');
      setPendingRequests(pendingRequests.filter(req => req.requests?.every(r => r.id !== requestId)));
      await fetchCases();
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request');
      setLoading(false);
    }
  };

  const handleRejectRequest = async (caseId, requestId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('advocate_change_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
      setSuccess('Request rejected successfully');
      fetchPendingRequests();
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request');
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
                  <tr key={caseItem.case_num}>
                    <td>{caseItem.case_num || 'N/A'}</td>
                    <td>{caseItem.court}</td>
                    <td>{caseItem.case_type}</td>
                    <td>{caseItem.district && caseItem.district.toLowerCase() !== 'unknown' ? caseItem.district : 'Not Specified'}</td>
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
                    <span className="las-detail-value">{selectedCase.district && selectedCase.district.toLowerCase() !== 'unknown' ? selectedCase.district : 'Not Specified'}</span>
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
                        <span className="las-detail-value">{request.district && request.district.toLowerCase() !== 'unknown' ? request.district : 'Not Specified'}</span>
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
                      <div key={req.id} className="las-request-subcard">
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
                            onClick={() => handleApproveRequest(request.case_id, req.id || req._id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="las-btn las-btn-danger las-btn-sm"
                            onClick={() => handleRejectRequest(request.case_id, req.id || req._id)}
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
                <div key={req.request_id || req.id} className="las-request-card" style={{borderLeft: `4px solid ${req.noc_request_status === 'Signed' ? '#22c55e' : req.noc_request_status === 'Declined' ? '#ef4444' : '#fbbf24'}`}}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="las-request-title">Case: {req.case_id || 'N/A'}</h3>
                    <span className={`las-status-badge ${(req.noc_request_status || 'none').toLowerCase()}`} style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: req.noc_request_status === 'Signed' ? '#dcfce7' : req.noc_request_status === 'Declined' ? '#fee2e2' : '#fef3c7',
                      color: req.noc_request_status === 'Signed' ? '#166534' : req.noc_request_status === 'Declined' ? '#991b1b' : '#92400e'
                    }}>
                      NOC: {req.noc_request_status || 'None'}
                    </span>
                  </div>
                  
                  <div className="las-case-details">
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Current Advocate:</span>
                        <span className="las-detail-value">{req.existing_advocate_id}</span>
                      </div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Status:</span>
                        <span className="las-detail-value">{req.status}</span>
                      </div>
                    </div>
                    <div>
                      <div className="las-detail-item">
                        <span className="las-detail-label">Requested On:</span>
                        <span className="las-detail-value">{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {req.noc_request_status === 'Declined' && (
                        <div className="las-detail-item" style={{color: '#ef4444'}}>
                          <span className="las-detail-label">Decline Reason:</span>
                          <span className="las-detail-value">{req.noc_decline_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{marginTop: '1rem', padding: '10px', background: '#f9fafb', borderRadius: '4px', fontSize: '0.85rem'}}>
                    {/* Pending NOC from advocate */}
                    {req.noc_request_status === 'Requested' && req.status !== 'Approved' && req.status !== 'Rejected' && (
                      <p>⏳ Your request for NOC is pending with the advocate. Once signed, it will be automatically attached to your court application.</p>
                    )}

                    {/* NOC Signed - show actions */}
                    {req.noc_request_status === 'Signed' && (
                      <div style={{marginTop: '0.5rem'}}>
                        <p style={{marginBottom: '10px'}}>✅ <strong>NOC Digitally Signed.</strong> The signature certificate has been generated.</p>
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                          <button 
                            className="las-btn las-btn-success las-btn-sm"
                            onClick={() => handleFinalSubmitToCourt(req.request_id || req.id)}
                            disabled={req.status === 'Under Court Review' || req.status === 'Approved' || req.status === 'Rejected'}
                          >
                            {req.status === 'Approved' ? '✅ Approved by Court' : req.status === 'Under Court Review' ? '📤 Submitted to Court' : req.status === 'Rejected' ? '❌ Rejected by Court' : '📤 Submit to Court'}
                          </button>
                          <button 
                            className="las-btn las-btn-secondary las-btn-sm"
                            onClick={async () => {
                              try {
                                const requestId = req.request_id || req.id || req._id;
                                const { data } = await supabaseApi.get(`/api/advocate-change/generate-application/${requestId}`);
                                if (data.html) {
                                  const blob = new Blob([data.html], { type: 'text/html' });
                                  const blobUrl = URL.createObjectURL(blob);
                                  const printWindow = window.open(blobUrl, '_blank');
                                  if (!printWindow) {
                                    window.location.href = blobUrl;
                                  }
                                  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                                }
                              } catch (err) {
                                console.error('Failed to generate application:', err);
                                alert('Failed to generate application. Please allow popups for this site and try again.');
                              }
                            }}
                          >
                            🖨️ Print NOC
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Approved by Court */}
                    {req.status === 'Approved' && (
                      <div style={{marginTop: '0.5rem', padding: '12px', background: '#dcfce7', borderRadius: '6px', borderLeft: '4px solid #22c55e'}}>
                        <p style={{margin: 0, fontWeight: 'bold', color: '#166534'}}>🎉 Advocate Change Approved by Court</p>
                        <p style={{margin: '6px 0 0', color: '#15803d'}}>
                          Your previous advocate has been formally discharged from this case. You may now engage a new advocate by going to <strong>"Find and Attach Advocate"</strong> and requesting a new lawyer for this case.
                        </p>
                        {req.review_remarks && (
                          <p style={{margin: '8px 0 0', fontSize: '0.8rem', color: '#555'}}><strong>Court Remarks:</strong> {req.review_remarks}</p>
                        )}
                      </div>
                    )}

                    {/* Rejected by Court */}
                    {req.status === 'Rejected' && (
                      <div style={{marginTop: '0.5rem', padding: '12px', background: '#fee2e2', borderRadius: '6px', borderLeft: '4px solid #ef4444'}}>
                        <p style={{margin: 0, fontWeight: 'bold', color: '#991b1b'}}>❌ Advocate Change Rejected by Court</p>
                        <p style={{margin: '6px 0 0', color: '#b91c1c'}}>
                          The court has rejected your request to change advocate. Your current advocate remains assigned to this case. You may file a fresh application with additional justification if needed.
                        </p>
                        {req.review_remarks && (
                          <p style={{margin: '8px 0 0', fontSize: '0.8rem', color: '#555'}}><strong>Court Remarks:</strong> {req.review_remarks}</p>
                        )}
                      </div>
                    )}

                    {/* Under Court Review */}
                    {req.status === 'Under Court Review' && req.noc_request_status !== 'Signed' && (
                      <p>📋 Your application is currently under review by the court. You will be notified once a decision is made.</p>
                    )}

                    {/* NOC Declined by advocate */}
                    {req.noc_request_status === 'Declined' && req.status !== 'Approved' && req.status !== 'Rejected' && (
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