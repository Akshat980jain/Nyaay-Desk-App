import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import '../ComponentsCSS/ChangeAdvocateModal.css';

const ChangeAdvocateModal = ({ isOpen, onClose, legalCase, litigantProfile, partyType }) => {
  const [step, setStep] = useState(1);
  const [hasNoc, setHasNoc] = useState(null);
  
  // NOC Form State
  const [nocFile, setNocFile] = useState(null);
  const [nocDetails, setNocDetails] = useState({
    advocateName: '',
    enrollmentNumber: '',
    signatureType: 'Manual',
    dateSigned: ''
  });
  
  // No NOC Form State
  const [reasonForNoNoc, setReasonForNoNoc] = useState('');
  
  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [partyTypeState, setPartyTypeState] = useState(partyType || 'plaintiff');
  const [requestNocFromLawyer, setRequestNocFromLawyer] = useState(false);

  if (!isOpen) return null;

  const determineExistingAdvocate = () => {
    if (!legalCase) return null;
    
    const targetParty = partyTypeState === 'plaintiff' ? 'plaintiff_details' : 'respondent_details';
    if (legalCase[targetParty] && legalCase[targetParty].advocate_id) {
      return legalCase[targetParty].advocate_id;
    }
    
    return null;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNocFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const existingAdvocateId = determineExistingAdvocate();
      
      if (!existingAdvocateId) {
        throw new Error('No existing advocate found to discharge.');
      }

      if (!hasNoc && reasonForNoNoc.length < 30) {
        throw new Error('Please provide a detailed justification (min 30 characters).');
      }

      const payload = {
        caseId: legalCase._id,
        litigantId: litigantProfile.party_id,
        existingAdvocateId: existingAdvocateId,
        hasNoc,
        requestNocFromLawyer,
        nocDetails: hasNoc ? nocDetails : undefined,
        reasonForNoNoc: !hasNoc ? reasonForNoNoc : undefined
      };

      const token = localStorage.getItem('token');
      
      // Step 1: Submit Request
      const res = await axios.post('https://nyaay-desk-app-backend.onrender.com/api/advocate-change/request', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const requestId = res.data.request._id;
      setSubmittedRequestId(requestId);

      // Step 2: If NOC, upload file
      if (hasNoc && nocFile) {
        const formData = new FormData();
        formData.append('noc_document', nocFile);
        await axios.post(`https://nyaay-desk-app-backend.onrender.com/api/advocate-change/upload-noc/${requestId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setStep(4); // Success step
      setSuccess('Advocate change request submitted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="adv-change-step">
      <h3>Step 1: No Objection Certificate (NOC)</h3>
      <p>Do you have a No Objection Certificate from your current advocate?</p>
      <div className="adv-change-buttons-row">
        <button 
          className={`adv-change-btn ${hasNoc === true ? 'active' : ''}`}
          onClick={() => setHasNoc(true)}
        >
          Yes, I have an NOC
        </button>
        <button 
          className={`adv-change-btn outline ${hasNoc === false && !requestNocFromLawyer ? 'active' : ''}`}
          onClick={() => { setHasNoc(false); setRequestNocFromLawyer(false); }}
        >
          No, I don't have an NOC
        </button>
        <button 
          className={`adv-change-btn outline ${requestNocFromLawyer ? 'active' : ''}`}
          onClick={() => { setHasNoc(false); setRequestNocFromLawyer(true); }}
        >
          Request NOC from current Lawyer
        </button>
      </div>
      {(hasNoc !== null || requestNocFromLawyer) && (
        <button className="adv-change-btn-primary mt-4" onClick={() => setStep(2)}>
          Continue
        </button>
      )}
    </div>
  );

  const renderStep2Yes = () => (
    <div className="adv-change-step">
      <h3>Step 2: Upload NOC Details</h3>
      
      <div className="adv-change-form-group">
        <label>Upload NOC Document (PDF/Image)</label>
        <div className="adv-change-file-upload">
          <input type="file" accept=".pdf,image/*" onChange={handleFileChange} />
          {nocFile && <span className="file-name">{nocFile.name}</span>}
        </div>
      </div>

      <div className="adv-change-form-group">
        <label>Advocate Name</label>
        <input 
          type="text" 
          value={nocDetails.advocateName}
          onChange={(e) => setNocDetails({...nocDetails, advocateName: e.target.value})}
          placeholder="e.g. John Doe"
        />
      </div>

      <div className="adv-change-form-group">
        <label>Enrollment Number</label>
        <input 
          type="text" 
          value={nocDetails.enrollmentNumber}
          onChange={(e) => setNocDetails({...nocDetails, enrollmentNumber: e.target.value})}
          placeholder="e.g. BAR/123/2020"
        />
      </div>

      <div className="adv-change-form-group">
        <label>Date Signed</label>
        <input 
          type="date" 
          value={nocDetails.dateSigned}
          onChange={(e) => setNocDetails({...nocDetails, dateSigned: e.target.value})}
        />
      </div>

      <div className="adv-change-buttons-row justify-between mt-4">
        <button className="adv-change-btn outline" onClick={() => setStep(1)}>Back</button>
        <button 
          className="adv-change-btn-primary" 
          onClick={() => setStep(3)}
          disabled={!nocFile || !nocDetails.advocateName || !nocDetails.enrollmentNumber}
        >
          Preview Application
        </button>
      </div>
    </div>
  );

  const renderStep2No = () => (
    <div className="adv-change-step">
      <h3>Step 2: Justification Required</h3>
      
      <div className="adv-change-warning-box">
        <AlertCircle size={20} />
        <p><strong>Warning:</strong> Proceeding without an NOC requires formal Court approval. The court will review your justification before allowing a change of advocate.</p>
      </div>

      <div className="adv-change-form-group">
        <label>Reason for changing advocate (Min 50 characters)</label>
        <textarea 
          rows={5}
          value={reasonForNoNoc}
          onChange={(e) => setReasonForNoNoc(e.target.value)}
          placeholder="Please explain why you are requesting a change of advocate without an NOC..."
        />
        <span className="char-count">{reasonForNoNoc.length}/50 chars</span>
      </div>

      <div className="adv-change-buttons-row justify-between mt-4">
        <button className="adv-change-btn outline" onClick={() => setStep(1)}>Back</button>
        <button 
          className="adv-change-btn-primary" 
          onClick={() => setStep(3)}
          disabled={reasonForNoNoc.length < 50}
        >
          Preview Application
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="adv-change-step">
      <h3>Step 3: Preview Application Before Court</h3>
      
      <div className="adv-change-application-preview">
        <h4>APPLICATION FOR CHANGE OF ADVOCATE</h4>
        <p><strong>IN THE COURT OF:</strong> {legalCase?.court}</p>
        <p><strong>CASE NO:</strong> {legalCase?.case_num}</p>
        <br/>
        <p><strong>SUBJECT:</strong> Application seeking permission to discharge current advocate.</p>
        <br/>
        <p>Respectfully Showeth:</p>
        <p>1. That the applicant is the litigant in the above-mentioned case.</p>
        <p>2. That the applicant desires to change their legal representation.</p>
        {hasNoc ? (
          <p>3. That the current advocate has issued a No Objection Certificate (NOC) which is annexed herewith.</p>
        ) : requestNocFromLawyer ? (
          <>
            <p>3. That the applicant has requested a digital No Objection Certificate (NOC) from the current advocate via the portal, and the same is pending signature/approval.</p>
            <p>4. That the applicant seeks a change of counsel for the following reason:</p>
            <p className="indent italic">"{reasonForNoNoc}"</p>
          </>
        ) : (
          <>
            <p>3. That the applicant is unable to obtain an NOC from the current advocate for the following reason:</p>
            <p className="indent italic">"{reasonForNoNoc}"</p>
          </>
        )}
        <br/>
        <p><strong>PRAYER:</strong></p>
        <p>It is therefore respectfully prayed that this Hon'ble Court may be pleased to allow the applicant to discharge the current advocate and appoint a new counsel in the interest of justice.</p>
      </div>

      {error && <div className="adv-change-error">{error}</div>}

      <div className="adv-change-buttons-row justify-between mt-4">
        <button className="adv-change-btn outline" onClick={() => setStep(2)}>Back</button>
        <button 
          className="adv-change-btn-primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit to Court'}
        </button>
      </div>
    </div>
  );

  const handlePrintApplication = () => {
    if (submittedRequestId) {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      window.open(`${API}/api/advocate-change/generate-application/${submittedRequestId}`, '_blank', 'width=800,height=800');
    }
  };

  const renderStep4 = () => (
    <div className="adv-change-step success-step">
      <CheckCircle size={60} color="#28a745" />
      <h3>Request Submitted!</h3>
      <p>{success}</p>
      <p className="mt-2 text-sm text-gray-600">The court administration will review your request. You can track the status in your dashboard.</p>
      
      {submittedRequestId && (
        <div className="mt-4 p-4 bg-gray-50 border rounded text-center">
          <p className="mb-2 font-medium">Next Step: Print and sign your formal court application.</p>
          <button 
            className="adv-change-btn outline"
            onClick={handlePrintApplication}
            style={{ width: '100%', marginBottom: '10px', borderColor: '#1a365d', color: '#1a365d' }}
          >
            <FileText size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'sub' }}/> 
            Print Application Before Court
          </button>
        </div>
      )}
      
      <button className="adv-change-btn-primary mt-4" onClick={onClose} style={{ width: '100%' }}>
        Close
      </button>
    </div>
  );

  return (
    <div className="adv-change-modal-overlay">
      <div className="adv-change-modal-content">
        <div className="adv-change-modal-header">
          <h2>Change of Advocate</h2>
          <button className="adv-change-close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="adv-change-modal-body">
          {step === 1 && renderStep1()}
          {step === 2 && hasNoc && renderStep2Yes()}
          {step === 2 && !hasNoc && !requestNocFromLawyer && renderStep2No()}
          {step === 2 && !hasNoc && requestNocFromLawyer && (
            <div className="adv-change-step">
              <h3>Step 2: Request NOC from Lawyer</h3>
              <div className="adv-change-info-box">
                <FileText size={20} />
                <p>We will send a formal request to <strong>{legalCase[partyTypeState === 'plaintiff' ? 'plaintiff_details' : 'respondent_details'].advocate}</strong> to digitally sign an NOC for this case.</p>
              </div>

              <div className="adv-change-form-group mt-4">
                <label>Reason for changing advocate (Min 30 characters)</label>
                <textarea 
                  rows={4}
                  value={reasonForNoNoc}
                  onChange={(e) => setReasonForNoNoc(e.target.value)}
                  placeholder="Please explain why you are requesting a change of counsel..."
                />
                <span className="char-count">{reasonForNoNoc.length}/30 chars</span>
              </div>

              <p className="mt-4 text-gray-600">You will be notified once the lawyer signs or declines the request. If signed, the NOC will be automatically attached to your application.</p>
              <div className="adv-change-buttons-row justify-between mt-6">
                <button className="adv-change-btn outline" onClick={() => setStep(1)}>Back</button>
                <button 
                  className="adv-change-btn-primary" 
                  onClick={() => setStep(3)}
                  disabled={reasonForNoNoc.length < 30}
                >
                  Preview Application
                </button>
              </div>
            </div>
          )}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};

export default ChangeAdvocateModal;
