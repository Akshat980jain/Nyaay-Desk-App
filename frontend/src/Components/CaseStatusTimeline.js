import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/CaseTimeline.css';

const statusSteps = [
  { key: 'Filed',               label: 'Filed',               icon: '📁', description: 'Case has been officially filed with the court.' },
  { key: 'Pending',             label: 'Pending',             icon: '⏳', description: 'Case is pending review and assignment.' },
  { key: 'Under Investigation', label: 'Under Investigation', icon: '🔍', description: 'Authorities / court is investigating the matter.' },
  { key: 'Hearing in Progress', label: 'Hearing in Progress', icon: '⚖️', description: 'Active hearings are being conducted.' },
  { key: 'Awaiting Judgment',   label: 'Awaiting Judgment',   icon: '📋', description: 'Arguments concluded. Judgment is awaited.' },
  { key: 'Disposed',            label: 'Disposed',            icon: '✅', description: 'Case has been disposed / concluded.' },
];

const CaseStatusTimeline = ({ caseData }) => {
  if (!caseData) return null;

  const currentStatus = caseData.status || 'Filed';
  const currentIndex = statusSteps.findIndex(s => s.key === currentStatus);
  const isAppealed = currentStatus === 'Appealed';

  // Get all hearing dates sorted newest first
  const hearings = [...(caseData.hearings || [])].sort(
    (a, b) => new Date(b.hearing_date) - new Date(a.hearing_date)
  );
  const nextHearing = hearings.find(h => new Date(h.hearing_date) >= new Date());
  const lastHearing = hearings.find(h => new Date(h.hearing_date) < new Date());

  return (
    <div className="timeline-wrapper">
      <div className="timeline-header">
        <div className="timeline-case-id">
          <span className="timeline-label">Case No.</span>
          <strong>{caseData.case_no || caseData.case_num || 'Pending Assignment'}</strong>
        </div>
        <div className={`timeline-status-badge status-${currentStatus.replace(/\s+/g, '-').toLowerCase()}`}>
          {currentStatus}
        </div>
      </div>

      {/* Key Dates Row */}
      <div className="timeline-key-dates">
        <div className="key-date-item">
          <span className="key-date-label">📅 Filed On</span>
          <span className="key-date-value">
            {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString('en-IN') : '—'}
          </span>
        </div>
        {lastHearing && (
          <div className="key-date-item">
            <span className="key-date-label">🕐 Last Heard</span>
            <span className="key-date-value">
              {new Date(lastHearing.hearing_date).toLocaleDateString('en-IN')}
            </span>
          </div>
        )}
        {nextHearing && (
          <div className="key-date-item highlight">
            <span className="key-date-label">📌 Next Hearing</span>
            <span className="key-date-value">
              {new Date(nextHearing.hearing_date).toLocaleDateString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="timeline-track">
        {statusSteps.map((step, index) => {
          const isDone      = index < currentIndex;
          const isCurrent   = index === currentIndex;
          const isPending   = index > currentIndex;

          return (
            <div key={step.key} className={`timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'future' : ''}`}>
              {/* Connector line */}
              {index < statusSteps.length - 1 && (
                <div className={`timeline-connector ${isDone || isCurrent ? 'filled' : ''}`} />
              )}

              {/* Circle */}
              <div className="timeline-circle">
                {isDone ? '✓' : isCurrent ? step.icon : '○'}
              </div>

              {/* Label */}
              <div className="timeline-step-label">
                <span className="step-name">{step.label}</span>
                {isCurrent && (
                  <span className="step-description">{step.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Appealed badge */}
      {isAppealed && (
        <div className="timeline-appeal-notice">
          ⚠️ This case has been <strong>Appealed</strong>. A higher court will hear the matter.
        </div>
      )}

      {/* Recent Hearings */}
      {hearings.length > 0 && (
        <div className="timeline-hearings">
          <h4 className="timeline-hearings-title">Recent Hearing Remarks</h4>
          {hearings.slice(0, 3).map((h, idx) => (
            <div key={idx} className="timeline-hearing-item">
              <span className="hearing-date">
                {new Date(h.hearing_date).toLocaleDateString('en-IN')}
              </span>
              <span className={`hearing-type-badge type-${h.hearing_type?.toLowerCase()}`}>
                {h.hearing_type}
              </span>
              <span className="hearing-remarks">{h.remarks_plain_text || h.remarks || 'No remarks recorded.'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseStatusTimeline;
