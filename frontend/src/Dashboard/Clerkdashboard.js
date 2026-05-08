import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, LogOut, FileText, Calendar, Database, ShieldCheck, Info, Users, Settings, PanelLeft, Clipboard, UserPlus } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import '../ComponentsCSS/Clerkdashboard.css';

// Import components with the correct paths
import NoticePanel from '../Components/NoticePanel';
import NoticeBoard from '../Components/NoticeBoard';
import AdminCalendar from '../Components/AdminCalendar';
import UserCalendar from '../Components/UserCalendar';
import AdminMeeting from '../Components/Adminmeeting';
import AdminCaseHandle from '../Components/Admincasehandle';
import AdminAccountHandle from '../Components/Adminaccounthandle';
import AdminCreation from '../Components/AdminCreation';
import AdvocateChangeReview from '../Components/AdvocateChangeReview';
import emblem from "../images/aadiimage4.svg";
import logo from "../images/aadiimage4.png";

const ClerkDashboard = () => {
    // Main Dashboard State
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [logoutPassword, setLogoutPassword] = useState('');
    const [showVerificationSection, setShowVerificationSection] = useState(false);
    const [activeComponent, setActiveComponent] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar toggle
    const navigate = useNavigate();

    // Advocate Verification State
    const [advocates, setAdvocates] = useState({ verifiedAdvocates: [], unverifiedAdvocates: [] });
    const [selectedAdvocate, setSelectedAdvocate] = useState(null);
    const [verificationDeclaration, setVerificationDeclaration] = useState('');
    const [verificationNotes, setVerificationNotes] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationData, setVerificationData] = useState({});
    const [signaturePin, setSignaturePin] = useState('');
    const [signatureStatus, setSignatureStatus] = useState(null);
    const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);

    // Dashboard Stats State
    const [dashboardStats, setDashboardStats] = useState({
        activeCases: 0,
        upcomingHearings: 0,
        pendingDocuments: 0
    });

    useEffect(() => {
        fetchProfile();
        fetchDashboardStats();
        if (showVerificationSection) {
            fetchAdvocates();
        }
    }, [showVerificationSection]);

    // Fetch Dashboard Stats directly from Supabase
    const fetchDashboardStats = async () => {
        try {
            const today = new Date().toISOString();

            const [{ count: activeCases }, { count: upcomingHearings }, { count: pendingDocuments }] = await Promise.all([
                supabase.from('legal_cases').select('*', { count: 'exact', head: true }).eq('case_approved', true),
                supabase.from('legal_cases').select('*', { count: 'exact', head: true }).gt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
                supabase.from('legal_cases').select('*', { count: 'exact', head: true }).eq('case_approved', false),
            ]);

            setDashboardStats({
                activeCases: activeCases || 0,
                upcomingHearings: upcomingHearings || 0,
                pendingDocuments: pendingDocuments || 0,
            });
        } catch (err) {
            console.error('Failed to fetch dashboard stats', err);
        }
    };

    // Profile Fetching from localStorage (set during clerk login)
    const fetchProfile = async () => {
        try {
            const userData = localStorage.getItem('userData');
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/clerklogin');
                return;
            }
            if (userData) {
                setProfile(JSON.parse(userData));
                setLoading(false);
                return;
            }
            // Fallback: fetch from clerks table using email from JWT
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                const { data: clerk, error } = await supabase
                    .from('clerks')
                    .select('*')
                    .eq('email', user.email)
                    .single();
                if (error || !clerk) throw new Error('Clerk not found');
                setProfile(clerk);
            } else {
                navigate('/clerklogin');
            }
        } catch (err) {
            setError(err.message || 'Failed to load profile');
            navigate('/clerklogin');
        } finally {
            setLoading(false);
        }
    };

    // Advocates Fetching from Supabase
    const fetchAdvocates = async () => {
        try {
            const [{ data: verified }, { data: unverified }] = await Promise.all([
                supabase.from('advocates').select('*').eq('is_verified', true).eq('status', 'active'),
                supabase.from('advocates').select('*').eq('is_verified', false),
            ]);
            setAdvocates({
                verifiedAdvocates: verified || [],
                unverifiedAdvocates: unverified || [],
            });
        } catch (err) {
            setError('Error fetching advocates');
        }
    };

    // Document Viewing via Supabase Storage
    const viewCOPDocument = async (advocateId) => {
        try {
            // Try to get a signed URL from Supabase Storage
            const { data, error } = await supabase.storage
                .from('cop_documents')
                .createSignedUrl(`${advocateId}/cop.pdf`, 60);
            if (error || !data?.signedUrl) throw new Error('Document not found in storage');
            window.open(data.signedUrl, '_blank');
        } catch (err) {
            setError('COP document not found. The advocate may not have uploaded it yet.');
        }
    };

    // Digital Signature Generation
    const generateDigitalSignature = async () => {
        if (!signaturePin || signaturePin.length !== 6) {
            setSignatureStatus({
                type: 'error',
                message: 'Please enter a valid 6-digit PIN'
            });
            return;
        }

        setIsGeneratingSignature(true);
        try {
            const timestamp = new Date().toISOString();
            const encoder = new TextEncoder();
            const data = encoder.encode(signaturePin + timestamp + profile.clerk_id);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const signature = {
                timestamp,
                signatureId: `SIG-${Math.random().toString(36).substr(2, 9)}`,
                certificateHash,
                clerkId: profile.clerk_id,
                clerkName: profile.name,
                district: profile.district,
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            setVerificationData(prevData => ({
                ...prevData,
                digitalSignature: signature
            }));

            setSignatureStatus({
                type: 'success',
                message: 'Digital signature generated successfully'
            });
        } catch (error) {
            setSignatureStatus({
                type: 'error',
                message: 'Failed to generate signature. Please try again.'
            });
        }
        setIsGeneratingSignature(false);
    };

    // Verification Handling via Supabase
    const handleVerification = async () => {
        if (!verificationData.digitalSignature) {
            setError('Digital signature is required for verification');
            return;
        }

        try {
            const { error } = await supabase
                .from('advocates')
                .update({
                    is_verified: true,
                    status: 'active',
                    updated_at: new Date().toISOString(),
                })
                .eq('advocate_id', selectedAdvocate.advocate_id);

            if (error) throw error;

            setShowVerificationModal(false);
            resetVerificationForm();
            fetchAdvocates();
        } catch (err) {
            setError(err.message || 'Verification failed');
        }
    };

    // Logout — just clear local storage (no backend needed)
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/clerklogin');
    };

    const handleLogoutAll = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setShowLogoutConfirm(false);
        navigate('/clerklogin');
    };

    // Utility Functions
    const resetVerificationForm = () => {
        setVerificationDeclaration('');
        setVerificationNotes('');
        setVerificationData({});
        setSignaturePin('');
        setSignatureStatus(null);
    };

    // Navigation handler
    const handleNavigation = (component) => {
        setActiveComponent(component);
        if (component === 'verifications') {
            setShowVerificationSection(true);
        } else {
            setShowVerificationSection(false);
        }
        setIsSidebarOpen(false); // Close sidebar on navigation
    };

    // Sidebar toggle handler
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Dashboard Content Handler
    const renderContent = () => {
        switch (activeComponent) {
            case 'dashboard':
                return (
                    <section className="court-clerk-stats">
                        <div className="court-clerk-stat-card">
                            <h3 className="court-clerk-stat-title">Active Cases</h3>
                            <p className="court-clerk-stat-value">{dashboardStats.activeCases}</p>
                        </div>
                        <div className="court-clerk-stat-card">
                            <h3 className="court-clerk-stat-title">Upcoming Hearings</h3>
                            <p className="court-clerk-stat-value">{dashboardStats.upcomingHearings}</p>
                        </div>
                        <div className="court-clerk-stat-card">
                            <h3 className="court-clerk-stat-title">Pending Documents</h3>
                            <p className="court-clerk-stat-value">{dashboardStats.pendingDocuments}</p>
                        </div>
                    </section>
                );
            case 'verifications':
                return (
                    <div className="court-clerk-verification-section">
                        <h2 className="court-clerk-verification-title">Advocate Verification Management</h2>
                        <div className="court-clerk-unverified-section">
                            <h3 className="court-clerk-section-heading">Pending Verifications</h3>
                            <div className="court-clerk-advocates-grid">
                                {advocates.unverifiedAdvocates.map(advocate => (
                                    <div key={advocate.advocate_id} className="court-clerk-advocate-card">
                                        <h4 className="court-clerk-advocate-name">{advocate.name}</h4>
                                        <p className="court-clerk-advocate-detail">Enrollment No: {advocate.enrollment_no}</p>
                                        <p className="court-clerk-advocate-detail">District: {advocate.practice_details.district}</p>
                                        <p className="court-clerk-advocate-detail">Bar ID: {advocate.barId}</p>
                                        <div className="court-clerk-card-actions">
                                            <button
                                                onClick={() => viewCOPDocument(advocate.advocate_id)}
                                                className="court-clerk-view-doc-btn"
                                            >
                                                View COP Document
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAdvocate(advocate);
                                                    setShowVerificationModal(true);
                                                }}
                                                className="court-clerk-verify-btn"
                                            >
                                                Verify Advocate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="court-clerk-verified-section">
                            <h3 className="court-clerk-section-heading">Verified Advocates</h3>
                            <div className="court-clerk-advocates-grid">
                                {advocates.verifiedAdvocates.map(advocate => (
                                    <div key={advocate.advocate_id} className="court-clerk-advocate-card court-clerk-verified">
                                        <h4 className="court-clerk-advocate-name">{advocate.name}</h4>
                                        <p className="court-clerk-advocate-detail">Enrollment No: {advocate.enrollment_no}</p>
                                        <p className="court-clerk-advocate-detail">District: {advocate.practice_details.district}</p>
                                        <p className="court-clerk-advocate-detail">Bar ID: {advocate.barId}</p>
                                        <p className="court-clerk-verification-date">
                                            Verified On: {new Date(advocate.verificationDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'noticepanel':
                return <NoticePanel />;
            case 'casemanagement':
                return <AdminCaseHandle />;
            case 'calendar':
                return <AdminCalendar />;
            case 'adminmeeting':
                return <AdminMeeting />;
            case 'usercalendar':
                return <UserCalendar />;
            case 'usernoticeboard':
                return <NoticeBoard />;
            case 'adminaccounthandle':
                return <AdminAccountHandle />;
            case 'admincreation':
                return <AdminCreation />
            case 'advocate-change':
                return <AdvocateChangeReview profile={profile} />;
            default:
                return <div>Select an option from the sidebar</div>;
        }
    };

    if (loading) {
        return (
            <div className="clerk-loading-container">
                <div className="clerk-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="court-clerk-dashboard">
            {/* Header */}
            <header className="court-clerk-header">
                <div className="court-clerk-header-left">
                    <button className="sidebar-toggle" onClick={toggleSidebar}>
                        ☰
                    </button>
                    <div className="emblem-logo">
                        <div className="emblem-image"><img src={emblem} alt="Aaditiya Tyagi" ></img></div>
                    </div>

                    <h1 className="court-clerk-title">Clerk Panel</h1>
                </div>
                <div className="court-clerk-header-right">
                    <div className="court-clerk-logout-buttons">
                        <button className="court-clerk-logout-btn" onClick={handleLogout}>
                            <LogOut className="court-clerk-logout-icon" />
                            Logout
                        </button>
                        <button className="court-clerk-logout-all-btn" onClick={() => setShowLogoutConfirm(true)}>
                            <LogOut className="court-clerk-logout-icon" />
                            Logout All Devices
                        </button>
                    </div>
                    <div className="court-clerk-profile-toggle" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <div className="court-clerk-avatar">
                            {profile?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="court-clerk-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="court-clerk-content">
                {/* Sidebar */}
                <aside className={`court-clerk-sidebar ${isSidebarOpen ? 'active' : ''}`}>
                    <nav className="court-clerk-nav">
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'dashboard' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard')}
                        >
                            <Database className="court-clerk-nav-icon" />
                            Dashboard
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'casemanagement' ? 'active' : ''}`}
                            onClick={() => handleNavigation('casemanagement')}
                        >
                            <FileText className="court-clerk-nav-icon" />
                            Case Management Panel
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'calendar' ? 'active' : ''}`}
                            onClick={() => handleNavigation('calendar')}
                        >
                            <Calendar className="court-clerk-nav-icon" />
                            Set Calendar
                        </button>

                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'noticepanel' ? 'active' : ''}`}
                            onClick={() => handleNavigation('noticepanel')}
                        >
                            <PanelLeft className="court-clerk-nav-icon" />
                            Notice Panel
                        </button>


                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'adminmeeting' ? 'active' : ''}`}
                            onClick={() => handleNavigation('adminmeeting')}
                        >
                            <Users className="court-clerk-nav-icon" />
                            Schedule Meetings
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'verifications' ? 'active' : ''}`}
                            onClick={() => handleNavigation('verifications')}
                        >
                            <ShieldCheck className="court-clerk-nav-icon" />
                            Advocate Verifications
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'usercalendar' ? 'active' : ''}`}
                            onClick={() => handleNavigation('usercalendar')}
                        >
                            <Calendar className="court-clerk-nav-icon" />
                            Calendar
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'usernoticeboard' ? 'active' : ''}`}
                            onClick={() => handleNavigation('usernoticeboard')}
                        >
                            <Clipboard className="court-clerk-nav-icon" />
                            Notice Board
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'adminaccounthandle' ? 'active' : ''}`}
                            onClick={() => handleNavigation('adminaccounthandle')}
                        >
                            <Settings className="court-clerk-nav-icon" />
                            Manage Accounts
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'admincreation' ? 'active' : ''}`}
                            onClick={() => handleNavigation('admincreation')}
                        >
                            <UserPlus className="court-clerk-nav-icon" />
                            Create & Manage Admins
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'notifications' ? 'active' : ''}`}
                            onClick={() => handleNavigation('notifications')}
                        >
                            <Info className="court-clerk-nav-icon" />
                            Notifications
                        </button>
                        <button
                            className={`court-clerk-nav-btn ${activeComponent === 'advocate-change' ? 'active' : ''}`}
                            onClick={() => handleNavigation('advocate-change')}
                        >
                            <ShieldCheck className="court-clerk-nav-icon" />
                            Advocate NOC Review
                        </button>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="court-clerk-main">
                    {renderContent()}

                </main>
            </div>

            {/* Verification Modal */}
            {showVerificationModal && (
                <div className="court-clerk-modal-overlay">
                    <div className="court-clerk-verification-modal">
                        <h3 className="court-clerk-modal-title">Verify Advocate</h3>
                        <p className="court-clerk-modal-advocate-name">
                            Advocate Name: {selectedAdvocate?.name}
                        </p>
                        <div className="court-clerk-form-group">
                            <label className="court-clerk-form-label">
                                Verification Declaration:
                                <textarea
                                    className="court-clerk-form-textarea"
                                    value={verificationDeclaration}
                                    onChange={(e) => setVerificationDeclaration(e.target.value)}
                                    placeholder="I hereby declare that I have verified all the documents..."
                                    required
                                />
                            </label>
                        </div>
                        <div className="court-clerk-form-group">
                            <label className="court-clerk-form-label">
                                Verification Notes:
                                <textarea
                                    className="court-clerk-form-textarea"
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    placeholder="Additional notes about verification..."
                                />
                            </label>
                        </div>
                        <div className="court-clerk-signature-section">
                            <h4 className="court-clerk-signature-title">Digital Signature Verification</h4>
                            <div className="court-clerk-form-group">
                                <label className="court-clerk-form-label">
                                    Enter Your 6-digit PIN:
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={signaturePin}
                                        onChange={(e) => setSignaturePin(e.target.value)}
                                        className="court-clerk-pin-input"
                                        placeholder="Enter PIN"
                                    />
                                </label>
                            </div>
                            <button
                                onClick={generateDigitalSignature}
                                disabled={isGeneratingSignature || signaturePin.length !== 6}
                                className="court-clerk-generate-signature-btn"
                            >
                                {isGeneratingSignature ? 'Generating...' : 'Generate Digital Signature'}
                            </button>
                            {signatureStatus && (
                                <div className={`court-clerk-alert ${signatureStatus.type === 'error' ? 'court-clerk-alert-error' : 'court-clerk-alert-success'}`}>
                                    <div className="court-clerk-alert-icon">
                                        {signatureStatus.type === 'success' ? (
                                            <Check className="court-clerk-check-icon" />
                                        ) : (
                                            <X className="court-clerk-x-icon" />
                                        )}
                                    </div>
                                    <div className="court-clerk-alert-content">
                                        <h4 className="court-clerk-alert-title">
                                            {signatureStatus.type === 'success' ? 'Success' : 'Error'}
                                        </h4>
                                        <p className="court-clerk-alert-message">
                                            {signatureStatus.message}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {verificationData.digitalSignature && (
                                <div className="court-clerk-signature-details">
                                    <h5 className="court-clerk-signature-details-title">Signature Details</h5>
                                    <div className="court-clerk-signature-info">
                                        <p>Signature ID: {verificationData.digitalSignature.signatureId}</p>
                                        <p>Generated: {new Date(verificationData.digitalSignature.timestamp).toLocaleString()}</p>
                                        <p>Valid Until: {new Date(verificationData.digitalSignature.validUntil).toLocaleString()}</p>
                                        <p className="court-clerk-signature-hash">
                                            Certificate Hash: {verificationData.digitalSignature.certificateHash}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="court-clerk-modal-actions">
                            <button
                                onClick={handleVerification}
                                className="court-clerk-confirm-btn"
                                disabled={!verificationDeclaration || !verificationData.digitalSignature}
                            >
                                Confirm Verification
                            </button>
                            <button
                                onClick={() => {
                                    setShowVerificationModal(false);
                                    resetVerificationForm();
                                }}
                                className="court-clerk-cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileOpen && (
                <div className="court-clerk-profile-overlay">
                    <div className="court-clerk-profile-modal">
                        <button
                            className="court-clerk-close-profile"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            ×
                        </button>
                        <div className="court-clerk-profile-content">
                            <div className="court-clerk-profile-avatar court-clerk-large">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2>{profile?.name}</h2>
                            <h4>{profile?.clerk_id}</h4>
                            <p>{profile?.email}</p>
                            <p>District: {profile?.district}</p>
                            <div className="court-clerk-profile-details">
                                <div className="court-clerk-detail-item">
                                    <span>Email:</span>
                                    <strong>{profile?.contact.email}</strong>
                                </div>
                                <div className="court-clerk-detail-item">
                                    <span>Status:</span>
                                    <strong>{profile?.status}</strong>
                                </div>
                                <div className="court-clerk-detail-item">
                                    <span>Court:</span>
                                    <strong>
                                        {profile?.court_name}
                                    </strong>
                                </div>
                                <div className="court-clerk-detail-item">
                                    <span>Court Number:</span>
                                    <strong>
                                        {profile?.court_no}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="court-clerk-logout-overlay">
                    <div className="court-clerk-logout-modal">
                        <h3 className="court-clerk-logout-title">Confirm Logout from All Devices</h3>
                        <p className="court-clerk-logout-text">Please enter your password to confirm:</p>
                        <input
                            type="password"
                            value={logoutPassword}
                            onChange={(e) => setLogoutPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="court-clerk-password-input"
                        />
                        <div className="court-clerk-logout-actions">
                            <button onClick={handleLogoutAll} className="court-clerk-confirm-btn">
                                Confirm Logout
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutConfirm(false);
                                    setLogoutPassword('');
                                }}
                                className="court-clerk-cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="court-clerk-error-message">
                    <X className="court-clerk-error-icon" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ClerkDashboard;