import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import '../ComponentsCSS/AccountManagement.css';

const AccountManagement = () => {
  const [activeTab, setActiveTab] = useState('litigants');
  const [litigants, setLitigants] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // For action modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReinstateModal, setShowReinstateModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [currentActionId, setCurrentActionId] = useState(null);

  // Load data when component mounts or tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { data, error } = await supabase
        .from(activeTab)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (activeTab === 'litigants') {
        setLitigants(data);
      } else {
        setAdvocates(data);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setMessage({ 
        text: err.message || `Failed to load ${activeTab}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setIsLoading(true);
    setSelectedUser(null);
    setMessage({ text: '', type: '' });
    
    try {
      const idField = activeTab === 'litigants' ? 'party_id' : 'advocate_id';
      const { data, error } = await supabase
        .from(activeTab)
        .select('*')
        .eq(idField, id)
        .single();
      
      if (error) throw error;
      setSelectedUser(data);
    } catch (err) {
      console.error('Error fetching details:', err);
      setMessage({ 
        text: err.message || 'Failed to fetch details',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open suspend modal
  const openSuspendModal = (id) => {
    setCurrentActionId(id);
    setSuspensionReason('');
    setShowSuspendModal(true);
  };

  // Open reinstate modal
  const openReinstateModal = (id) => {
    setCurrentActionId(id);
    setShowReinstateModal(true);
  };

  // Close all modals
  const closeModals = () => {
    setShowSuspendModal(false);
    setShowReinstateModal(false);
    setCurrentActionId(null);
    setSuspensionReason('');
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      setMessage({ text: 'Please provide a reason for suspension', type: 'error' });
      return;
    }
  
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const idField = activeTab === 'litigants' ? 'party_id' : 'advocate_id';
      const { error } = await supabase
        .from(activeTab)
        .update({ 
          status: 'suspended', 
          suspension_reason: suspensionReason,
          suspension_date: new Date().toISOString()
        })
        .eq(idField, currentActionId);
      
      if (error) throw error;
      
      if (activeTab === 'litigants') {
        setLitigants(litigants.map(litigant => 
          litigant.party_id === currentActionId 
            ? {...litigant, status: 'suspended'} 
            : litigant
        ));
      } else {
        setAdvocates(advocates.map(advocate => 
          advocate.advocate_id === currentActionId 
            ? {...advocate, status: 'suspended'} 
            : advocate
        ));
      }
      
      if (selectedUser && (selectedUser.party_id === currentActionId || selectedUser.advocate_id === currentActionId)) {
        setSelectedUser({...selectedUser, status: 'suspended', suspension_reason: suspensionReason });
      }
      
      setMessage({ text: 'Account suspended successfully', type: 'success' });
      closeModals();
    } catch (err) {
      console.error('Error suspending account:', err);
      setMessage({ 
        text: err.message || 'Failed to suspend account',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReinstate = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const idField = activeTab === 'litigants' ? 'party_id' : 'advocate_id';
      const { error } = await supabase
        .from(activeTab)
        .update({ 
          status: 'active', 
          suspension_reason: null,
          suspension_date: null,
          is_verified: true // Automatically verify when reinstating if needed
        })
        .eq(idField, currentActionId);
      
      if (error) throw error;
      
      if (activeTab === 'litigants') {
        setLitigants(litigants.map(litigant => 
          litigant.party_id === currentActionId 
            ? {...litigant, status: 'active'} 
            : litigant
        ));
      } else {
        setAdvocates(advocates.map(advocate => 
          advocate.advocate_id === currentActionId 
            ? {...advocate, status: 'active'} 
            : advocate
        ));
      }

      if (selectedUser && (selectedUser.party_id === currentActionId || selectedUser.advocate_id === currentActionId)) {
        setSelectedUser({...selectedUser, status: 'active', suspension_reason: undefined });
      }
      
      setMessage({ text: 'Account reinstated successfully', type: 'success' });
      closeModals();
    } catch (err) {
      console.error('Error reinstating account:', err);
      setMessage({ 
        text: err.message || 'Failed to reinstate account',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and get users based on search term and status filter
  const getFilteredUsers = () => {
    const users = activeTab === 'litigants' ? litigants : advocates;
    return users.filter(user => {
      const name = activeTab === 'litigants' ? user.full_name : user.name;
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Close details panel
  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  // Render address or practice details
  const renderDetails = (user) => {
    if (activeTab === 'litigants') {
      const address = user.address || {};
      return (
        <>
          <p><strong>Address:</strong> {address.street || 'N/A'}</p>
          <p><strong>City:</strong> {address.city || 'N/A'}</p>
          <p><strong>District:</strong> {address.district || 'N/A'}</p>
          <p><strong>State:</strong> {address.state || 'N/A'}</p>
          <p><strong>Pincode:</strong> {address.pincode || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
          {user.status === 'suspended' && user.suspension_reason && (
            <div className="suspension-details">
              <p><strong>Suspension Reason:</strong> {user.suspension_reason}</p>
              {user.suspension_date && (
                <p><strong>Suspended On:</strong> {new Date(user.suspension_date).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </>
      );
    } else {
      const practice = user.practice_details || {};
      return (
        <>
          <p><strong>Bar Council ID:</strong> {user.bar_council_id || 'N/A'}</p>
          <p><strong>Enrollment Date:</strong> {user.enrollment_date ? new Date(user.enrollment_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Practice Area:</strong> {practice.practice_area || 'N/A'}</p>
          <p><strong>District:</strong> {practice.district || 'N/A'}</p>
          <p><strong>State:</strong> {practice.state || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
          {user.status === 'suspended' && user.suspension_reason && (
            <div className="suspension-details">
              <p><strong>Suspension Reason:</strong> {user.suspension_reason}</p>
              {user.suspension_date && (
                <p><strong>Suspended On:</strong> {new Date(user.suspension_date).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </>
      );
    }
  };

  return (
    <div className="account-container">
      <header className="main-header">
        <h1>Account Management</h1>
      </header>
      
      <div className="tab-navigation">
        <button 
          className={activeTab === 'litigants' ? 'tab-active' : ''} 
          onClick={() => {
            setActiveTab('litigants');
            setSelectedUser(null);
          }}
        >
          Litigants
        </button>
        <button 
          className={activeTab === 'advocates' ? 'tab-active' : ''} 
          onClick={() => {
            setActiveTab('advocates');
            setSelectedUser(null);
          }}
        >
          Advocates
        </button>
      </div>
      
      <div className="filter-section">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-field"
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-selector"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      
      {message.text && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className={`main-content ${selectedUser ? 'show-details' : ''}`}>
        <div className="user-table">
          {isLoading && !selectedUser ? (
            <div className="loader">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">No {activeTab} found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const id = activeTab === 'litigants' ? user.party_id : user.advocate_id;
                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{activeTab === 'litigants' ? user.full_name : user.name}</td>
                      <td>
                        <span className={`status-indicator ${user.status}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button 
                          onClick={() => handleViewDetails(id)}
                          className="btn btn-view"
                        >
                          View Details
                        </button>
                        {user.status === 'active' ? (
                          <button 
                            onClick={() => openSuspendModal(id)}
                            className="btn btn-suspend"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button 
                            onClick={() => openReinstateModal(id)}
                            className="btn btn-reinstate"
                          >
                            Reinstate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {selectedUser && (
          <div className="details-sidebar">
            <div className="details-heading">
              <h2>
                {activeTab === 'litigants' ? 'Litigant' : 'Advocate'} Details
              </h2>
              <button onClick={handleCloseDetails} className="close-button">×</button>
            </div>
            
            {isLoading ? (
              <div className="loader">Loading details...</div>
            ) : (
              <div className="details-info">
                <h3>
                  {activeTab === 'litigants' ? selectedUser.full_name : selectedUser.name}
                  <span className={`status-indicator ${selectedUser.status}`}>
                    {selectedUser.status}
                  </span>
                </h3>
                <p><strong>ID:</strong> {activeTab === 'litigants' ? selectedUser.party_id : selectedUser.advocate_id}</p>
                {renderDetails(selectedUser)}
                <div className="details-controls">
                  {selectedUser.status === 'active' ? (
                    <button 
                      onClick={() => openSuspendModal(activeTab === 'litigants' ? selectedUser.party_id : selectedUser.advocate_id)}
                      className="btn btn-suspend"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button 
                      onClick={() => openReinstateModal(activeTab === 'litigants' ? selectedUser.party_id : selectedUser.advocate_id)}
                      className="btn btn-reinstate"
                    >
                      Reinstate Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suspension Modal */}
      {showSuspendModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-heading">
              <h3>Suspend Account</h3>
              <button onClick={closeModals} className="close-button">×</button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to suspend this {activeTab === 'litigants' ? 'litigant' : 'advocate'} account?</p>
              <p>Please provide a reason for suspension:</p>
              <textarea 
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows="4"
                className="suspension-input"
                required
              />
              {message.text && message.type === 'error' && (
                <div className="modal-error-message">{message.text}</div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={closeModals} className="btn btn-cancel">Cancel</button>
              <button 
                onClick={handleSuspend} 
                className="btn btn-confirm"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reinstatement Modal */}
      {showReinstateModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-heading">
              <h3>Reinstate Account</h3>
              <button onClick={closeModals} className="close-button"> veranderingen×</button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to reinstate this {activeTab === 'litigants' ? 'litigant' : 'advocate'} account?</p>
              <p>This will restore full access to their account.</p>
              {message.text && message.type === 'error' && (
                <div className="modal-error-message">{message.text}</div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={closeModals} className="btn btn-cancel">Cancel</button>
              <button 
                onClick={handleReinstate} 
                className="btn btn-confirm"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Reinstatement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;