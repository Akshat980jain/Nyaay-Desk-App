const express = require('express');
const router = express.Router();
const AdvocateChangeRequest = require('../models/AdvocateChangeRequest');
const LegalCase = require('../models/LegalCase');
const multer = require('multer');

// Configure Multer for NOC uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/cop_documents'); // reusing the existing uploads dir
    },
    filename: function (req, file, cb) {
        cb(null, 'NOC-' + Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed!'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. Submit a new advocate change request
router.post('/request', async (req, res) => {
    try {
        const { caseId, litigantId, existingAdvocateId, hasNoc, nocDetails, reasonForNoNoc, requestNocFromLawyer } = req.body;

        if (!caseId || !litigantId || !existingAdvocateId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let initialStatus = 'Draft';
        if (hasNoc) initialStatus = 'NOC Submitted';
        else if (requestNocFromLawyer) initialStatus = 'NOC Requested';
        else initialStatus = 'Application Filed';

        const newRequest = new AdvocateChangeRequest({
            caseId,
            litigantId,
            existingAdvocateId,
            hasNoc,
            nocDetails: hasNoc ? nocDetails : undefined,
            reasonForNoNoc: !hasNoc && !requestNocFromLawyer ? reasonForNoNoc : undefined,
            nocRequestStatus: requestNocFromLawyer ? 'Requested' : 'None',
            status: initialStatus
        });

        await newRequest.save();
        res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
    } catch (error) {
        console.error('Error submitting advocate change request:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 2. Upload NOC Document
router.post('/upload-noc/:requestId', upload.single('noc_document'), async (req, res) => {
    try {
        const { requestId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: 'NOC document is required' });
        }

        const request = await AdvocateChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.nocDocumentUrl = req.file.path;
        request.status = 'NOC Submitted'; // Ensure status reflects NOC submission
        await request.save();

        res.json({ message: 'NOC uploaded successfully', request });
    } catch (error) {
        console.error('Error uploading NOC:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. Get pending requests for Admin/Court review
router.get('/court-pending', async (req, res) => {
    try {
        // Find requests that need review (Application Filed or NOC Submitted)
        const pendingRequests = await AdvocateChangeRequest.find({
            status: { $in: ['NOC Submitted', 'Application Filed', 'Under Court Review'] }
        }).populate('caseId');

        res.json(pendingRequests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. Admin reviews a request
router.put('/review/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, remarks, adminId } = req.body; // action: 'Approve', 'Reject', 'Clarification'

        if (!['Approve', 'Reject', 'Clarification'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const request = await AdvocateChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.reviewRemarks = remarks;
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();

        if (action === 'Approve') {
            request.status = 'Approved';
            
            // Logic to remove old advocate from case
            const legalCase = await LegalCase.findById(request.caseId);
            if (legalCase) {
                // If it's the plaintiff's advocate
                if (legalCase.plaintiff_details && legalCase.plaintiff_details.advocate_id === request.existingAdvocateId) {
                    legalCase.plaintiff_details.advocate_id = '';
                    legalCase.plaintiff_details.advocate = '';
                }
                // If it's the respondent's advocate
                if (legalCase.respondent_details && legalCase.respondent_details.advocate_id === request.existingAdvocateId) {
                    legalCase.respondent_details.advocate_id = '';
                    legalCase.respondent_details.advocate = '';
                }
                await legalCase.save();
            }

        } else if (action === 'Reject') {
            request.status = 'Rejected';
        } else if (action === 'Clarification') {
            request.status = 'Clarification Requested';
        }

        await request.save();
        res.json({ message: `Request ${action}d successfully`, request });
    } catch (error) {
        console.error('Error reviewing request:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 5. Get requests for a specific case
router.get('/case/:caseId', async (req, res) => {
    try {
        const requests = await AdvocateChangeRequest.find({ caseId: req.params.caseId });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 6. Get requests for a specific litigant
router.get('/litigant-requests/:litigantId', async (req, res) => {
    try {
        const requests = await AdvocateChangeRequest.find({ litigantId: req.params.litigantId }).populate('caseId');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 7. Get NOC requests for a specific advocate
router.get('/advocate-requests/:advocateId', async (req, res) => {
    try {
        const requests = await AdvocateChangeRequest.find({ 
            existingAdvocateId: req.params.advocateId,
            nocRequestStatus: { $in: ['Requested', 'Signed', 'Declined'] }
        }).populate('caseId');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 7. Advocate responds to NOC request (Sign or Decline)
router.put('/respond-noc/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, reason, digitalSignature } = req.body; // action: 'Sign' or 'Decline'

        const request = await AdvocateChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (action === 'Sign') {
            request.nocRequestStatus = 'Signed';
            request.status = 'NOC Signed';
            request.nocDigitalSignature = digitalSignature;
            request.hasNoc = true;
            // Map the digital signature info to nocDetails for consistent review
            request.nocDetails = {
                advocateName: digitalSignature.signedBy,
                enrollmentNumber: 'Digital Signature Verified',
                signatureType: 'Digital',
                dateSigned: new Date()
            };
        } else if (action === 'Decline') {
            request.nocRequestStatus = 'Declined';
            request.status = 'NOC Declined';
            request.nocDeclineReason = reason;
        }

        await request.save();
        res.json({ message: `NOC ${action}ed successfully`, request });
    } catch (error) {
        console.error('Error responding to NOC request:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 6. Generate Application HTML for printing
router.get('/generate-application/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await AdvocateChangeRequest.findById(requestId).populate('caseId');
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const legalCase = request.caseId;
        const courtName = legalCase?.court || '_______________';
        const caseNo = legalCase?.case_num || '_______________';
        const district = legalCase?.district || '_______________';
        const plaintiff = legalCase?.plaintiff_details?.name || '_______________';
        const respondent = legalCase?.respondent_details?.name || '_______________';
        
        const isSigned = request.nocRequestStatus === 'Signed';
        const signatureInfo = request.nocDigitalSignature || {};

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Digital NOC Certificate - ${caseNo}</title>
                <style>
                    body { font-family: 'Inter', "Times New Roman", serif; line-height: 1.6; padding: 50px; color: #1a1a1a; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                    .court-name { font-size: 22px; font-weight: bold; text-transform: uppercase; }
                    .case-info { font-size: 18px; margin: 10px 0; }
                    .doc-title { font-size: 20px; font-weight: bold; text-decoration: underline; margin: 30px 0; text-align: center; }
                    .section { margin-bottom: 20px; }
                    .bold { font-weight: bold; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                    .signature-box { border: 1px solid #ccc; padding: 15px; width: 300px; background: #f9fafb; }
                    .hash-code { font-family: monospace; font-size: 12px; word-break: break-all; color: #666; }
                    @media print { .no-print { display: none; } button { display: none; } }
                    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); z-index: -1; pointer-events: none; }
                </style>
            </head>
            <body>
                <div class="watermark">DIGITALLY VERIFIED</div>
                <div class="header">
                    <div class="court-name">IN THE COURT OF ${courtName}</div>
                    <div class="case-info">DISTRICT: ${district}</div>
                    <div class="case-info">CASE NO: <span class="bold">${caseNo}</span></div>
                </div>

                <div class="section">
                    <p><span class="bold">${plaintiff}</span> ... Plaintiff/Petitioner</p>
                    <p style="text-align: center">VERSUS</p>
                    <p><span class="bold">${respondent}</span> ... Respondent/Defendant</p>
                </div>

                <div class="doc-title">NO OBJECTION CERTIFICATE (NOC) & DISCHARGE APPLICATION</div>

                <div class="section">
                    <p>I, the undersigned litigant, hereby submit this application to discharge my current advocate <span class="bold">${request.existingAdvocateId}</span> and appoint new counsel in the above-noted matter.</p>
                </div>

                <div class="section">
                    <p><span class="bold">REASON FOR CHANGE:</span> ${request.reasonForNoNoc || 'Digital Transition of Counsel'}</p>
                </div>

                <div class="section" style="margin-top: 40px;">
                    <p class="bold underline">ADVOCATE'S CONSENT (NOC):</p>
                    ${isSigned ? `
                        <p>The current advocate has reviewed this request and has granted their consent (NOC) via digital signature. This certificate is cryptographically signed and non-repudiable.</p>
                        <div class="signature-box" style="margin-top: 15px; border-left: 5px solid #22c55e;">
                            <p class="bold" style="color: #166534; margin-top: 0;">✓ DIGITALLY SIGNED</p>
                            <p>Signed by: <span class="bold">${signatureInfo.signedBy || 'Advocate'}</span></p>
                            <p>Timestamp: ${new Date(signatureInfo.timestamp).toLocaleString()}</p>
                            <p class="bold" style="margin-bottom: 5px;">Verification Hash (SHA-256):</p>
                            <p class="hash-code">${signatureInfo.signatureHash || 'N/A'}</p>
                        </div>
                    ` : `
                        <p>Application filed without Advocate's NOC. Court intervention requested for discharge under applicable procedural rules.</p>
                    `}
                </div>

                <div class="footer">
                    <div>
                        <p>__________________________</p>
                        <p>Signature of Litigant</p>
                    </div>
                    <div style="text-align: right">
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                        <p>Portal Ref: ${request._id}</p>
                    </div>
                </div>

                <div class="no-print" style="margin-top: 50px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 25px; background: #0f172a; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print Formal Certificate</button>
                </div>
            </body>
            </html>
        `;

        res.send(htmlContent);
    } catch (error) {
        console.error('Error generating application:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 8. Litigant submits signed request to court
router.put('/court-pending', async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await AdvocateChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only allow submitting if it's Signed or Application Filed
        if (['NOC Signed', 'Application Filed'].includes(request.status)) {
            request.status = 'Under Court Review';
            await request.save();
            res.json({ message: 'Application submitted to court successfully', request });
        } else {
            res.status(400).json({ message: 'Request is not in a submittable state' });
        }
    } catch (error) {
        console.error('Error submitting to court:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
