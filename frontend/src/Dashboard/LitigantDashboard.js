import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Calendar, Database, Info, Book, Users, Video, X, Download, FileDown } from 'lucide-react';
import '../ComponentsCSS/LitigantDashboardStyles.css';
import emblem from '../images/aadiimage4.svg';
import logo from '../images/aadiimage4.png';
import stamp from '../images/aadiimage8.png';

// Import components
import NoticeBoard from '../Components/NoticeBoard';
import UserCalendar from '../Components/UserCalendar';
import LitigantMeeting from '../Components/Litigantmeeting';
import LitigantCaseAssign from '../Components/litigantcaseassign';
import UploadVideoPlead from '../Components/UploadVideo';
import LegalAssistantChatbot from '../Components/LegalAssistantChatbot';
import NyaaySaathi from '../Components/nyaaysaathi';
import LitigantLiveDashboard from '../Components/Litigantlivedashboard';
import ChangeAdvocateModal from '../Components/ChangeAdvocateModal';
import Popup from '../Components/Popup';

const LitigantDashboard = () => {
  // Profile and Auth State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');

  // Navigation State - Persist active section in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('litigant_active_section') || 'dashboard';
  });

  // Cases State
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('details');
  const [searchCaseNum, setSearchCaseNum] = useState('');
  const [searchedHearings, setSearchedHearings] = useState(null);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [hearingsError, setHearingsError] = useState(null);
  const [allHearings, setAllHearings] = useState([]);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [isHearingDetailsOpen, setIsHearingDetailsOpen] = useState(false);


  // Documents State
  const [documents, setDocuments] = useState([]);
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [documentSuccess, setDocumentSuccess] = useState('');
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Form State
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  // Add these to your existing state declarations (around line 50-70)
  const [documentRequests, setDocumentRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedDocumentRequest, setSelectedDocumentRequest] = useState(null);
  const [uploadingRequestedDoc, setUploadingRequestedDoc] = useState(false);

  const [isChangeAdvocateOpen, setIsChangeAdvocateOpen] = useState(false);
  const [selectedCaseForAdvocateChange, setSelectedCaseForAdvocateChange] = useState(null);
  const [advocateChangeRequests, setAdvocateChangeRequests] = useState([]);
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'success' });

  const navigate = useNavigate();

  const initialFormState = {
    court: 'District & Sessions Court',
    case_type: 'Civil',
    plaintiff_details: {
      party_id: '',
      name: '',
      father_mother_husband: '',
      address: '',
      pin: '',
      sex: '',
      age: '',
      caste: '',
      nationality: 'Indian',
      if_other_mention: '',
      occupation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      subject: '',
      advocate_id: '',
      advocate: '',
    },
    respondent_details: {
      party_id: '',
      name: '',
      father_mother_husband: '',
      address: '',
      pin: '',
      sex: '',
      age: '',
      caste: '',
      nationality: 'Indian',
      if_other_mention: '',
      occupation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      subject: '',
      advocate_id: '',
      advocate: '',
    },
    police_station_details: {
      police_station: '',
      fir_no: '',
      fir_year: new Date().getFullYear(),
      date_of_offence: '',
    },
    lower_court_details: {
      court_name: '',
      case_no: '',
      decision_date: '',
    },
    main_matter_details: {
      case_type: '',
      case_no: '',
      year: new Date().getFullYear(),
    },
  };

  const [formData, setFormData] = useState(initialFormState);

  // Persist active section to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('litigant_active_section', activeSection);
  }, [activeSection]);

  // Load profile from localStorage (saved during login by authService)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/litilogin');
      return;
    }
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setProfile(JSON.parse(userData));
        setLoading(false);
      } catch {
        setError('Failed to load profile data. Please log in again.');
        setLoading(false);
      }
    } else {
      setError('No profile data found. Please log in again.');
      setLoading(false);
      navigate('/litilogin');
    }
  }, [navigate]);

  // Fetch cases from Supabase
  const fetchCases = async () => {
    if (!profile) return;
    setCasesLoading(true);
    try {
      const { data, error: casesError } = await supabase
        .from('legal_cases')
        .select('*')
        .or(`plaintiff_details->>party_id.eq.${profile?.litigant_id || profile?.party_id},respondent_details->>party_id.eq.${profile?.litigant_id || profile?.party_id}`);

      if (casesError) throw casesError;
      setCases(data || []);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      setError('Failed to fetch cases');
    } finally {
      setCasesLoading(false);
    }
  };

  // Fetch cases from Supabase on mount
  useEffect(() => {
    if (!loading && profile) {
      fetchCases();
      fetchAdvocateChangeRequests();
    }
  }, [loading, profile]);

  // Listen for global update events (e.g. from Video Pleading recorder)
  useEffect(() => {
    const handleUpdate = (event) => {
      console.log('Case data update detected:', event.detail);
      fetchCases();
      // If we are currently looking at the updated case's documents, refresh them too
      if (selectedCaseForDocuments && event.detail?.caseNum === selectedCaseForDocuments.case_num) {
        fetchDocuments(event.detail.caseNum);
      }
    };

    window.addEventListener('caseDataUpdated', handleUpdate);
    return () => window.removeEventListener('caseDataUpdated', handleUpdate);
  }, [selectedCaseForDocuments, profile]);

  const fetchAdvocateChangeRequests = async () => {
    try {
      const litigantId = profile?.litigant_id || profile?.party_id;
      if (!litigantId) return;
      const { data, error: err } = await supabase
        .from('advocate_change_requests')
        .select('*')
        .eq('litigant_id', litigantId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setAdvocateChangeRequests(data || []);
    } catch (err) {
      console.error('Error fetching advocate change requests:', err);
    }
  };

  const handleFinalSubmitToCourt = async (requestId) => {
    try {
      const { error: err } = await supabase
        .from('advocate_change_requests')
        .update({ status: 'Under Court Review' })
        .eq('request_id', requestId);
      if (err) throw err;
      setPopup({ isOpen: true, message: 'Application submitted to court successfully!', type: 'success' });
      fetchAdvocateChangeRequests();
    } catch (err) {
      console.error('Error submitting to court:', err);
      setPopup({ isOpen: true, message: 'Failed to submit to court. Please try again.', type: 'error' });
    }
  };

  // Fetch hearings

  useEffect(() => {
    const fetchAllHearings = async () => {
      setHearingsLoading(true);
      try {
        // Hearings are stored as JSONB in legal_cases — extract them directly
        const allHearingsData = cases.flatMap(legalCase =>
          (legalCase.hearings || []).map(h => ({
            ...h,
            case_num: legalCase.case_num,
            case_type: legalCase.case_type
          }))
        );
        const sortedHearings = allHearingsData.sort(
          (a, b) => new Date(b.hearing_date) - new Date(a.hearing_date)
        );
        setAllHearings(sortedHearings);
        setHearingsError(null);
      } catch (error) {
        setHearingsError('Failed to load hearings');
      } finally {
        setHearingsLoading(false);
      }
    };
    if (activeSection === 'hearings' && cases.length > 0) {
      fetchAllHearings();
    }
  }, [activeSection, cases]);
  // Add this useEffect after your existing useEffects (around line 180)
  useEffect(() => {
    const fetchDocumentRequests = async () => {
      setRequestsLoading(true);
      try {
        const litigantId = profile?.litigant_id || profile?.party_id;
        if (!litigantId) return;
        const { data, error: err } = await supabase
          .from('document_requests')
          .select('*')
          .eq('requested_from', litigantId)
          .order('created_at', { ascending: false });
        if (err) throw err;
        setDocumentRequests(data || []);
      } catch (error) {
        console.error('Error fetching document requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };
    if (activeSection === 'documents' && profile) {
      fetchDocumentRequests();
    }
  }, [activeSection, profile]);
  // Add this function after handleDocumentUpload (around line 340)
  const handleRequestedDocumentUpload = async (e, documentId, caseNum) => {
    e.preventDefault();
    setUploadingRequestedDoc(true);
    setDocumentError('');
    setDocumentSuccess('');

    if (!documentFile) {
      setDocumentError('Please select a file to upload');
      setUploadingRequestedDoc(false);
      return;
    }

    try {
      const timestamp = Date.now();
      const ext = documentFile.name.split('.').pop();
      const filePath = `${caseNum}/requested/${documentId}-${timestamp}.${ext}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-pleadings') // Reusing the same bucket for simplicity
        .upload(filePath, documentFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-pleadings')
        .getPublicUrl(filePath);

      // 3. Update the document request in document_requests table
      // Note: This assumes document_requests table exists and has a file_path and status field
      const { error: updateError } = await supabase
        .from('document_requests')
        .update({
          status: 'fulfilled',
          file_path: publicUrl,
          uploaded_at: new Date().toISOString()
        })
        .eq('document_id', documentId);

      if (updateError) throw updateError;

      setDocumentSuccess('Requested document uploaded successfully. Pending admin verification.');
      setDocumentFile(null);
      setSelectedDocumentRequest(null);
      if (document.getElementById('requested-doc-file-input')) {
        document.getElementById('requested-doc-file-input').value = '';
      }

      // Refresh document requests (we'll need to fetch them from Supabase)
      const { data: requests, error: reqError } = await supabase
        .from('document_requests')
        .select('*')
        .eq('case_num', caseNum);

      if (!reqError) {
        setDocumentRequests(requests || []);
      }

    } catch (error) {
      console.error('Error uploading requested document:', error);
      setDocumentError(error.message || 'Failed to upload requested document');
    } finally {
      setUploadingRequestedDoc(false);
    }
  };
  const handleHearingSearch = async (e) => {
    e.preventDefault();
    setHearingsLoading(true);
    setHearingsError(null);
    try {
      const { data, error: err } = await supabase
        .from('legal_cases')
        .select('hearings, case_type')
        .eq('case_num', searchCaseNum)
        .single();
      if (err) throw err;
      setSearchedHearings(data?.hearings || []);
    } catch (error) {
      setHearingsError('Failed to fetch hearings for case: ' + searchCaseNum);
    } finally {
      setHearingsLoading(false);
    }
  };
  const printHearingOrder = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const orderContent = document.querySelector('.hearing-order-sheet');
    if (!orderContent) {
      alert('Order content not found');
      printWindow.close();
      return;
    }
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Sheet</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 20px; 
              background: white;
            }
            .hearing-order-sheet {
              max-width: 800px; 
              margin: 0 auto; 
              padding: 40px; 
              background-color: #fff;
              color: #000;
            }
            .order-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .order-header h1 {
              font-size: 24px;
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 10px;
            }
            .order-meta {
              margin-bottom: 20px;
            }
            .order-meta table {
              width: 100%;
              border-collapse: collapse;
            }
            .order-meta td {
              padding: 8px 0;
              vertical-align: top;
            }
            .order-meta .label {
              font-weight: bold;
              width: 200px;
            }
            .order-content {
              margin: 30px 0;
              text-align: justify;
              line-height: 1.8;
              font-size: 14px;
            }
            .order-content p {
              margin-bottom: 12px;
            }
            .order-signature {
              margin-top: 60px;
              text-align: right;
            }
            .signature-box {
              display: inline-block;
              min-width: 250px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-bottom: 5px;
              padding-top: 40px;
            }
            .signature-details {
              font-size: 12px;
              margin-top: 10px;
              text-align: left;
              padding-left: 10px;
            }
            .digital-signature-box {
              margin-top: 40px;
              border: 1px solid #000;
              padding: 15px;
              background: #f9f9f9;
            }
            .digital-signature-box h4 {
              font-size: 14px;
              margin-bottom: 10px;
              text-decoration: underline;
            }
            .digital-signature-box p {
              font-size: 12px;
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 0; }
              .hearing-order-sheet { border: none; box-shadow: none; }
              @page { size: A4; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${orderContent.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import('../services/supabaseClient');
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      localStorage.removeItem('litigant_active_section');
      navigate('/litilogin');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if signout fails
      localStorage.clear();
      navigate('/litilogin');
    }
  };

  const handleLogoutAll = async () => {
    try {
      const { supabase } = await import('../services/supabaseClient');
      // Supabase signOut with scope 'global' invalidates all sessions
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      localStorage.removeItem('litigant_active_section');
      setShowLogoutConfirm(false);
      navigate('/litilogin');
    } catch (error) {
      console.error('Logout all error:', error);
      localStorage.clear();
      navigate('/litilogin');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const handleTopLevelChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Only show police station details for Criminal and criminal-related cases
      const criminalTypes = ['Criminal', 'MAGISTRIAL CASES', 'MISC. CRIM APLN', 'SESSIONS CASES', 'CRIM APPEAL'];
      if (field === 'case_type' && !criminalTypes.includes(value)) {
        delete newData.police_station_details;
      }
      return newData;
    });
  };
  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Client-side validation
    const pAge = parseInt(formData.plaintiff_details.age, 10);
    const rAge = parseInt(formData.respondent_details.age, 10);
    if (!pAge || pAge < 1 || pAge > 120) {
      setFormError('Plaintiff age must be between 1 and 120');
      return;
    }
    if (!rAge || rAge < 1 || rAge > 120) {
      setFormError('Respondent age must be between 1 and 120');
      return;
    }
    if (formData.plaintiff_details.pin && formData.plaintiff_details.pin.length !== 6) {
      setFormError('Plaintiff PIN code must be exactly 6 digits');
      return;
    }
    if (formData.respondent_details.pin && formData.respondent_details.pin.length !== 6) {
      setFormError('Respondent PIN code must be exactly 6 digits');
      return;
    }
    if (formData.plaintiff_details.mobile && formData.plaintiff_details.mobile.length !== 10) {
      setFormError('Plaintiff mobile number must be exactly 10 digits');
      return;
    }
    if (formData.respondent_details.mobile && formData.respondent_details.mobile.length !== 10) {
      setFormError('Respondent mobile number must be exactly 10 digits');
      return;
    }
    const currentYear = new Date().getFullYear();
    const criminalTypesCheck = ['Criminal', 'MAGISTRIAL CASES', 'MISC. CRIM APLN', 'SESSIONS CASES', 'CRIM APPEAL'];
    if (criminalTypesCheck.includes(formData.case_type) && formData.police_station_details) {
      const firYear = parseInt(formData.police_station_details.fir_year, 10);
      if (!firYear || firYear < 1900 || firYear > currentYear) {
        setFormError(`FIR Year must be between 1900 and ${currentYear}`);
        return;
      }
    }
    if (formData.main_matter_details.year) {
      const mmYear = parseInt(formData.main_matter_details.year, 10);
      if (!mmYear || mmYear < 1900 || mmYear > currentYear) {
        setFormError(`Main Matter Year must be between 1900 and ${currentYear}`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const dataToSubmit = { ...formData };
      // Only include police station details for criminal-related cases
      const criminalTypes = ['Criminal', 'MAGISTRIAL CASES', 'MISC. CRIM APLN', 'SESSIONS CASES', 'CRIM APPEAL'];
      if (!criminalTypes.includes(formData.case_type)) {
        delete dataToSubmit.police_station_details;
      }
      // Make API call to file the case using Supabase Edge Function
      const response = await callEdgeFunction('file-case', dataToSubmit, true);

      setFormSuccess(`Case filed successfully! Case Number: ${response.case_num}`);

      setFormData(initialFormState);
      setActiveSection('dashboard');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to file case');
    }
  };

  const fetchDocuments = async (caseNum) => {
    if (!caseNum) return;
    setDocumentsLoading(true);
    setDocumentError('');
    try {
      // Always fetch fresh from Supabase to avoid stale cache from 'cases' state
      const { data, error } = await supabase
        .from('legal_cases')
        .select('documents, case_num, case_type, status')
        .eq('case_num', caseNum)
        .single();

      if (error) throw error;

      if (data) {
        setDocuments(data.documents || []);
        setSelectedCaseForDocuments(data);
      } else {
        setDocumentError('Case not found');
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocumentError('Failed to fetch documents: ' + error.message);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    setDocumentError('');
    setDocumentSuccess('');
    if (!documentFile) {
      setDocumentError('Please select a file to upload');
      return;
    }
    if (!documentType) {
      setDocumentError('Document type is required');
      return;
    }
    try {
      setDocumentsLoading(true);
      const timestamp = Date.now();
      const ext = documentFile.name.split('.').pop();
      const filePath = `${selectedCaseForDocuments.case_num}/litigant/${timestamp}.${ext}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-pleadings') // Reusing bucket for now
        .upload(filePath, documentFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-pleadings')
        .getPublicUrl(filePath);

      // 3. Update legal_cases table
      const newDoc = {
        document_id: `DOC-${timestamp}`,
        document_type: documentType,
        description: documentDescription,
        file_name: documentFile.name,
        file_path: publicUrl,
        upload_date: new Date().toISOString(),
        uploaded_by_role: 'litigant',
        uploaded_by_name: profile?.name || 'Litigant'
      };

      const updatedDocs = [...(selectedCaseForDocuments.documents || []), newDoc];

      const { error: updateError } = await supabase
        .from('legal_cases')
        .update({ documents: updatedDocs })
        .eq('case_num', selectedCaseForDocuments.case_num);

      if (updateError) throw updateError;

      setDocumentSuccess('Document uploaded successfully');

      // Update local state
      setDocuments(updatedDocs);
      setSelectedCaseForDocuments({ ...selectedCaseForDocuments, documents: updatedDocs });

      setDocumentFile(null);
      setDocumentType('');
      setDocumentDescription('');
      if (document.getElementById('litigantdoc-upload-file-input')) {
        document.getElementById('litigantdoc-upload-file-input').value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setDocumentError(error.message || 'Failed to upload document');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const doc = documents.find(d => d.document_id === documentId);
      if (!doc) throw new Error('Document not found');

      // If it's already a full URL, just open it
      if (doc.file_path && (doc.file_path.startsWith('http') || doc.file_path.startsWith('https'))) {
        window.open(doc.file_path, '_blank');
        return;
      }

      // Generate a signed URL for the document from Supabase Storage
      const bucketName = 'case-documents';
      const filePath = doc.file_path || `${documentId}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 300); // 5 minute expiry

      if (error) {
        // Try fallback bucket or direct path
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 300);

        if (fallbackError) throw fallbackError;
        window.open(fallbackData.signedUrl, '_blank');
      } else {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      setDocumentError('Failed to download document: ' + error.message);
    }
  };

  const downloadAttachment = async (filename, originalname) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-attachments')
        .createSignedUrl(filename, 300);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the file: ' + error.message);
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const receiptContent = document.querySelector('.lit-case-filing-receipt');
    if (!receiptContent) {
      alert('Receipt content not found');
      printWindow.close();
      return;
    }
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Case Filing Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; }
            .lit-case-filing-receipt {
              max-width: 800px; margin: 0 auto; padding: 40px 50px; background-color: #fff;
              color: #222; border: 1px solid #999; position: relative; line-height: 1.5;
            }
            .lit-case-filing-receipt::before {
              content: ""; position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 2px double #8b0000; pointer-events: none;
            }
            .lit-receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b0000; padding-bottom: 20px; }
            .lit-receipt-logo { display: flex; justify-content: center; align-items: center; margin-bottom: 15px; }
            .lit-govt-emblem { width: 80px; height: 80px; margin-right: 20px; }
            .lit-govt-emblem img { width: 100%; height: 100%; object-fit: contain; }
            .lit-receipt-title h2 { font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; color: #8b0000; }
            .lit-receipt-title h3 { font-size: 20px; margin: 5px 0; font-weight: bold; }
            .lit-receipt-title p { font-size: 16px; margin: 5px 0; }
            .lit-receipt-heading { font-size: 22px; font-weight: bold; margin: 20px 0 15px; text-align: center; text-transform: uppercase; }
            .lit-receipt-heading::after { content: ""; display: block; width: 200px; height: 2px; background-color: #8b0000; margin: 10px auto; }
            .lit-receipt-number { display: flex; justify-content: space-between; margin: 20px 0; font-size: 15px; }
            .lit-receipt-content { font-size: 15px; }
            .lit-case-filing-details { display: flex; justify-content: space-between; margin-bottom: 20px; background-color: #f0f0f0; padding: 10px 15px; border-left: 4px solid #8b0000; }
            .lit-party-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .lit-applicant-details, .lit-respondent-details { width: 48%; padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd; }
            .lit-applicant-details h3, .lit-respondent-details h3 { font-size: 16px; margin: 0 0 10px; color: #8b0000; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .lit-receipt-body { margin: 20px 0; text-align: justify; line-height: 1.6; }
            .lit-receipt-notes { margin-top: 30px; }
            .lit-receipt-notes h3 { font-size: 16px; margin-bottom: 10px; color: #8b0000; }
            .lit-receipt-notes ol { margin-left: 20px; margin-bottom: 30px; }
            .lit-receipt-notes ol li { margin-bottom: 8px; }
            .lit-receipt-footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
            .lit-court-seal { width: 120px; height: 120px; }
            .lit-court-seal img { width: 100%; height: 100%; object-fit: contain; opacity: 0.8; }
            .lit-signatory-section { width: 200px; text-align: center; }
            .lit-signature-line { border-bottom: 1px solid #000; margin-bottom: 10px; height: 40px; }
            .lit-signatory { font-weight: bold; margin: 0; }
            @media print { body { padding: 0; } .lit-case-filing-receipt { border: none; box-shadow: none; } @page { size: A4; margin: 1cm; } }
          </style>
        </head>
        <body>
          ${receiptContent.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
  };

  // Header Component
  const DashboardHeader = () => (
    <header className="litigantdash-main-header-container">
      <div className="litigantdash-header-left-section">
        <button className="litigantdash-sidebar-hamburger-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="litigantdash-emblem-container">
          <img src={emblem} alt="Emblem" />
        </div>
        <div className="litigantdash-justice-logo-container">
          <img src={logo} alt="Logo" />
        </div>
        <h1 className="litigantdash-page-title-text">Litigant Dashboard</h1>
      </div>
      <div className="litigantdash-header-right-section">
        <div className="litigantdash-logout-buttons-group">
          <button className="litigantdash-single-logout-button" onClick={handleLogout}>
            <LogOut className="litigantdash-logout-icon-svg" />
            Logout
          </button>
          <button className="litigantdash-all-devices-logout-button"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className="litigantdash-logout-icon-svg" />
            Logout All Devices
          </button>
        </div>
        <div
          className="litigantdash-profile-avatar-trigger"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="litigantdash-user-avatar-circle">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );

  const renderDashboard = () => (
    <div className="litigantdash-dashboard-main-section">
      {advocateChangeRequests.length > 0 && (
        <section className="litigantdash-cases-list-section" style={{ marginBottom: '32px' }}>
          <h2>Advocate Change Status</h2>
          <div className="litigantdash-cases-grid-container">
            {advocateChangeRequests.map((req) => (
              <div key={req.request_id || req.case_id} className="litigantdash-case-card-box" style={{ borderLeft: `4px solid ${req.status === 'Approved' ? '#22c55e' : req.status === 'Rejected' ? '#ef4444' : req.noc_request_status === 'Signed' ? '#22c55e' : req.noc_request_status === 'Declined' ? '#ef4444' : '#fbbf24'}` }}>
                <div className="litigantdash-case-card-header">
                  <h3>Case: {req.case_id || 'Loading...'}</h3>
                  <span className={`litigantdash-status-badge ${(req.status || '').replace(/\s+/g, '-').toLowerCase()}`}>
                    {req.status || req.noc_request_status}
                  </span>
                </div>
                <div className="litigantdash-case-card-details">
                  <p><strong>Current Lawyer:</strong> {req.existing_advocate_id}</p>
                  <p><strong>Request Date:</strong> {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</p>
                  {req.noc_request_status === 'Signed' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button
                        className="litigantdash-view-details-button"
                        style={{
                          background: (req.status === 'Under Court Review' || req.status === 'Approved' || req.status === 'Rejected') ? '#64748b' : '#0f172a',
                          color: 'white',
                          cursor: (req.status === 'Under Court Review' || req.status === 'Approved' || req.status === 'Rejected') ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleFinalSubmitToCourt(req.request_id)}
                        disabled={req.status === 'Under Court Review' || req.status === 'Approved' || req.status === 'Rejected'}
                      >
                        {req.status === 'Approved' ? '✅ Approved by Court' : req.status === 'Under Court Review' ? '📤 Submitted to Court' : req.status === 'Rejected' ? '❌ Rejected' : '📤 Submit to Court'}
                      </button>
                    </div>
                  )}
                  {req.status === 'Approved' && (
                    <p style={{ color: '#166534', fontSize: '12px', marginTop: '8px', background: '#dcfce7', padding: '8px', borderRadius: '4px' }}>
                      🎉 Approved! Your previous advocate has been discharged. You can now attach a new advocate.
                    </p>
                  )}
                  {req.status === 'Rejected' && (
                    <p style={{ color: '#991b1b', fontSize: '12px', marginTop: '8px', background: '#fee2e2', padding: '8px', borderRadius: '4px' }}>
                      ❌ Rejected by court. {req.review_remarks && `Remarks: ${req.review_remarks}`}
                    </p>
                  )}
                  {req.noc_request_status === 'Declined' && req.status !== 'Approved' && req.status !== 'Rejected' && (
                    <p style={{ color: '#991b1b', fontSize: '12px', marginTop: '8px' }}>
                      ⚠ Lawyer declined NOC. Reason: {req.noc_decline_reason}
                    </p>
                  )}
                  {req.noc_request_status === 'Requested' && req.status !== 'Approved' && req.status !== 'Rejected' && (
                    <p style={{ color: '#92400e', fontSize: '12px', marginTop: '8px' }}>
                      ⏳ Request sent to lawyer. Waiting for digital signature.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="litigantdash-cases-list-section">
        <h2>Your Cases</h2>
        {loading ? (
          <div className="litigantdash-loading-spinner">Loading cases...</div>
        ) : error ? (
          <div className="litigantdash-error-alert-message">{error}</div>
        ) : cases.length === 0 ? (
          <div className="litigantdash-no-cases-message">No cases found. File a new case to get started.</div>
        ) : (
          <div className="litigantdash-cases-grid-container">
            {cases.map((legalCase) => (
              <div key={legalCase.case_num} className="litigantdash-case-card-box">
                <div className="litigantdash-case-card-header">
                  <h3>{legalCase.case_num}</h3>
                  <span className={`litigantdash-status-badge ${legalCase.status}`}>{legalCase.status}</span>
                </div>
                <div className="litigantdash-case-card-details">
                  <p><strong>Type:</strong> {legalCase.case_type}</p>
                  <p><strong>Court:</strong> {legalCase.court}</p>
                  <p><strong>Filed:</strong> {legalCase.created_at ? new Date(legalCase.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="litigantdash-case-card-actions">
                  <button
                    className="litigantdash-view-details-button"
                    onClick={() => {
                      setSelectedCase(legalCase);
                      setIsDetailsOpen(true);
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className="litigantdash-view-details-button"
                    style={{ marginLeft: '10px', background: '#dc3545', color: 'white', borderColor: '#dc3545' }}
                    onClick={() => {
                      setSelectedCaseForAdvocateChange(legalCase);
                      setIsChangeAdvocateOpen(true);
                    }}
                  >
                    Change Advocate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {isDetailsOpen && selectedCase && (
          <div
            className="litigantdash-case-details-overlay-backdrop"
            onClick={(e) => {
              if (e.target.className === 'litigantdash-case-details-overlay-backdrop') {
                setIsDetailsOpen(false);
              }
            }}
          >
            <div className="litigantdash-case-details-modal-wrapper">
              <div className="litigantdash-modal-header-bar">
                <div className="litigantdash-header-left-info">
                  <h2>Case: {selectedCase.case_num}</h2>
                </div>
                <div className="litigantdash-details-view-tabs">
                  <button
                    className={viewMode === 'details' ? 'litigantdash-active-tab-button' : ''}
                    onClick={() => setViewMode('details')}
                  >
                    Case Details
                  </button>
                  <button
                    className={viewMode === 'receipt' ? 'litigantdash-active-tab-button' : ''}
                    onClick={() => setViewMode('receipt')}
                  >
                    Case Filing Receipt
                  </button>
                </div>
                <div className="litigantdash-header-right-actions">
                  <button className="litigantdash-print-receipt-button" onClick={printReceipt}>
                    Print Receipt
                  </button>
                  <button className="litigantdash-close-modal-button" onClick={() => setIsDetailsOpen(false)}>
                    ×
                  </button>
                </div>
              </div>
              <div className="litigantdash-modal-content-scrollable-area">
                <div
                  className="litigantdash-modal-content-panel"
                  style={{ display: viewMode === 'details' ? 'block' : 'none' }}
                >
                  <div className="litigantdash-case-details-content-wrapper">
                    <div className="litigantdash-case-status-info-banner">
                      <div className="litigantdash-status-info-wrapper">
                        <span className={`litigantdash-status-label ${selectedCase.status?.toLowerCase()}`}>
                          {selectedCase.status || 'Pending'}
                        </span>
                        <span className="litigantdash-filing-date-label">
                          Filed: {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="litigantdash-case-details-grid-layout">
                      <div className="litigantdash-detail-group-section">
                        <h3>Basic Information</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Case Type:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.case_type}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Court:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.court}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Filed Date:</span>
                          <span className="litigantdash-detail-value-text">
                            {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="litigantdash-detail-group-section">
                        <h3>Plaintiff Details</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Name:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.plaintiff_details?.name}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Contact:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.plaintiff_details?.mobile}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Address:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.plaintiff_details?.address}</span>
                        </div>
                      </div>
                      <div className="litigantdash-detail-group-section">
                        <h3>Respondent Details</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Name:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.respondent_details?.name}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Contact:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.respondent_details?.mobile}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Address:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.respondent_details?.address}</span>
                        </div>
                      </div>
                      {selectedCase.police_station_details && (
                        <div className="litigantdash-detail-group-section">
                          <h3>Police Station Details</h3>
                          <div className="litigantdash-detail-item-row">
                            <span className="litigantdash-detail-label-text">Station:</span>
                            <span className="litigantdash-detail-value-text">{selectedCase.police_station_details.police_station}</span>
                          </div>
                          <div className="litigantdash-detail-item-row">
                            <span className="litigantdash-detail-label-text">FIR Number:</span>
                            <span className="litigantdash-detail-value-text">{selectedCase.police_station_details.fir_no}</span>
                          </div>
                          <div className="litigantdash-detail-item-row">
                            <span className="litigantdash-detail-label-text">FIR Year:</span>
                            <span className="litigantdash-detail-value-text">{selectedCase.police_station_details.fir_year}</span>
                          </div>
                        </div>
                      )}
                      <div className="litigantdash-detail-group-section">
                        <h3>Lower Court Details</h3>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Court Name:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.lower_court_details?.court_name}</span>
                        </div>
                        <div className="litigantdash-detail-item-row">
                          <span className="litigantdash-detail-label-text">Case Number:</span>
                          <span className="litigantdash-detail-value-text">{selectedCase.case_num}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="litigantdash-modal-content-panel"
                  style={{ display: viewMode === 'receipt' ? 'block' : 'none' }}
                >
                  <div className="lit-case-filing-receipt">
                    <div className="lit-receipt-header">
                      <div className="lit-receipt-logo">
                        <div className="lit-govt-emblem">
                          <img src={emblem} alt="Emblem" />
                        </div>
                        <div className="lit-receipt-title">
                          <h2>Judicial Courts of India</h2>
                          <h3>{selectedCase.court || 'District Court'}</h3>
                          <p>{selectedCase.for_office_use_only?.court_allotted || 'Not allotted yet'}</p>
                        </div>
                      </div>
                      <h2 className="lit-receipt-heading">Case Filing Receipt</h2>
                      <div className="lit-receipt-number">
                        <p><strong>CBR Number:</strong> {selectedCase.cbr_number || selectedCase.case_num}</p>
                        <p><strong>Filing Date:</strong> {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="lit-receipt-content">
                      <div className="lit-case-filing-details">
                        <p><strong>Case Type:</strong> {selectedCase.case_type || 'CIVIL CASE'}</p>
                        <p><strong>Court:</strong> {selectedCase.court}</p>
                      </div>
                      <div className="lit-party-details">
                        <div className="lit-applicant-details">
                          <h3>Plaintiff Details:</h3>
                          <p>{selectedCase.plaintiff_details?.name}</p>
                          <p>{selectedCase.plaintiff_details?.address}</p>
                          <p>Contact: {selectedCase.plaintiff_details?.mobile}</p>
                        </div>
                        <div className="lit-respondent-details">
                          <h3>Respondent Details:</h3>
                          <p>{selectedCase.respondent_details?.name}</p>
                          <p>{selectedCase.respondent_details?.address}</p>
                          <p>Contact: {selectedCase.respondent_details?.mobile}</p>
                        </div>
                      </div>
                      <div className="lit-receipt-body">
                        <p>
                          This is to acknowledge receipt of case filing documents for case number {selectedCase.case_num}
                          dated {selectedCase.createdAt && new Date(selectedCase.createdAt).toLocaleDateString()}
                          filed by {selectedCase.plaintiff_details?.name} against {selectedCase.respondent_details?.name}
                          related to {selectedCase.case_subject || selectedCase.case_type}
                          along with the applicable filing fee of ₹{selectedCase.filing_fee || '1,000'}.
                        </p>
                      </div>
                      <div className="lit-receipt-notes">
                        <h3>Important Information:</h3>
                        <ol>
                          <li>Please quote the case number in all future correspondence.</li>
                          <li>The first hearing date will be communicated separately through official channels.</li>
                          <li>Any changes to contact information must be promptly communicated to the court.</li>
                          <li>All subsequent filings related to this case must reference this case number.</li>
                        </ol>
                        <div className="lit-receipt-footer">
                          <div className="lit-court-seal">
                            <img src={stamp} alt="Court Seal" />
                          </div>
                          <div className="lit-signatory-section">
                            <div className="lit-signature-line"></div>
                            <p className="lit-signatory">Court Registrar</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
  const renderFileCase = () => (
    <div className="litigantdash-file-case-main-section">
      <h2>File New Case</h2>
      <form onSubmit={handleFormSubmit} className="litigantdash-case-filing-form-container">
        <div className="litigantdash-form-section-block">
          <h3>Basic Case Information</h3>
          <div className="litigantdash-form-row-container">
            <div className="litigantdash-form-group-item">
              <label>Court</label>
              <select
                value={formData.court}
                onChange={(e) => handleTopLevelChange('court', e.target.value)}
                required
              >
                <option value="District & Sessions Court">District & Sessions Court</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="litigantdash-form-group-item">
              <label>Case Type</label>
              <select
                value={formData.case_type}
                onChange={(e) => handleTopLevelChange('case_type', e.target.value)}
                required
              >
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="CIV SUITS">CIV SUITS</option>
                <option value="EXE PET">EXE PET</option>
                <option value="MISC. CIV APPLN">MISC. CIV APPLN</option>
                <option value="MRG PET">MRG PET</option>
                <option value="MACP">MACP</option>
                <option value="MISC CIV CASES">MISC CIV CASES</option>
                <option value="CIVIL APPEAL">CIVIL APPEAL</option>
                <option value="ARBITN">ARBITN</option>
                <option value="MISC. CIV APPEAL">MISC. CIV APPEAL</option>
                <option value="LAND REFRNC">LAND REFRNC</option>
                <option value="MAGISTRIAL CASES">MAGISTRIAL CASES</option>
                <option value="MISC. EXE.">MISC. EXE.</option>
                <option value="LABUR MAIN">LABUR MAIN</option>
                <option value="COMMERCIAL SUIT">COMMERCIAL SUIT</option>
                <option value="MISC. CRIM APLN">MISC. CRIM APLN</option>
                <option value="INDUS MAIN">INDUS MAIN</option>
                <option value="CIVIL REV.">CIVIL REV.</option>
                <option value="OTHER TRIBNL">OTHER TRIBNL</option>
                <option value="INDUS MISC">INDUS MISC</option>
                <option value="LABUR MISC">LABUR MISC</option>
                <option value="ELCTN PET">ELCTN PET</option>
                <option value="CO-OP MAIN">CO-OP MAIN</option>
                <option value="COMMERCIAL APPEAL">COMMERCIAL APPEAL</option>
                <option value="CO-OP APEAL MAIN">CO-OP APEAL MAIN</option>
                <option value="CO-OP MISC.">CO-OP MISC.</option>
                <option value="SESSIONS CASES">SESSIONS CASES</option>
                <option value="CRIM APPEAL">CRIM APPEAL</option>
              </select>
            </div>
          </div>
        </div>
        <div className="litigantdash-form-section-block">
          <h3>Plaintiff Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Name</label>
              <input
                type="text"
                value={formData.plaintiff_details.name}
                onChange={(e) => handleNestedChange('plaintiff_details', 'name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Father/Mother/Husband</label>
              <input
                type="text"
                value={formData.plaintiff_details.father_mother_husband}
                onChange={(e) =>
                  handleNestedChange('plaintiff_details', 'father_mother_husband', e.target.value.replace(/[^a-zA-Z\s]/g, ''))
                }
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Address</label>
              <input
                type="text"
                value={formData.plaintiff_details.address}
                onChange={(e) => handleNestedChange('plaintiff_details', 'address', e.target.value)}
                minLength={5}
                placeholder="Enter full address"
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.plaintiff_details.pin}
                onChange={(e) => handleNestedChange('plaintiff_details', 'pin', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Sex</label>
              <select
                value={formData.plaintiff_details.sex}
                onChange={(e) => handleNestedChange('plaintiff_details', 'sex', e.target.value)}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="litigantdash-form-group-item">
              <label>Age</label>
              <input
                type="text"
                value={formData.plaintiff_details.age}
                onChange={(e) => handleNestedChange('plaintiff_details', 'age', e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                placeholder="1-120"
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Caste</label>
              <input
                type="text"
                value={formData.plaintiff_details.caste}
                onChange={(e) => handleNestedChange('plaintiff_details', 'caste', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Nationality</label>
              <select
                value={formData.plaintiff_details.nationality}
                onChange={(e) => handleNestedChange('plaintiff_details', 'nationality', e.target.value)}
                required
              >
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.plaintiff_details.nationality === 'Other' && (
              <div className="litigantdash-form-group-item">
                <label>Specify Nationality</label>
                <input
                  type="text"
                  value={formData.plaintiff_details.if_other_mention}
                  onChange={(e) =>
                    handleNestedChange('plaintiff_details', 'if_other_mention', e.target.value.replace(/[^a-zA-Z\s]/g, ''))
                  }
                  placeholder="Enter nationality"
                  required
                />
              </div>
            )}
            <div className="litigantdash-form-group-item">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.plaintiff_details.occupation}
                onChange={(e) => handleNestedChange('plaintiff_details', 'occupation', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Email</label>
              <input
                type="email"
                value={formData.plaintiff_details.email}
                onChange={(e) => handleNestedChange('plaintiff_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Phone</label>
              <input
                type="text"
                value={formData.plaintiff_details.phone}
                onChange={(e) => handleNestedChange('plaintiff_details', 'phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.plaintiff_details.mobile}
                onChange={(e) => handleNestedChange('plaintiff_details', 'mobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Fax</label>
              <input
                type="text"
                value={formData.plaintiff_details.fax}
                onChange={(e) => handleNestedChange('plaintiff_details', 'fax', e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Subject</label>
              <input
                type="text"
                value={formData.plaintiff_details.subject}
                onChange={(e) => handleNestedChange('plaintiff_details', 'subject', e.target.value)}
                minLength={3}
                placeholder="Enter case subject"
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate ID (Optional)</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate_id}
                onChange={(e) => handleNestedChange('plaintiff_details', 'advocate_id', e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="Leave blank if Party-in-Person"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate Name (Optional)</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate}
                onChange={(e) => handleNestedChange('plaintiff_details', 'advocate', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                placeholder="Leave blank if Party-in-Person"
              />
            </div>
          </div>
        </div>
        <div className="litigantdash-form-section-block">
          <h3>Respondent Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Party ID (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.party_id}
                onChange={(e) => handleNestedChange('respondent_details', 'party_id', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Name</label>
              <input
                type="text"
                value={formData.respondent_details.name}
                onChange={(e) => handleNestedChange('respondent_details', 'name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Father/Mother/Husband (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.father_mother_husband}
                onChange={(e) =>
                  handleNestedChange('respondent_details', 'father_mother_husband', e.target.value.replace(/[^a-zA-Z\s]/g, ''))
                }
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Address</label>
              <input
                type="text"
                value={formData.respondent_details.address}
                onChange={(e) => handleNestedChange('respondent_details', 'address', e.target.value)}
                minLength={5}
                placeholder="Enter full address"
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>PIN Code (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.pin}
                onChange={(e) => handleNestedChange('respondent_details', 'pin', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Sex (Optional)</label>
              <select
                value={formData.respondent_details.sex}
                onChange={(e) => handleNestedChange('respondent_details', 'sex', e.target.value)}
              >
                <option value="">Select (Optional)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="litigantdash-form-group-item">
              <label>Age (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.age}
                onChange={(e) => handleNestedChange('respondent_details', 'age', e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Caste (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.caste}
                onChange={(e) => handleNestedChange('respondent_details', 'caste', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Nationality</label>
              <select
                value={formData.respondent_details.nationality}
                onChange={(e) => handleNestedChange('respondent_details', 'nationality', e.target.value)}
                required
              >
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.respondent_details.nationality === 'Other' && (
              <div className="litigantdash-form-group-item">
                <label>Specify Nationality</label>
                <input
                  type="text"
                  value={formData.respondent_details.if_other_mention}
                  onChange={(e) =>
                    handleNestedChange('respondent_details', 'if_other_mention', e.target.value.replace(/[^a-zA-Z\s]/g, ''))
                  }
                  placeholder="Enter nationality"
                  required
                />
              </div>
            )}
            <div className="litigantdash-form-group-item">
              <label>Occupation (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.occupation}
                onChange={(e) => handleNestedChange('respondent_details', 'occupation', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Email (Optional)</label>
              <input
                type="email"
                value={formData.respondent_details.email}
                onChange={(e) => handleNestedChange('respondent_details', 'email', e.target.value)}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Phone (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.phone}
                onChange={(e) => handleNestedChange('respondent_details', 'phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Mobile (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.mobile}
                onChange={(e) => handleNestedChange('respondent_details', 'mobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Fax</label>
              <input
                type="text"
                value={formData.respondent_details.fax}
                onChange={(e) => handleNestedChange('respondent_details', 'fax', e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Subject</label>
              <input
                type="text"
                value={formData.respondent_details.subject}
                onChange={(e) => handleNestedChange('respondent_details', 'subject', e.target.value)}
                minLength={3}
                placeholder="Enter case subject"
                required
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate ID (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.advocate_id}
                onChange={(e) => handleNestedChange('respondent_details', 'advocate_id', e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Advocate Name (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.advocate}
                onChange={(e) => handleNestedChange('respondent_details', 'advocate', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                placeholder="Leave blank if unknown"
              />
            </div>
          </div>
        </div>
        {['Criminal', 'MAGISTRIAL CASES', 'MISC. CRIM APLN', 'SESSIONS CASES', 'CRIM APPEAL'].includes(formData.case_type) && (
          <div className="litigantdash-form-section-block">
            <h3>Police Station Details</h3>
            <div className="litigantdash-form-grid-layout">
              <div className="litigantdash-form-group-item">
                <label>Police Station</label>
                <input
                  type="text"
                  value={formData.police_station_details.police_station}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'police_station', e.target.value)
                  }
                  minLength={3}
                  placeholder="Enter police station name"
                  required
                />
              </div>
              <div className="litigantdash-form-group-item">
                <label>FIR Number</label>
                <input
                  type="text"
                  value={formData.police_station_details.fir_no}
                  onChange={(e) => handleNestedChange('police_station_details', 'fir_no', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter FIR number"
                  required
                />
              </div>
              <div className="litigantdash-form-group-item">
                <label>FIR Year</label>
                <input
                  type="text"
                  value={formData.police_station_details.fir_year}
                  onChange={(e) => handleNestedChange('police_station_details', 'fir_year', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="e.g. 2026"
                  required
                />
              </div>
              <div className="litigantdash-form-group-item">
                <label>Date of Offence</label>
                <input
                  type="date"
                  value={formData.police_station_details.date_of_offence}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'date_of_offence', e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        )}
        <div className="litigantdash-form-section-block">
          <h3>Lower Court Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Court Name (Optional)</label>
              <input
                type="text"
                value={formData.lower_court_details.court_name}
                onChange={(e) => handleNestedChange('lower_court_details', 'court_name', e.target.value)}
                minLength={3}
                placeholder="Leave blank if original suit"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Case Number (Optional)</label>
              <input
                type="text"
                value={formData.lower_court_details.case_no}
                onChange={(e) => handleNestedChange('lower_court_details', 'case_no', e.target.value.replace(/[^a-zA-Z0-9/\-]/g, ''))}
                placeholder="Leave blank if original suit"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Decision Date (Optional)</label>
              <input
                type="date"
                value={formData.lower_court_details.decision_date}
                onChange={(e) => handleNestedChange('lower_court_details', 'decision_date', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="litigantdash-form-section-block">
          <h3>Main Matter Details</h3>
          <div className="litigantdash-form-grid-layout">
            <div className="litigantdash-form-group-item">
              <label>Case Type (Optional)</label>
              <input
                type="text"
                value={formData.main_matter_details.case_type}
                onChange={(e) => handleNestedChange('main_matter_details', 'case_type', e.target.value.replace(/[^a-zA-Z\s.]/g, ''))}
                placeholder="e.g. Civil Suit"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Case Number (Optional)</label>
              <input
                type="text"
                value={formData.main_matter_details.case_no}
                onChange={(e) => handleNestedChange('main_matter_details', 'case_no', e.target.value)}
                placeholder="Leave blank for new filing"
              />
            </div>
            <div className="litigantdash-form-group-item">
              <label>Year (Optional)</label>
              <input
                type="text"
                value={formData.main_matter_details.year}
                onChange={(e) => handleNestedChange('main_matter_details', 'year', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="Leave blank for new filing"
              />
            </div>
          </div>
        </div>
        {formError && <div className="litigantdash-error-alert-message">{formError}</div>}
        {formSuccess && <div className="litigantdash-success-alert-message">{formSuccess}</div>}
        <div className="litigantdash-form-actions-buttons">
          <button type="submit" className="litigantdash-submit-form-button">
            File Case
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="litigantdash-cancel-form-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
  const renderHearings = () => (
    <div className="litigantdash-hearings-main-section">
      <h2>Search Case Hearings</h2>
      <form onSubmit={handleHearingSearch} className="litigantdash-hearing-search-form-container">
        <div className="litigantdash-form-group-item">
          <label htmlFor="caseNumberInput">Case Number</label>
          <input
            type="text"
            id="caseNumberInput"
            value={searchCaseNum}
            onChange={(e) => setSearchCaseNum(e.target.value)}
            placeholder="Enter Case Number"
            required
          />
        </div>
        <button type="submit" className="litigantdash-search-hearings-button">
          Search Hearings
        </button>
      </form>
      {hearingsError && <div className="litigantdash-error-alert-message">{hearingsError}</div>}
      {hearingsLoading ? (
        <div className="litigantdash-loading-spinner">Loading hearings...</div>
      ) : (
        searchedHearings && (
          <div className="litigantdash-hearings-list-container">
            {searchedHearings.length === 0 ? (
              <div className="litigantdash-no-hearings-message">No hearings found for this case number.</div>
            ) : (
              searchedHearings.map((hearing, index) => (
                <div key={index} className="litigantdash-hearing-card-box">
                  <div className="litigantdash-hearing-card-header">
                    <h3>Hearing #{index + 1}</h3>
                    <span className={`litigantdash-status-badge ${hearing.hearing_type?.toLowerCase()}`}>
                      {hearing.hearing_type}
                    </span>
                  </div>

                  <div className="litigantdash-hearing-card-details">
                    <div className="litigantdash-detail-row-item">
                      <span className="litigantdash-detail-label-text">Hearing Date:</span>
                      <span className="litigantdash-detail-value-text">
                        {hearing.hearing_date
                          ? new Date(hearing.hearing_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                          : 'Not specified'}
                      </span>
                    </div>

                    <div className="litigantdash-detail-row-item">
                      <span className="litigantdash-detail-label-text">Hearing Type:</span>
                      <span className="litigantdash-detail-value-text">
                        {hearing.hearing_type || 'Not specified'}
                      </span>
                    </div>

                    {hearing.next_hearing_date && (
                      <div className="litigantdash-detail-row-item">
                        <span className="litigantdash-detail-label-text">Next Hearing Date:</span>
                        <span className="litigantdash-detail-value-text">
                          {new Date(hearing.next_hearing_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    <div className="litigantdash-case-card-actions" style={{ marginTop: '16px' }}>
                      <button
                        className="litigantdash-view-details-button"
                        onClick={() => {
                          setSelectedHearing(hearing);
                          setIsHearingDetailsOpen(true);
                        }}
                      >
                        Check Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}

      {isHearingDetailsOpen && selectedHearing && (
        <div
          className="litigantdash-case-details-overlay-backdrop"
          onClick={(e) => {
            if (e.target.className === 'litigantdash-case-details-overlay-backdrop') {
              setIsHearingDetailsOpen(false);
            }
          }}
        >
          <div className="litigantdash-case-details-modal-wrapper">
            <div className="litigantdash-modal-header-bar">
              <h2>Hearing Order Details</h2>
              <div className="litigantdash-header-right-actions">
                <button className="litigantdash-print-receipt-button" onClick={printHearingOrder}>
                  Print Order
                </button>
                <button className="litigantdash-close-modal-button" onClick={() => setIsHearingDetailsOpen(false)}>
                  ×
                </button>
              </div>
            </div>
            <div className="litigantdash-modal-content-scrollable-area">
              <div className="litigantdash-modal-content-panel">
                <div className="hearing-order-sheet">
                  <div className="order-header">
                    <p style={{ fontSize: '11px', marginBottom: '5px' }}>Schedule VII, Form No.127</p>
                    <p style={{ fontSize: '11px', marginBottom: '15px' }}>High Court Criminal Form No (H) 106</p>
                    <h1>ORDER SHEET</h1>
                  </div>
                  {(() => {
                    // Fetch the actual case data for this case number
                    const currentCase = cases.find(c => c.case_num === searchCaseNum) || {};
                    const officeDetails = currentCase.for_office_use_only || {};
                    const plaintiffName = currentCase.plaintiff_details?.name || 'Petitioner';
                    const respondentName = currentCase.respondent_details?.name || 'Respondent';
                    const plaintiffAdvocate = currentCase.plaintiff_details?.advocate || '';
                    const respondentAdvocate = currentCase.respondent_details?.advocate || '';
                    const district = currentCase.district || '';
                    const court = currentCase.court || '';

                    return (
                      <>
                        <div className="order-header">
                          <h2 style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                            OFFICE OF THE DISTRICT & SESSIONS JUDGE, {district.toUpperCase()}
                          </h2>
                          <p style={{ fontSize: '14px', textAlign: 'right', marginBottom: '10px', fontWeight: 'bold' }}>
                            IN THE COURT OF: {officeDetails.court_allotted || court}
                          </p>
                          <h3 style={{ fontSize: '14px', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>
                            {plaintiffName} v. {respondentName}
                          </h3>
                          <p style={{ fontSize: '13px', textAlign: 'left', marginBottom: '5px' }}>
                            <strong>Case No.:</strong> {searchCaseNum}
                          </p>
                          <p style={{ fontSize: '13px', textAlign: 'left', marginBottom: '20px' }}>
                            <strong>Case Type:</strong> {currentCase.case_type || 'N/A'}
                          </p>
                          <h1 style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '20px' }}>
                            ORDER SHEET / PROCEEDINGS
                          </h1>
                        </div>

                        {(plaintiffAdvocate || respondentAdvocate) && (
                          <div style={{ fontSize: '12px', marginBottom: '15px', padding: '10px', background: '#f5f5f5' }}>
                            {plaintiffAdvocate && <p><strong>Present for Petitioner:</strong> {plaintiffAdvocate}</p>}
                            {respondentAdvocate && <p><strong>Present for Respondent:</strong> {respondentAdvocate}</p>}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', border: '1px solid #000' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '50px', fontWeight: 'bold' }}>S. No.</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '120px', fontWeight: 'bold' }}>Date of Order</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>ORDER / PROCEEDINGS</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '150px', fontWeight: 'bold' }}>Signature of Court</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '120px', fontWeight: 'bold' }}>Office Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchedHearings && searchedHearings.map((hearing, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center' }}>
                            {idx + 1}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center' }}>
                            {hearing.hearing_date
                              ? new Date(hearing.hearing_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                              : ''}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                            <div
                              className="order-content"
                              dangerouslySetInnerHTML={{ __html: hearing.remarks || hearing.remarks_plain_text || 'No order recorded' }}
                            />
                            {hearing.next_hearing_date && (
                              <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
                                Next Hearing: {new Date(hearing.next_hearing_date).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center' }}>
                            {hearing.digital_signature && hearing.digital_signature.is_signed ? (
                              <div style={{ fontSize: '11px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                  {hearing.digital_signature.signed_by_name}
                                </div>
                                <div style={{ fontSize: '9px', fontStyle: 'italic' }}>
                                  Digitally signed
                                </div>
                                <div style={{ fontSize: '8px', marginTop: '3px' }}>
                                  {hearing.digital_signature.signature_timestamp
                                    ? new Date(hearing.digital_signature.signature_timestamp).toLocaleDateString('en-GB')
                                    : ''}
                                </div>
                              </div>
                            ) : (
                              <div style={{ height: '60px' }}></div>
                            )}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top', fontSize: '11px' }}>
                            {/* Office action space */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '40px', textAlign: 'right', paddingRight: '50px' }}>
                    <p style={{ fontSize: '13px', marginBottom: '60px' }}>
                      <strong>By Order of Court</strong>
                    </p>
                    <div style={{ borderTop: '1px solid #000', width: '250px', marginLeft: 'auto', paddingTop: '5px' }}>
                      <p style={{ fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {selectedHearing?.digital_signature?.signed_by_name || 'Presiding Judge'}
                      </p>
                      <p style={{ fontSize: '11px', textAlign: 'center' }}>
                        {(() => {
                          const currentCase = cases.find(c => c.case_num === searchCaseNum) || {};
                          return currentCase.for_office_use_only?.court_allotted || currentCase.court || '';
                        })()}
                      </p>
                    </div>
                  </div>
                  {searchedHearings && searchedHearings.some(h => h.digital_signature?.is_signed) && (
                    <div className="digital-signature-box">
                      <h4>DIGITAL SIGNATURE VERIFICATION</h4>
                      {searchedHearings.filter(h => h.digital_signature?.is_signed).map((hearing, idx) => (
                        <div key={idx} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                          <p><strong>Order #{idx + 1}:</strong></p>
                          <p><strong>Digitally signed by:</strong> {hearing.digital_signature.signed_by_name}</p>
                          <p><strong>DN:</strong> cn={hearing.digital_signature.signed_by_name}, o=JUDICIAL, ou={hearing.digital_signature.signed_by_role?.toUpperCase()}, c=IN</p>
                          <p><strong>Date:</strong> {hearing.digital_signature.signature_timestamp
                            ? new Date(hearing.digital_signature.signature_timestamp).toLocaleString('en-GB', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }).replace(',', ' at')
                            : 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedHearing.attachments && selectedHearing.attachments.length > 0 && (
                    <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ddd', background: '#f9f9f9' }}>
                      <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Attachments</h4>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {selectedHearing.attachments.map((attachment, i) => (
                          <li key={i} style={{ marginBottom: '8px', fontSize: '12px' }}>
                            <button
                              onClick={() => downloadAttachment(attachment.filename, attachment.originalname)}
                              style={{
                                background: '#0f172a',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              Download: {attachment.originalname} ({(attachment.size / 1024).toFixed(2)} KB)
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ width: '200px', height: '100px', border: '1px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999' }}>
                      Court Seal
                    </div>
                    <div style={{ fontSize: '11px', textAlign: 'right' }}>
                      <p><strong>Office/Registry Note:</strong></p>
                      <p style={{ marginTop: '5px' }}>Copy to Registry for filing</p>
                      <p style={{ marginTop: '30px' }}>__________________</p>
                      <p>Office Stamp & Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  // Replace your entire renderDocuments function with this updated version
  const renderDocuments = () => (
    <div className="litigantdash-documents-main-section">
      <h2>Case Documents</h2>

      {/* Document Requests Section */}
      <div className="litigantdash-document-requests-section">
        <h3>Pending Document Requests from Court</h3>
        {requestsLoading ? (
          <div className="litigantdash-loading-spinner">Loading requests...</div>
        ) : documentRequests.length === 0 ? (
          <div className="litigantdash-no-requests-message">
            No pending document requests from the court.
          </div>
        ) : (
          <div className="litigantdash-requests-grid">
            {documentRequests.map((request) => (
              <div
                key={request.document_id}
                className={`litigantdash-request-card ${request.verification_status === 'rejected' ? 'rejected' :
                    request.verification_status === 'verified' ? 'verified' :
                      request.verification_status === 'uploaded_pending_review' ? 'pending-review' :
                        'pending-upload'
                  }`}
              >
                <div className="litigantdash-request-card-header">
                  <h4>{request.document_type}</h4>
                  <span className={`litigantdash-request-status-badge ${request.verification_status}`}>
                    {request.verification_status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="litigantdash-request-card-body">
                  <div className="litigantdash-request-detail-row">
                    <span className="litigantdash-label">Case Number:</span>
                    <span className="litigantdash-value">{request.case_num}</span>
                  </div>
                  <div className="litigantdash-request-detail-row">
                    <span className="litigantdash-label">Case Type:</span>
                    <span className="litigantdash-value">{request.case_type}</span>
                  </div>
                  {request.description && (
                    <div className="litigantdash-request-detail-row">
                      <span className="litigantdash-label">Description:</span>
                      <span className="litigantdash-value">{request.description}</span>
                    </div>
                  )}
                  <div className="litigantdash-request-detail-row">
                    <span className="litigantdash-label">Requested On:</span>
                    <span className="litigantdash-value">
                      {new Date(request.request_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="litigantdash-request-detail-row">
                    <span className="litigantdash-label">Deadline:</span>
                    <span className="litigantdash-value litigantdash-deadline">
                      {new Date(request.submission_deadline).toLocaleDateString()}
                    </span>
                  </div>

                  {request.verification_status === 'rejected' && request.rejection_reason && (
                    <div className="litigantdash-rejection-notice">
                      <strong>Rejection Reason:</strong> {request.rejection_reason}
                    </div>
                  )}

                  {request.verification_status === 'verified' && (
                    <div className="litigantdash-verified-notice">
                      ✓ Document verified and signed by court on{' '}
                      {new Date(request.verification_date).toLocaleDateString()}
                    </div>
                  )}

                  {(request.verification_status === 'pending_upload' ||
                    request.verification_status === 'rejected') && (
                      <div className="litigantdash-upload-action-section">
                        {selectedDocumentRequest?.document_id === request.document_id ? (
                          <form
                            onSubmit={(e) => handleRequestedDocumentUpload(e, request.document_id, request.case_num)}
                            className="litigantdash-inline-upload-form"
                          >
                            <input
                              type="file"
                              id="requested-doc-file-input"
                              onChange={handleFileChange}
                              required
                              className="litigantdash-file-input-field"
                            />
                            <div className="litigantdash-upload-buttons-group">
                              <button
                                type="submit"
                                className="litigantdash-upload-submit-button"
                                disabled={uploadingRequestedDoc}
                              >
                                {uploadingRequestedDoc ? 'Uploading...' : 'Upload'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocumentRequest(null);
                                  setDocumentFile(null);
                                }}
                                className="litigantdash-upload-cancel-button"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setSelectedDocumentRequest(request)}
                            className="litigantdash-upload-trigger-button"
                          >
                            {request.verification_status === 'rejected' ? 'Re-upload Document' : 'Upload Document'}
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEPARATOR */}
      <hr style={{ margin: '40px 0', border: 'none', borderTop: '2px solid #e5e7eb' }} />

      {/* EXISTING DOCUMENTS SECTION - CASE SELECTOR */}
      <h3 style={{ marginBottom: '20px' }}>Upload & View Case Documents</h3>
      <div className="litigantdash-case-selector-dropdown">
        <label htmlFor="case-selector">Select Case:</label>
        <select
          id="case-selector"
          onChange={(e) => {
            const caseNum = e.target.value;
            if (caseNum) {
              fetchDocuments(caseNum);
            } else {
              setSelectedCaseForDocuments(null);
              setDocuments([]);
            }
          }}
          value={selectedCaseForDocuments?.case_num || ''}
        >
          <option value="">-- Select a Case --</option>
          {cases.map((legalCase) => (
            <option key={legalCase.case_num} value={legalCase.case_num}>
              {legalCase.case_num} - {legalCase.case_type}
            </option>
          ))}
        </select>
      </div>



      {/* DOCUMENTS LIST - Only shows when a case is selected */}
      {selectedCaseForDocuments && (
        <div className="litigantdash-documents-list-container">
          <h4>Documents for Case: {selectedCaseForDocuments.case_num}</h4>
          {documentsLoading ? (
            <div className="litigantdash-loading-spinner">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="litigantdash-no-documents-message">
              No documents found for this case. Upload your first document above.
            </div>
          ) : (
            <table className="litigantdash-documents-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Uploaded By</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.document_id}>
                    <td>{doc.document_type}</td>
                    <td>{doc.file_name}</td>
                    <td>{doc.uploaded_by_name || doc.uploaded_by || 'User'}</td>
                    <td>{doc.upload_date || doc.uploaded_date ? new Date(doc.upload_date || doc.uploaded_date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`litigantdash-doc-status-badge ${doc.verification_status || 'pending'}`}>
                        {(doc.verification_status || 'Pending Review').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => downloadDocument(doc.document_id, doc.file_name)}
                        className="litigantdash-download-doc-button"
                      >
                        <FileDown className="litigantdash-btn-icon" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {documentError && <div className="litigantdash-error-alert-message">{documentError}</div>}
      {documentSuccess && <div className="litigantdash-success-alert-message">{documentSuccess}</div>}
    </div>
  );
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'filecase':
        return renderFileCase();
      case 'hearings':
        return renderHearings();
      case 'documents':
        return renderDocuments();
      case 'noticeboard':
        return <NoticeBoard />;
      case 'calendar':
        return <UserCalendar />;
      case 'videoplead':
        return <UploadVideoPlead />;
      case 'meetings':
        return <LitigantMeeting />;
      case 'caseassign':
        return <LitigantCaseAssign />;
      case 'nyaaysaathi':
        return <NyaaySaathi />;
      case 'courtschedule':
        return <LitigantLiveDashboard litigantId={profile?.litigant_id || profile?.party_id} />;
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };
  if (loading) {
    return (
      <div className="litigantdash-loading-container-fullscreen">
        <div className="litigantdash-loading-spinner">Loading...</div>
      </div>
    );
  }
  return (
    <div className="litigantdash-wrapper-main-container">
      <DashboardHeader />
      {isSidebarOpen && (
        <div
          className="litigantdash-sidebar-overlay-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="litigantdash-content-layout-container">
        <aside className={`litigantdash-sidebar-navigation ${isSidebarOpen ? 'litigantdash-sidebar-active' : ''}`}>
          <nav className="litigantdash-nav-menu-list">
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'dashboard' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <Database className="litigantdash-nav-icon-svg" />
              Dashboard
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'filecase' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('filecase')}
            >
              <FileText className="litigantdash-nav-icon-svg" />
              File New Case
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'hearings' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('hearings')}
            >
              <Calendar className="litigantdash-nav-icon-svg" />
              Hearings
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'documents' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('documents')}
            >
              <FileText className="litigantdash-nav-icon-svg" />
              Documents
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'noticeboard' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('noticeboard')}
            >
              <Info className="litigantdash-nav-icon-svg" />
              Notice Board
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'calendar' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('calendar')}
            >
              <Calendar className="litigantdash-nav-icon-svg" />
              Court Calendar
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'videoplead' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('videoplead')}
            >
              <Video className="litigantdash-nav-icon-svg" />
              Video Pleading
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'meetings' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('meetings')}
            >
              <Users className="litigantdash-nav-icon-svg" />
              Scheduled Meetings
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'caseassign' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('caseassign')}
            >
              <Book className="litigantdash-nav-icon-svg" />
              Find and Attach Advocate
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'nyaaysaathi' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('nyaaysaathi')}
            >
              <Book className="litigantdash-nav-icon-svg" />
              Nyaay-Saathi
            </button>
            <button
              className={`litigantdash-nav-menu-button ${activeSection === 'courtschedule' ? 'litigantdash-nav-active' : ''}`}
              onClick={() => handleNavigation('courtschedule')}
            >
              <Book className="litigantdash-nav-icon-svg" />
              Court Schedule
            </button>
          </nav>
        </aside>

        <main className="litigantdash-main-content-area">
          {renderContent()}
          <LegalAssistantChatbot />
        </main>
      </div>

      {isProfileOpen && (
        <div className="litigantdash-profile-modal-overlay">
          <div className="litigantdash-profile-modal-container">
            <button
              className="litigantdash-close-profile-button"
              onClick={() => setIsProfileOpen(false)}
            >
              ×
            </button>
            <div className="litigantdash-profile-content-wrapper">
              <div className="litigantdash-profile-avatar-large">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="litigantdash-profile-name-heading">{profile?.full_name}</h2>
              <p className="litigantdash-profile-email-text">{profile?.contact?.email}</p>
              <p className="litigantdash-profile-type-text">Party Type: {profile?.party_type}</p>
              <div className="litigantdash-profile-details-grid">
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Party ID:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.party_id}</strong>
                </div>
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Status:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.status}</strong>
                </div>
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Guardian Name:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.parentage}</strong>
                </div>
                <div className="litigantdash-profile-detail-item-row">
                  <span className="litigantdash-profile-detail-label">Contact:</span>
                  <strong className="litigantdash-profile-detail-value">{profile?.contact?.mobile}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="litigantdash-logout-confirm-overlay">
          <div className="litigantdash-logout-confirm-modal">
            <h3 className="litigantdash-logout-confirm-title">Confirm Logout from All Devices</h3>
            <p className="litigantdash-logout-confirm-text">Please enter your password to confirm:</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              placeholder="Enter your password"
              className="litigantdash-password-input-field"
            />
            <div className="litigantdash-logout-confirm-actions">
              <button onClick={handleLogoutAll} className="litigantdash-confirm-logout-button">
                Confirm Logout
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutPassword('');
                }}
                className="litigantdash-cancel-logout-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="litigantdash-error-notification-banner">
          <X className="litigantdash-error-icon-svg" />
          {error}
        </div>
      )}

      {isChangeAdvocateOpen && selectedCaseForAdvocateChange && (
        <ChangeAdvocateModal
          isOpen={isChangeAdvocateOpen}
          onClose={() => {
            setIsChangeAdvocateOpen(false);
            setSelectedCaseForAdvocateChange(null);
          }}
          legalCase={selectedCaseForAdvocateChange}
          litigantProfile={profile}
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
export default LitigantDashboard;