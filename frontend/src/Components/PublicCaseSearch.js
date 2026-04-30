import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/PublicCaseSearch.css';
import CaseStatusTimeline from './CaseStatusTimeline';

const PublicCaseSearch = () => {
  const [searchType, setSearchType] = useState('case_no');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Lock body scroll until user has searched
  useEffect(() => {
    if (!searched) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [searched]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSelectedCase(null);
    setSearched(true);

    try {
      const response = await axios.get('https://nyaay-desk-app-backend.onrender.com/api/public/case-search', {
        params: { type: searchType, q: query.trim() }
      });
      setResults(response.data.cases || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    const map = {
      'Filed': '#2563eb', 'Pending': '#d97706', 'Under Investigation': '#b45309',
      'Hearing in Progress': '#16a34a', 'Awaiting Judgment': '#7c3aed',
      'Disposed': '#15803d', 'Appealed': '#be123c'
    };
    return map[status] || '#64748b';
  };

  const placeholderMap = {
    case_no:       'e.g.  CS/123/2024  or  CC-2024-00123',
    party_name:    'e.g.  Ramesh Kumar  or  State of UP',
    advocate_name: 'e.g.  Adv. Priya Singh',
  };

  return (
    <div className={`pcs-page ${searched ? 'pcs-page--searched' : ''}`}>

      {/* ── Hero ── */}
      <div className="pcs-hero">
        <div className="pcs-hero-content">

          {/* Emblem */}
          <div className="pcs-emblem-wrap">
            <span className="pcs-emblem">⚖️</span>
          </div>

          {/* Badge */}
          <div className="pcs-badge">e-Court Portal · Public Access</div>

          {/* Title */}
          <h1 className="pcs-title">
            Search <span>Case Status</span>
          </h1>
          <p className="pcs-subtitle">
            Find any registered case instantly — no login, no registration required.<br />
            Serving transparency in the Indian judicial system.
          </p>

          {/* Stats Row */}
          <div className="pcs-stats-row">
            <div className="pcs-stat">
              <span className="pcs-stat-number">25+</span>
              <span className="pcs-stat-label">Case Types</span>
            </div>
            <div className="pcs-stat">
              <span className="pcs-stat-number">100%</span>
              <span className="pcs-stat-label">Secure</span>
            </div>
            <div className="pcs-stat">
              <span className="pcs-stat-number">Live</span>
              <span className="pcs-stat-label">Real-time Data</span>
            </div>
            <div className="pcs-stat">
              <span className="pcs-stat-number">Free</span>
              <span className="pcs-stat-label">No Login Needed</span>
            </div>
          </div>

          {/* Search Card */}
          <div className="pcs-search-card">
            <form onSubmit={handleSearch}>
              {/* Tabs */}
              <div className="pcs-search-type-tabs">
                {[
                  { key: 'case_no',       label: '🔢  Case Number' },
                  { key: 'party_name',    label: '🧑  Party Name'  },
                  { key: 'advocate_name', label: '⚖️  Advocate'    },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`pcs-tab ${searchType === tab.key ? 'active' : ''}`}
                    onClick={() => setSearchType(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Input Row */}
              <div className="pcs-input-row">
                <input
                  type="text"
                  className="pcs-input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={placeholderMap[searchType]}
                  required
                />
                <button type="submit" className="pcs-search-btn" disabled={loading}>
                  {loading
                    ? <><span className="pcs-spinner">⟳</span> Searching…</>
                    : <>🔍 Search</>
                  }
                </button>
              </div>
            </form>

            {/* Tips */}
            <div className="pcs-tips">
              <span className="pcs-tip">Try <span>CS/001/2024</span></span>
              <span className="pcs-tip">or <span>Ramesh Kumar</span></span>
              <span className="pcs-tip">or <span>Adv. Sharma</span></span>
            </div>
          </div>

          {/* Scroll hint — only when not searched yet */}
          {!searched && (
            <p className="pcs-scroll-hint">
              ↑ Search to see results below
            </p>
          )}

        </div>
      </div>

      {/* ── Results — only rendered after a search ── */}
      {searched && (
        <div className="pcs-results-area">

          {error && <div className="pcs-error">⚠️ {error}</div>}

          {!loading && results.length === 0 && !error && (
            <div className="pcs-no-results">
              <span className="pcs-no-results-icon">📂</span>
              <p>No cases found matching your search.</p>
              <p className="pcs-hint">Try a different search term or search type.</p>
            </div>
          )}

          {loading && (
            <div className="pcs-loading-state">
              <span className="pcs-big-spinner">⟳</span>
              <p>Searching case records…</p>
            </div>
          )}

          {results.length > 0 && !selectedCase && (
            <div className="pcs-results-list">
              <h3 className="pcs-results-heading">
                {results.length} Case{results.length > 1 ? 's' : ''} Found
              </h3>
              {results.map((c, idx) => (
                <div key={idx} className="pcs-result-card" onClick={() => setSelectedCase(c)}>
                  <div className="pcs-result-top">
                    <div>
                      <span className="pcs-result-caseno">{c.case_no || c.case_num || 'CNR Pending'}</span>
                      <span className="pcs-result-type">{c.case_type || 'N/A'}</span>
                    </div>
                    <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                      {!c.case_approved && (
                        <span className="pcs-pending-badge">⏳ Pending Approval</span>
                      )}
                      <span className="pcs-result-status" style={{ color: statusColor(c.status) }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="pcs-result-parties">
                    <span>🧑 {c.plaintiff_details?.name || '—'}</span>
                    <span className="pcs-vs">vs.</span>
                    <span>👤 {c.respondent_details?.name || '—'}</span>
                  </div>
                  <div className="pcs-result-footer">
                    <span>📍 {c.district}</span>
                    {c.court && <span>🏛️ {c.court}</span>}
                    <span>📅 Filed: {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</span>
                    <span className="pcs-view-link">View Full Details →</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCase && (
            <div className="pcs-detail-view">
              <button className="pcs-back-btn" onClick={() => setSelectedCase(null)}>
                ← Back to Results
              </button>

              <div className="pcs-detail-parties">
                <div className="pcs-party-card plaintiff">
                  <span className="party-role">Plaintiff / Applicant</span>
                  <strong>{selectedCase.plaintiff_details?.name || '—'}</strong>
                  <span>{selectedCase.plaintiff_details?.address || ''}</span>
                  {selectedCase.plaintiff_details?.advocate && (
                    <span className="party-advocate">⚖️ {selectedCase.plaintiff_details.advocate}</span>
                  )}
                </div>
                <div className="pcs-party-vs">VS</div>
                <div className="pcs-party-card respondent">
                  <span className="party-role">Respondent / Opponent</span>
                  <strong>{selectedCase.respondent_details?.name || '—'}</strong>
                  <span>{selectedCase.respondent_details?.address || ''}</span>
                  {selectedCase.respondent_details?.advocate && (
                    <span className="party-advocate">⚖️ {selectedCase.respondent_details.advocate}</span>
                  )}
                </div>
              </div>

              <CaseStatusTimeline caseData={selectedCase} />

              <p className="pcs-disclaimer">
                ℹ️ This information is provided for informational purposes only.
                For certified copies, please contact the court directly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicCaseSearch;
