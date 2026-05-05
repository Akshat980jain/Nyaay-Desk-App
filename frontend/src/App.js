import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// ─── Component Imports ────────────────────────────────────────────────────────
import AdvocateRegistration from './Components/AdvocateRegistration';
import AdvocateLogin from './Components/AdvocateLogin';
import Advocatedashboard from './Dashboard/Advocatedashboard';
import LitigantRegister from './Components/LitigantRegister';
import LitigantLogin from './Components/LitigantLogin';
import LitigantDashboard from './Dashboard/LitigantDashboard';
import AdminDashboard from './Dashboard/AdminDashboard';
import Welcome from './Components/Welcome';
import Advocate from './Components/Advocate';
import Admin from './Components/Admin';
import Litigant from './Components/Litigant';
import ClerkRegister from './Components/ClerkRegister';
// ClerkLogin is the shared login UI for both Clerk and Admin portals.
// It receives an `expectedRole` prop to control which backend role it validates against.
import ClerkLogin from './Components/ClerkLogin';
import Clerkdashboard from './Dashboard/Clerkdashboard';
import Clerk from './Components/Clerk';
import NoticeForm from './Components/NoticeForm';
import NoticeBoard from './Components/NoticeBoard';
import NoticeList from './Components/NoticeList';
import UserCalendarPanel from './Components/UserCalendar';
import Videoplead from './Components/Videoplead';
import UploadVideoplead from './Components/UploadVideo';
import Litigantmeeting from './Components/Litigantmeeting';
import Litigantcaseassign from './Components/litigantcaseassign';
import Advocatecaseassign from './Components/Advocatecaseassign';
import Advocatefilecase from './Components/Advocatefilecase';
import Advocatemeeting from './Components/Advocatemeeting';
import LegalAssistantChatbot from './Components/LegalAssistantChatbot';
import NyaaySaathi from './Components/nyaaysaathi';
import ProtectedRoute from './Components/ProtectedRoute';
import PublicCaseSearch from './Components/PublicCaseSearch';
import authService from './services/authService';

