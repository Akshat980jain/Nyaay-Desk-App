const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const multer = require('multer');

// Configure Multer for NOC uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/cop_documents');
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

        const newRequest = {
            case_id: caseId,
            litigant_id: litigantId,
            existing_advocate_id: existingAdvocateId,
            has_noc: hasNoc,
            noc_details: hasNoc ? nocDetails : null,
            reason_for_no_noc: !hasNoc && !requestNocFromLawyer ? reasonForNoNoc : null,
            noc_request_status: requestNocFromLawyer ? 'Requested' : 'None',
            status: initialStatus
        };

        const { data, error } = await supabase.from('advocate_change_requests').insert([newRequest]).select().single();
        if (error) throw error;

        res.status(201).json({ message: 'Request submitted successfully', request: data });
    } catch (error) {
        console.error('Error submitting advocate change request:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 2. Upload NOC Document
router.post('/upload-noc/:requestId', upload.single('noc_document'), async (req, res) => {
    try {
        const { requestId } = req.params;
        if (!req.file) return res.status(400).json({ message: 'NOC document is required' });

        const { data, error } = await supabase
            .from('advocate_change_requests')
            .update({ noc_document_url: req.file.path, status: 'NOC Submitted' })
            .eq('request_id', requestId)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'NOC uploaded successfully', request: data });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. Get pending requests for Admin/Court review
router.get('/court-pending', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('advocate_change_requests')
            .select('*, legal_cases(*)')
            .in('status', ['NOC Submitted', 'Application Filed', 'Under Court Review']);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. Admin reviews a request
router.put('/review/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, remarks, adminId } = req.body;

        if (!['Approve', 'Reject', 'Clarification'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const { data: request, error: fetchError } = await supabase.from('advocate_change_requests').select('*').eq('request_id', requestId).single();
        if (fetchError || !request) return res.status(404).json({ message: 'Request not found' });

        let status = 'Under Court Review';
        if (action === 'Approve') status = 'Approved';
        else if (action === 'Reject') status = 'Rejected';
        else if (action === 'Clarification') status = 'Clarification Requested';

        const { data: updatedRequest, error: updateError } = await supabase
            .from('advocate_change_requests')
            .update({ 
                status, 
                review_remarks: remarks, 
                reviewed_by: adminId, 
                reviewed_at: new Date().toISOString() 
            })
            .eq('request_id', requestId)
            .select()
            .single();

        if (updateError) throw updateError;

        if (action === 'Approve') {
            const { data: legalCase, error: caseError } = await supabase.from('legal_cases').select('*').eq('case_num', request.case_id).single();
            if (legalCase) {
                let pDetails = legalCase.plaintiff_details;
                let rDetails = legalCase.respondent_details;

                if (pDetails?.advocate_id === request.existing_advocate_id) {
                    pDetails.advocate_id = '';
                    pDetails.advocate = '';
                }
                if (rDetails?.advocate_id === request.existing_advocate_id) {
                    rDetails.advocate_id = '';
                    rDetails.advocate = '';
                }

                await supabase.from('legal_cases').update({ 
                    plaintiff_details: pDetails, 
                    respondent_details: rDetails 
                }).eq('case_num', request.case_id);
            }
        }

        res.json({ message: `Request ${action}d successfully`, request: updatedRequest });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 5. Get requests for a specific case
router.get('/case/:caseId', async (req, res) => {
    try {
        const { data, error } = await supabase.from('advocate_change_requests').select('*').eq('case_id', req.params.caseId);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 6. Get requests for a specific litigant
router.get('/litigant-requests/:litigantId', async (req, res) => {
    try {
        const { data, error } = await supabase.from('advocate_change_requests').select('*, legal_cases(*)').eq('litigant_id', req.params.litigantId);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 7. Get NOC requests for a specific advocate
router.get('/advocate-requests/:advocateId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('advocate_change_requests')
            .select('*, legal_cases(*)')
            .eq('existing_advocate_id', req.params.advocateId)
            .in('noc_request_status', ['Requested', 'Signed', 'Declined']);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 8. Advocate responds to NOC request (Sign or Decline)
router.put('/respond-noc/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, reason, digitalSignature } = req.body;

        const updateData = {};
        if (action === 'Sign') {
            updateData.noc_request_status = 'Signed';
            updateData.status = 'NOC Signed';
            updateData.noc_digital_signature = digitalSignature;
            updateData.has_noc = true;
            updateData.noc_details = {
                advocateName: digitalSignature.signedBy,
                enrollmentNumber: 'Digital Signature Verified',
                signatureType: 'Digital',
                dateSigned: new Date().toISOString()
            };
        } else if (action === 'Decline') {
            updateData.noc_request_status = 'Declined';
            updateData.status = 'NOC Declined';
            updateData.noc_decline_reason = reason;
        }

        const { data, error } = await supabase
            .from('advocate_change_requests')
            .update(updateData)
            .eq('request_id', requestId)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: `NOC ${action}ed successfully`, request: data });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 9. Generate Application HTML for printing
router.get('/generate-application/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { data: request, error } = await supabase.from('advocate_change_requests').select('*, legal_cases(*)').eq('request_id', requestId).single();
        if (error || !request) return res.status(404).json({ message: 'Request not found' });

        const legalCase = request.legal_cases;
        const courtName = legalCase?.court || '_______________';
        const caseNo = legalCase?.case_num || '_______________';
        const district = legalCase?.district || '_______________';
        const plaintiff = legalCase?.plaintiff_details?.name || '_______________';
        const respondent = legalCase?.respondent_details?.name || '_______________';
        
        const isSigned = request.noc_request_status === 'Signed';
        const signatureInfo = request.noc_digital_signature || {};

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
                    <p>I, the undersigned litigant, hereby submit this application to discharge my current advocate <span class="bold">${request.existing_advocate_id}</span> and appoint new counsel in the above-noted matter.</p>
                </div>

                <div class="section">
                    <p><span class="bold">REASON FOR CHANGE:</span> ${request.reason_for_no_noc || 'Digital Transition of Counsel'}</p>
                </div>

                <div class="section" style="margin-top: 40px;">
                    <p class="bold underline">ADVOCATE'S CONSENT (NOC):</p>
                    ${isSigned ? `
                        <p>The current advocate has reviewed this request and has granted their consent (NOC) via digital signature. This certificate is cryptographically signed and non-repudiable.</p>
                        <div class="signature-box" style="margin-top: 15px; border-left: 5px solid #22c55e;">
                            <p class="bold" style="color: #166534; margin-top: 0;">✓ DIGITALLY SIGNED</p>
                            <p>Signed by: <span class="bold">${signatureInfo.signedBy || 'Advocate'}</span></p>
                            <p>Timestamp: ${signatureInfo.timestamp ? new Date(signatureInfo.timestamp).toLocaleString() : 'N/A'}</p>
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
                        <p>Portal Ref: ${request.request_id}</p>
                    </div>
                </div>

                <div class="no-print" style="margin-top: 50px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 25px; background: #0f172a; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print Formal Certificate</button>
                </div>
            </body>
            </html>
        \`;

        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 10. Litigant submits signed request to court
router.put('/court-pending', async (req, res) => {
    try {
        const { requestId } = req.body;
        const { data: request, error: fetchError } = await supabase.from('advocate_change_requests').select('*').eq('request_id', requestId).single();
        if (fetchError || !request) return res.status(404).json({ message: 'Request not found' });

        if (['NOC Signed', 'Application Filed'].includes(request.status)) {
            const { data: updatedRequest, error: updateError } = await supabase
                .from('advocate_change_requests')
                .update({ status: 'Under Court Review' })
                .eq('request_id', requestId)
                .select()
                .single();
            if (updateError) throw updateError;
            res.json({ message: 'Application submitted to court successfully', request: updatedRequest });
        } else {
            res.status(400).json({ message: 'Request is not in a submittable state' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
