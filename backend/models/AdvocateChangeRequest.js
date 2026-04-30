const mongoose = require('mongoose');

const advocateChangeRequestSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalCase', required: true },
  litigantId: { type: String, required: true }, // Using string for party_id
  existingAdvocateId: { type: String, required: true }, // Using string for advocate_id
  newAdvocateId: { type: String }, // Optional, might be selected later
  
  // NOC Details
  hasNoc: { type: Boolean, required: true },
  nocDocumentUrl: { type: String }, // Path/URL to the uploaded PDF/Image
  nocDetails: {
    advocateName: String,
    enrollmentNumber: String,
    signatureType: { type: String, enum: ['Digital', 'Manual'] },
    dateSigned: Date
  },
  
  // Without NOC Details
  reasonForNoNoc: { type: String }, // Justification

  // Application Draft
  applicationDocumentUrl: { type: String },
  
  // NOC Request to Current Lawyer
  nocRequestStatus: { 
    type: String, 
    enum: ['None', 'Requested', 'Signed', 'Declined', 'Ignored'],
    default: 'None'
  },
  nocDeclineReason: { type: String },
  nocDigitalSignature: {
    signatureId: String,
    timestamp: Date,
    certificateHash: String,
    signedBy: String // Advocate Name
  },
  
  // Workflow Status
  status: { 
    type: String, 
    enum: [
      'Draft',
      'NOC Requested',
      'NOC Signed',
      'NOC Declined',
      'NOC Submitted', 
      'Application Filed', 
      'Under Court Review', 
      'Approved', 
      'Rejected',
      'Clarification Requested'
    ],
    default: 'Draft'
  },
  
  // Review Details
  reviewRemarks: String,
  reviewedBy: { type: String }, // Admin/Court user ID
  reviewedAt: Date

}, { timestamps: true });

module.exports = mongoose.model('AdvocateChangeRequest', advocateChangeRequestSchema);