// ─── Navigation Header ────────────────────────────────────────────────────────
const NavigationHeader = () => {
  const navigate = useNavigate();

  const styles = {
    headerContainer: {
      width: '100%', height: '50px', backgroundColor: '#0f172a',
      borderBottom: '2px solid #fbbf24', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px', position: 'sticky',
      top: 0, zIndex: 1000, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    leftSection: { display: 'flex', alignItems: 'center', gap: '16px' },
    logoText: { color: '#fbbf24', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em', margin: 0 },
    rightSection: { display: 'flex', alignItems: 'center', gap: '8px' },
    navButton: {
      backgroundColor: 'transparent', border: '1px solid #9c8a70', color: '#f5f3f0',
      padding: '6px 12px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '2px'
    },
    homeButton: { backgroundColor: '#fbbf24', color: '#0f172a', border: '1px solid #fbbf24', fontWeight: '600' },
    icon: { width: '14px', height: '14px' }
  };

  return (
    <div style={styles.headerContainer}>
      <div style={styles.leftSection}>
        <h1 style={styles.logoText}>e-Court Portal</h1>
      </div>
      <div style={styles.rightSection}>
        <button style={styles.navButton} onClick={() => navigate(-1)} title="Go Back"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button style={styles.navButton} onClick={() => navigate(1)} title="Go Forward"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          Forward
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button style={styles.navButton} onClick={() => window.location.reload()} title="Refresh"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        <button style={{...styles.navButton, ...styles.homeButton}} onClick={() => navigate('/')} title="Home"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fbbf24'}>
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
      </div>
    </div>
  );
};

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  // Pages that show the top navigation bar
  const headerRoutes = [
    '/advocate', '/litigant', '/clerk', '/admin',
    '/advlogin', '/register',
    '/litilogin', '/litiregister',
    '/clerklogin', '/clerkregister',
    '/adminlogin',
    '/noticeform', '/noticeboard',
  ];
  const showHeader = headerRoutes.includes(location.pathname);

  // Restore Supabase session once on mount so the SDK can auto-refresh the
  // access token across page reloads (persistent login state).
  useEffect(() => {
    authService.restoreSession();

    // Subscribe to token refresh / sign-out events and keep localStorage in sync
    const subscription = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // If Supabase signs out (e.g. token revoked server-side), navigate home
        navigate('/', { replace: true });
      }
    });

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  // Redirect already-logged-in users to their dashboard
  const loggedInDash = () => {
    const type = localStorage.getItem('userType')?.toLowerCase();
    if (type === 'litigant') return '/litidash';
    if (type === 'advocate') return '/advdash';
    if (type === 'clerk')    return '/clerkdash';
    if (type === 'admin')    return '/admindash';
    return '/';
  };

  // Handle proactive redirection for logged-in users
  useEffect(() => {
    const token = localStorage.getItem('token');
    const type = localStorage.getItem('userType')?.toLowerCase();
    
    // If on home page and logged in, redirect to dashboard
    if (location.pathname === '/' && token && type) {
      const target = loggedInDash();
      if (target !== '/') {
        navigate(target, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return (
    <>
      {showHeader && <NavigationHeader />}
      <Routes>

        {/* ── Home ─────────────────────────────────────────────────────── */}
        <Route path="/" element={
          localStorage.getItem('token')
            ? <Navigate to={loggedInDash()} replace />
            : <Welcome />
        } />

        {/* ── Public pages (no login required) ─────────────────────────── */}
        <Route path="/case-search" element={<PublicCaseSearch />} />
        <Route path="/nyaaysaathi" element={<NyaaySaathi />} />

        {/* ── Role selection landing pages ──────────────────────────────── */}
        <Route path="/advocate" element={<Advocate />} />
        <Route path="/litigant" element={<Litigant />} />
        <Route path="/clerk"    element={<Clerk />} />   {/* → links to /clerklogin */}
        <Route path="/admin"    element={<Admin />} />   {/* → links to /adminlogin */}

        {/* ── Advocate ──────────────────────────────────────────────────── */}
        <Route path="/advlogin"           element={<AdvocateLogin />} />
        <Route path="/register"           element={<AdvocateRegistration />} />
        <Route path="/advocatecaseassign" element={<Advocatecaseassign />} />
        <Route path="/advocatefilecase"   element={<Advocatefilecase />} />
        <Route path="/advocatemeeting"    element={<Advocatemeeting />} />
        <Route path="/advdash" element={
          <ProtectedRoute requiredRole="advocate" redirectTo="/advlogin">
            <Advocatedashboard />
          </ProtectedRoute>
        } />

        {/* ── Litigant ──────────────────────────────────────────────────── */}
        <Route path="/litilogin"          element={<LitigantLogin />} />
        <Route path="/litiregister"       element={<LitigantRegister />} />
        <Route path="/litigantmeeting"    element={<Litigantmeeting />} />
        <Route path="/litigantcaseassign" element={<Litigantcaseassign />} />
        <Route path="/litidash" element={
          <ProtectedRoute requiredRole="litigant" redirectTo="/litilogin">
            <LitigantDashboard />
          </ProtectedRoute>
        } />

        {/* ── Clerk ─────────────────────────────────────────────────────── */}
        {/*
          /clerklogin    → ClerkLogin UI, sends expected_role='clerk' to Edge Function.
                           Only users whose Supabase user_metadata.user_role = 'clerk' can log in.
          /clerkregister → Clerk self-registration form.
          /clerkdash     → Protected — requires userType='clerk' in localStorage.
        */}
        <Route path="/clerklogin"    element={<ClerkLogin expectedRole="clerk" />} />
        <Route path="/clerkregister" element={<ClerkRegister />} />
        <Route path="/clerkdash" element={
          <ProtectedRoute requiredRole="clerk" redirectTo="/clerklogin">
            <Clerkdashboard />
          </ProtectedRoute>
        } />

        {/* ── Admin ─────────────────────────────────────────────────────── */}
        {/*
          /adminlogin → ClerkLogin UI, sends expected_role='admin' to Edge Function.
                        Only users whose Supabase user_metadata.user_role = 'admin' can log in.
          /admindash  → Protected — requires userType='admin' in localStorage.
                        On success, Edge Function returns user_type='admin' and
                        ClerkLogin navigates here automatically.
        */}
        <Route path="/adminlogin" element={<ClerkLogin expectedRole="admin" />} />
        <Route path="/admindash" element={
          <ProtectedRoute requiredRole="admin" redirectTo="/adminlogin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* ── Shared court resources ────────────────────────────────────── */}
        <Route path="/noticeform"      element={<NoticeForm />} />
        <Route path="/noticeboard"     element={<NoticeBoard />} />
        <Route path="/noticelist"      element={<NoticeList />} />
        <Route path="/usercalendar"    element={<UserCalendarPanel />} />
        <Route path="/videopleading"   element={<Videoplead />} />
        <Route path="/uploadvideoplead" element={<UploadVideoplead />} />
        <Route path="/chatbot"         element={<LegalAssistantChatbot />} />

        {/* ── Catch-all: redirect unknown routes to home ────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;