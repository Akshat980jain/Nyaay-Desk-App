import React from 'react';
import './Popup.css';

const Popup = ({ isOpen, message, type, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-popup-overlay">
      <div className={`custom-popup-box ${type}`}>
        <div className="custom-popup-icon">
          {type === 'success' ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="custom-popup-content">
          <p>{message}</p>
          <button onClick={onClose} className="custom-popup-btn">OK</button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
