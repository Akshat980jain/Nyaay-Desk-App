/**
 * supabaseApi.js
 * 
 * Centralized API service using Supabase Edge Functions.
 * This REPLACES the old axios-based api.js for all advocate/litigant/case routes.
 * 
 * The old Node.js backend at localhost:5000 / Render is NO LONGER NEEDED.
 * All calls go directly to Supabase Edge Functions.
 * 
 * Usage (drop-in replacement for `api` from services/api):
 *   import supabaseApi from '../services/supabaseApi';
 *   await supabaseApi.get('/api/advocate/profile');
 *   await supabaseApi.post('/api/advocate/join-case', { caseNum, partyType });
 */

import { supabase } from './supabaseClient';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  // Fall back to localStorage token (set by our login flow)
  const token = session?.access_token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
  };
};

const callEdge = async (functionName, action, method = 'GET', body = null, extraParams = {}) => {
  const headers = await getAuthHeaders();
  const baseUrl = `${SUPABASE_URL}/functions/v1/${functionName}/${action}`;
  
  // Append query params for GET
  let url = baseUrl;
  if (method === 'GET' && Object.keys(extraParams).length > 0) {
    const params = new URLSearchParams(extraParams);
    url = `${baseUrl}?${params.toString()}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed: ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }

  return { data };
};

// ─── Route Map ────────────────────────────────────────────────────────────────
// Maps old REST paths to new Supabase Edge Function calls

const ROUTE_MAP = {
  // ── Advocate Profile ──────────────────────────────────────────────────────
  'GET /api/advocate/profile': () =>
    callEdge('advocate-portal', 'profile', 'GET'),

  // ── Advocate Cases ────────────────────────────────────────────────────────
  'GET /api/cases/advocate': () =>
    callEdge('advocate-portal', 'my-cases', 'GET'),

  'GET /api/cases/district': () =>
    callEdge('advocate-portal', 'district-cases', 'GET'),

  // ── Join Requests ─────────────────────────────────────────────────────────
  'GET /api/advocate/pending-requests': () =>
    callEdge('advocate-portal', 'pending-requests', 'GET'),

  'GET /api/advocate/sent-requests': () =>
    callEdge('advocate-portal', 'sent-requests', 'GET'),

  // ── Document Requests ─────────────────────────────────────────────────────
  'GET /api/advocate/my-document-requests': () =>
    callEdge('advocate-portal', 'my-document-requests', 'GET'),
};

// ─── Dynamic route handlers ───────────────────────────────────────────────────

const handleDynamicGet = async (path) => {
  // GET /api/case/:caseNum/video-meeting/advocate
  const meetingCheckMatch = path.match(/^\/api\/case\/(.+)\/video-meeting\/advocate$/);
  if (meetingCheckMatch) {
    return callEdge('advocate-portal', 'video-meeting', 'GET', null, { caseNum: meetingCheckMatch[1] });
  }

  // GET /api/case/:caseNum/hearings/advocate
  const hearingsMatch = path.match(/^\/api\/case\/(.+)\/hearings\/advocate$/);
  if (hearingsMatch) {
    return callEdge('advocate-portal', 'hearings', 'GET', null, { caseNum: hearingsMatch[1] });
  }

  // GET /api/case/:caseNum/documents/advocate
  const docsMatch = path.match(/^\/api\/case\/(.+)\/documents\/advocate$/);
  if (docsMatch) {
    return callEdge('advocate-portal', 'case-documents', 'GET', null, { caseNum: docsMatch[1] });
  }

  // GET /api/document/:id/download/advocate
  const docDownloadMatch = path.match(/^\/api\/document\/(.+)\/download\/advocate$/);
  if (docDownloadMatch) {
    return callEdge('advocate-portal', 'download-document', 'GET', null, { documentId: docDownloadMatch[1] });
  }

  // GET /api/files/:filename
  const fileMatch = path.match(/^\/api\/files\/(.+)$/);
  if (fileMatch) {
    return callEdge('advocate-portal', 'get-file', 'GET', null, { filename: fileMatch[1] });
  }

  // GET /api/advocate-change/advocate-requests/:advocateId
  const nocMatch = path.match(/^\/api\/advocate-change\/advocate-requests\/(.+)$/);
  if (nocMatch) {
    // advocate-change resolves advocate_id from the JWT automatically
    return callEdge('advocate-change', 'get-noc-requests', 'GET');
  }

  // GET /api/advocate-change/generate-application/:requestId
  const genAppMatch = path.match(/^\/api\/advocate-change\/generate-application\/(.+)$/);
  if (genAppMatch) {
    return callEdge('advocate-change', 'generate-application', 'GET', null, { requestId: genAppMatch[1] });
  }

  throw new Error(`No Supabase route mapped for GET ${path}`);
};

const handleDynamicPost = async (path, body) => {
  // POST /api/cases/:caseId/advocate-join-request
  const joinMatch = path.match(/^\/api\/cases\/(.+)\/advocate-join-request$/);
  if (joinMatch) {
    return callEdge('advocate-portal', 'join-case', 'POST', {
      caseNum: joinMatch[1],
      ...body,
    });
  }

  // POST /api/case/:caseNum/document/advocate
  const uploadDocMatch = path.match(/^\/api\/case\/(.+)\/document\/advocate$/);
  if (uploadDocMatch) {
    // File uploads go directly to Supabase Storage — handled separately
    throw new Error('File uploads must use the Supabase Storage upload helper, not this API.');
  }

  // POST /api/case/:caseNum/video-meeting/advocate/request-access
  const otpRequestMatch = path.match(/^\/api\/case\/(.+)\/video-meeting\/advocate\/request-access$/);
  if (otpRequestMatch) {
    return callEdge('advocate-portal', 'meeting-request-otp', 'POST', { caseNum: otpRequestMatch[1], ...body });
  }

  // POST /api/case/:caseNum/video-meeting/advocate/verify-otp
  const otpVerifyMatch = path.match(/^\/api\/case\/(.+)\/video-meeting\/advocate\/verify-otp$/);
  if (otpVerifyMatch) {
    return callEdge('advocate-portal', 'meeting-verify-otp', 'POST', { caseNum: otpVerifyMatch[1], ...body });
  }

  // POST /api/advocate-change/request
  if (path === '/api/advocate-change/request') {
    return callEdge('advocate-change', 'request', 'POST', body);
  }

  // POST /api/advocate/logout
  if (path === '/api/advocate/logout') {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    return { data: { message: 'Logged out successfully' } };
  }

  throw new Error(`No Supabase route mapped for POST ${path}`);
};

const handleDynamicPut = async (path, body) => {
  // PUT /api/cases/:caseId/advocate-requests/:requestId
  const handleReqMatch = path.match(/^\/api\/cases\/(.+)\/advocate-requests\/(.+)$/);
  if (handleReqMatch) {
    return callEdge('advocate-portal', 'handle-request', 'PUT', {
      caseNum: handleReqMatch[1],
      requestId: handleReqMatch[2],
      ...body,
    });
  }

  // PUT /api/advocate-change/respond-noc/:requestId
  const respondNocMatch = path.match(/^\/api\/advocate-change\/respond-noc\/(.+)$/);
  if (respondNocMatch) {
    return callEdge('advocate-change', 'respond-noc', 'POST', {
      ...body,
      requestId: respondNocMatch[1],
    });
  }

  // PUT /api/advocate-change/court-pending
  if (path === '/api/advocate-change/court-pending') {
    return callEdge('advocate-change', 'court-pending', 'POST', body);
  }

  // PUT /api/advocate-change/review
  if (path === '/api/advocate-change/review') {
    return callEdge('advocate-change', 'review', 'POST', body);
  }

  throw new Error(`No Supabase route mapped for PUT ${path}`);
};

// ─── Public API (mirrors axios instance interface) ─────────────────────────────

const supabaseApi = {
  get: async (path) => {
    const key = `GET ${path}`;
    if (ROUTE_MAP[key]) return ROUTE_MAP[key]();
    return handleDynamicGet(path);
  },

  post: async (path, body, config) => {
    const key = `POST ${path}`;
    if (ROUTE_MAP[key]) return ROUTE_MAP[key](body);
    return handleDynamicPost(path, body);
  },

  put: async (path, body) => {
    const key = `PUT ${path}`;
    if (ROUTE_MAP[key]) return ROUTE_MAP[key](body);
    return handleDynamicPut(path, body);
  },

  patch: async (path, body) => {
    return supabaseApi.put(path, body);
  },

  delete: async (path) => {
    throw new Error(`DELETE not yet mapped for Supabase: ${path}`);
  },
};

export default supabaseApi;
