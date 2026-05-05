import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Resolve role from user_metadata ─────────────────────────────────────
    // The login-user function sets user_role; some paths may set role directly
    const userType = user.user_metadata?.user_role || user.user_metadata?.role;

    // ── Parse action: from URL path segment OR from POST body ────────────────
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const urlAction = pathParts[pathParts.length - 1]; // e.g. "get-noc-requests"

    let body: any = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { body = {}; }
    }

    // action can come from URL path or POST body
    const action = (urlAction !== "advocate-change" ? urlAction : null) || body.action;

    // ── GET /advocate-change/get-noc-requests?advocateId=<> ──────────────────
    // Returns NOC requests where this advocate is the existing advocate
    if (action === "get-noc-requests") {
      // Identify advocate by auth_user_id or email (same as advocate-portal pattern)
      let advocateId = url.searchParams.get("advocateId") || body.advocateId;

      // If not provided as param, resolve from DB
      if (!advocateId) {
        const { data: adv } = await adminSupabase
          .from("advocates")
          .select("advocate_id")
          .eq("id", user.id)
          .maybeSingle();
        advocateId = adv?.advocate_id;
      }
      if (!advocateId && user.email) {
        const { data: adv } = await adminSupabase
          .from("advocates")
          .select("advocate_id")
          .eq("email", user.email)
          .maybeSingle();
        advocateId = adv?.advocate_id;
      }

      if (!advocateId) {
        return new Response(JSON.stringify([]), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: requests, error } = await adminSupabase
        .from("advocate_change_requests")
        .select("*")
        .eq("existing_advocate_id", advocateId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(requests || []), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "request") {
      // Litigant requests advocate change
      let isLitigant = userType === "litigant";
      if (!isLitigant) {
        const { data: litCheck } = await adminSupabase.from("litigants").select("litigant_id").eq("id", user.id).maybeSingle();
        if (litCheck) isLitigant = true;
      }
      if (!isLitigant) throw new Error("Only litigants can request advocate change");
      const { caseId, existingAdvocateId, hasNoc, nocDetails, reasonForNoNoc, requestNocFromLawyer } = body;

      let initialStatus = "Draft";
      if (hasNoc) initialStatus = "NOC Submitted";
      else if (requestNocFromLawyer) initialStatus = "NOC Requested";
      else initialStatus = "Application Filed";

      const requestId = crypto.randomUUID();
      const newRequest = {
        request_id: requestId,
        case_id: caseId,
        litigant_id: user.user_metadata?.party_id || user.user_metadata?.litigant_id || body.litigantId,
        existing_advocate_id: existingAdvocateId,
        has_noc: hasNoc,
        noc_details: hasNoc ? nocDetails : null,
        reason_for_no_noc: !hasNoc && !requestNocFromLawyer ? reasonForNoNoc : null,
        noc_request_status: requestNocFromLawyer ? "Requested" : "None",
        status: initialStatus,
        created_at: new Date().toISOString()
      };

      const { data, error } = await adminSupabase.from("advocate_change_requests").insert([newRequest]).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ message: "Request submitted successfully", request: data }), {
        status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "respond-noc") {
      // Advocate responds to NOC request
      if (userType !== "advocate") throw new Error("Only advocates can respond to NOC requests");
      const { requestId, responseAction, reason, digitalSignature } = body;

      const updateData: any = {};
      if (responseAction === "Sign") {
        updateData.noc_request_status = "Signed";
        updateData.status = "NOC Signed";
        updateData.noc_digital_signature = digitalSignature;
        updateData.has_noc = true;
        updateData.noc_details = {
          advocateName: digitalSignature.signedBy,
          enrollmentNumber: "Digital Signature Verified",
          signatureType: "Digital",
          dateSigned: new Date().toISOString()
        };
      } else if (responseAction === "Decline") {
        updateData.noc_request_status = "Declined";
        updateData.status = "NOC Declined";
        updateData.noc_decline_reason = reason;
      } else {
        throw new Error("Invalid response action");
      }

      // Resolve advocate identity properly
      let advocateId = user.user_metadata?.advocate_id || user.user_metadata?.id;
      if (!advocateId) {
        const { data: adv } = await adminSupabase
          .from("advocates")
          .select("advocate_id")
          .eq("id", user.id)
          .maybeSingle();
        advocateId = adv?.advocate_id;
      }

      const { data, error } = await adminSupabase
        .from("advocate_change_requests")
        .update(updateData)
        .eq("request_id", requestId)
        .eq("existing_advocate_id", advocateId)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Request not found or you are not authorized to respond to it");
      return new Response(JSON.stringify({ message: `NOC ${responseAction}ed successfully`, request: data }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "review") {
      // Admin/Clerk reviews request
      let isAuthorized = userType === "admin" || userType === "clerk";
      // Fallback: check admin/clerk tables if role not in metadata
      if (!isAuthorized) {
        const { data: adminCheck } = await adminSupabase.from("court_admins").select("admin_id").eq("id", user.id).maybeSingle();
        if (adminCheck) isAuthorized = true;
      }
      if (!isAuthorized) {
        const { data: clerkCheck } = await adminSupabase.from("clerks").select("clerk_id").eq("id", user.id).maybeSingle();
        if (clerkCheck) isAuthorized = true;
      }
      if (!isAuthorized) throw new Error("Access denied");
      const { requestId, reviewAction, remarks } = body;

      const { data: request, error: fetchError } = await adminSupabase
        .from("advocate_change_requests")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();
      
      if (fetchError || !request) throw new Error("Request not found");

      let status = "Under Court Review";
      if (reviewAction === "Approve") status = "Approved";
      else if (reviewAction === "Reject") status = "Rejected";
      else if (reviewAction === "Clarification") status = "Clarification Requested";

      const { data: updatedRequest, error: updateError } = await adminSupabase
        .from("advocate_change_requests")
        .update({ 
          status, 
          review_remarks: remarks, 
          reviewed_by: user.id, 
          reviewed_at: new Date().toISOString() 
        })
        .eq("request_id", requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      // If approved, update the legal_case automatically
      if (reviewAction === "Approve") {
        const { data: legalCase } = await adminSupabase.from("legal_cases").select("*").eq("case_num", request.case_id).single();
        if (legalCase) {
          let pDetails = legalCase.plaintiff_details;
          let rDetails = legalCase.respondent_details;

          if (pDetails?.advocate_id === request.existing_advocate_id) {
            pDetails.advocate_id = "";
            pDetails.advocate = "";
          }
          if (rDetails?.advocate_id === request.existing_advocate_id) {
            rDetails.advocate_id = "";
            rDetails.advocate = "";
          }

          await adminSupabase.from("legal_cases").update({ 
            plaintiff_details: pDetails, 
            respondent_details: rDetails 
          }).eq("case_num", request.case_id);
        }
      }

      return new Response(JSON.stringify({ message: `Request ${reviewAction}d successfully`, request: updatedRequest }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "generate-application") {
      // Generate Application data/HTML
      const requestId = url.searchParams.get("requestId") || body.requestId;
      
      const { data: request, error: fetchError } = await adminSupabase
        .from("advocate_change_requests")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();

      if (!request) throw new Error("Request not found");

      // Fetch legal case separately (no FK join needed)
      let legalCase: any = null;
      if (request.case_id) {
        const { data: caseData } = await adminSupabase
          .from("legal_cases")
          .select("*")
          .eq("case_num", request.case_id)
          .maybeSingle();
        legalCase = caseData;
      }
      const courtName = legalCase?.court || "_______________";
      const caseNo = legalCase?.case_num || request.case_id || "_______________";
      const district = legalCase?.district || "_______________";
      const plaintiff = legalCase?.plaintiff_details?.name || "_______________";
      const respondent = legalCase?.respondent_details?.name || "_______________";
      const isSigned = request.noc_request_status === "Signed";
      const signatureInfo = request.noc_digital_signature || {};
      const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      const caseType = legalCase?.case_type || "Civil";
      const filingYear = legalCase?.created_at ? new Date(legalCase.created_at).getFullYear() : new Date().getFullYear();

      // Resolve litigant name from litigants table
      let litigantName = "_______________";
      if (request.litigant_id) {
        const { data: litigant } = await adminSupabase
          .from("litigants")
          .select("name")
          .eq("litigant_id", request.litigant_id)
          .maybeSingle();
        litigantName = litigant?.name || request.litigant_id;
      }
      // Fallback: check if litigant is plaintiff or respondent
      if (litigantName === request.litigant_id || litigantName === "_______________") {
        if (legalCase?.plaintiff_details?.party_id === request.litigant_id) {
          litigantName = plaintiff;
        } else if (legalCase?.respondent_details?.party_id === request.litigant_id) {
          litigantName = respondent;
        }
      }

      // Resolve advocate name from advocates table
      let advocateName = "_______________";
      if (request.existing_advocate_id) {
        const { data: advocate } = await adminSupabase
          .from("advocates")
          .select("name")
          .eq("advocate_id", request.existing_advocate_id)
          .maybeSingle();
        advocateName = advocate?.name || request.existing_advocate_id;
      }
      // Also check legal case for advocate name
      if (advocateName === request.existing_advocate_id) {
        if (legalCase?.plaintiff_details?.advocate_id === request.existing_advocate_id && legalCase?.plaintiff_details?.advocate) {
          advocateName = legalCase.plaintiff_details.advocate;
        } else if (legalCase?.respondent_details?.advocate_id === request.existing_advocate_id && legalCase?.respondent_details?.advocate) {
          advocateName = legalCase.respondent_details.advocate;
        }
      }

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Application for Change of Advocate – ${caseNo}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Serif', 'Times New Roman', Georgia, serif; font-size: 14px; line-height: 1.8; color: #1a1a1a; background: #fff; }
        .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 25mm 25mm 30mm; position: relative; }
        @media screen { .page { box-shadow: 0 0 20px rgba(0,0,0,0.15); margin: 20px auto; } }

        /* Emblem & Header */
        .emblem { text-align: center; margin-bottom: 5px; }
        .emblem img { width: 60px; height: auto; }
        .emblem-text { font-size: 11px; text-align: center; letter-spacing: 2px; color: #333; margin-bottom: 2px; }
        .header-hindi { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 2px; }
        .header-eng { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 3px; }
        .header-sub { text-align: center; font-size: 13px; margin-bottom: 15px; color: #444; }
        
        /* Form Header */
        .form-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 15px; border: 1px solid #ccc; padding: 8px 12px; background: #fafafa; }
        .form-header div { line-height: 1.5; }

        /* Case Title Block */
        .case-block { border: 2px solid #000; padding: 15px 20px; margin: 15px 0; }
        .case-title { text-align: center; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; text-decoration: underline; }
        .party-row { display: flex; justify-content: space-between; align-items: center; margin: 6px 0; }
        .party-name { font-weight: bold; font-size: 14px; }
        .party-label { font-size: 12px; color: #555; font-style: italic; }
        .versus { text-align: center; font-weight: bold; font-size: 16px; margin: 8px 0; letter-spacing: 3px; }

        /* Document Title */
        .doc-title { text-align: center; margin: 20px 0 15px; font-size: 16px; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 1px; }
        .doc-subtitle { text-align: center; font-size: 12px; color: #555; margin-bottom: 20px; }

        /* Sections */
        .section { margin-bottom: 16px; }
        .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 3px; margin-bottom: 8px; letter-spacing: 0.5px; }
        .section p { text-align: justify; margin-bottom: 8px; text-indent: 30px; }
        .section p.no-indent { text-indent: 0; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }

        /* Details Table */
        .details-table { width: 100%; border-collapse: collapse; margin: 10px 0 15px; font-size: 13px; }
        .details-table td { padding: 6px 10px; border: 1px solid #bbb; vertical-align: top; }
        .details-table td:first-child { width: 35%; font-weight: bold; background: #f5f5f0; }

        /* Digital Signature Block */
        .sig-block { border: 2px solid #166534; border-radius: 4px; padding: 15px; margin: 15px 0; background: #f0fdf4; }
        .sig-block-title { font-weight: bold; color: #166534; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .sig-block table { width: 100%; font-size: 12px; }
        .sig-block td { padding: 3px 0; }
        .sig-block td:first-child { width: 160px; font-weight: bold; color: #333; }
        .hash { font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all; color: #555; background: #e8e8e0; padding: 4px 6px; display: block; margin-top: 3px; }

        .no-noc-block { border: 2px solid #b91c1c; border-radius: 4px; padding: 15px; margin: 15px 0; background: #fef2f2; }
        .no-noc-title { font-weight: bold; color: #b91c1c; font-size: 14px; margin-bottom: 8px; }

        /* Prayer */
        .prayer { margin: 20px 0; padding: 12px 15px; border-left: 4px solid #1e3a5f; background: #f8f9fc; }
        .prayer p { text-indent: 0; }

        /* Footer / Signatures */
        .sig-area { display: flex; justify-content: space-between; margin-top: 40px; }
        .sig-col { width: 45%; }
        .sig-line { border-bottom: 1px solid #000; margin-bottom: 4px; height: 40px; }
        .sig-label { font-size: 12px; color: #333; }

        /* Office Use */
        .office-use { border: 1px dashed #999; padding: 15px; margin-top: 30px; background: #fffef5; }
        .office-title { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; color: #666; }
        .stamp-area { display: flex; justify-content: space-between; margin-top: 15px; }
        .stamp-box { width: 120px; height: 80px; border: 1px dashed #aaa; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #aaa; }

        /* Print */
        .no-print { margin-top: 30px; text-align: center; }
        .print-btn { padding: 12px 35px; background: #1e3a5f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: inherit; letter-spacing: 0.5px; }
        .print-btn:hover { background: #15294a; }
        @media print {
            .no-print { display: none !important; }
            .page { box-shadow: none; margin: 0; padding: 15mm 20mm 20mm 25mm; }
            body { background: #fff; }
        }

        /* Watermark */
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 70px; color: rgba(0,0,0,0.04); z-index: -1; pointer-events: none; font-weight: bold; letter-spacing: 8px; white-space: nowrap; }
    </style>
</head>
<body>
    <div class="watermark">NYAAY DESK PORTAL</div>
    <div class="page">
        <!-- Emblem -->
        <div class="emblem">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="55" height="55" style="display:block;margin:0 auto">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                <text x="50" y="38" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a1a1a" font-family="serif">⚖</text>
                <text x="50" y="56" text-anchor="middle" font-size="7" font-weight="bold" fill="#1a1a1a" font-family="serif">DISTRICT</text>
                <text x="50" y="66" text-anchor="middle" font-size="7" font-weight="bold" fill="#1a1a1a" font-family="serif">COURT</text>
                <text x="50" y="82" text-anchor="middle" font-size="5.5" fill="#1a1a1a" font-family="serif">सत्यमेव जयते</text>
            </svg>
        </div>
        <div class="emblem-text">सत्यमेव जयते</div>
        <div class="header-hindi">जिला न्यायालय – ${district}</div>
        <div class="header-eng">In the Court of ${courtName}</div>
        <div class="header-sub">District: ${district} | Established under the Code of Civil Procedure, 1908 & Advocates Act, 1961</div>

        <!-- Form Info -->
        <div class="form-header">
            <div><strong>Form Type:</strong> Application u/s Order III Rule 4, CPC<br><strong>Category:</strong> Change / Discharge of Advocate</div>
            <div style="text-align:right"><strong>Date:</strong> ${todayDate}<br><strong>Ref No:</strong> NOC/${caseNo}/${filingYear}</div>
        </div>

        <!-- Case Block -->
        <div class="case-block">
            <div class="case-title">${caseType} Case No. ${caseNo} of ${filingYear}</div>
            <div class="party-row">
                <span class="party-name">${plaintiff}</span>
                <span class="party-label">... Plaintiff / Petitioner</span>
            </div>
            <div class="versus">— VERSUS —</div>
            <div class="party-row">
                <span class="party-name">${respondent}</span>
                <span class="party-label">... Defendant / Respondent</span>
            </div>
        </div>

        <!-- Title -->
        <div class="doc-title">Application for Change of Advocate<br>& No Objection Certificate (NOC)</div>
        <div class="doc-subtitle">(Filed under Order III Rule 4 of the Code of Civil Procedure, 1908 read with<br>Section 30 of the Advocates Act, 1961)</div>

        <!-- Application Body -->
        <div class="section">
            <div class="section-title">1. Particulars of the Application</div>
            <table class="details-table">
                <tr><td>Name of the Litigant / Applicant</td><td>${litigantName}</td></tr>
                <tr><td>Case Number</td><td>${caseNo}</td></tr>
                <tr><td>Name of the Current Advocate</td><td>${advocateName} (${request.existing_advocate_id || ""})</td></tr>
                <tr><td>Status of the NOC</td><td>${request.noc_request_status || "Pending"}</td></tr>
                <tr><td>Date of Filing</td><td>${request.created_at ? new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : todayDate}</td></tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">2. Grounds for Change of Advocate</div>
            <p>That the applicant, <strong>${litigantName}</strong>, is a party to the above-titled case and has been represented by <strong>${advocateName}</strong>. The applicant, in exercise of their lawful right under the Advocates Act, 1961, hereby seeks to discharge the said advocate and engage new counsel for the further conduct of the case.</p>
            <p><span class="bold">Reason stated:</span> ${request.reason_for_no_noc || request.reason || "The litigant wishes to engage alternative legal representation in the interest of their case."}</p>
        </div>

        <div class="section">
            <div class="section-title">3. Advocate's Consent / No Objection Certificate</div>
            ${isSigned ? `
            <div class="sig-block">
                <div class="sig-block-title">✓ NO OBJECTION CERTIFICATE – DIGITALLY SIGNED</div>
                <p style="margin-bottom:10px;text-indent:0;font-size:13px;">I, the undersigned advocate, do hereby certify that I have no objection to the discharge of my Vakalatnama / engagement in the above-mentioned matter. I confirm that all dues and papers have been settled, and I consent to the appointment of any new advocate by the litigant.</p>
                <table>
                    <tr><td>Signed By</td><td>: ${signatureInfo.signedBy || "Advocate (Digitally Verified)"}</td></tr>
                    <tr><td>Signature Method</td><td>: SHA-256 Digital Signature</td></tr>
                    <tr><td>Date & Time</td><td>: ${signatureInfo.timestamp ? new Date(signatureInfo.timestamp).toLocaleString('en-IN') : "N/A"}</td></tr>
                    <tr><td>Verification Status</td><td>: <span style="color:#166534;font-weight:bold;">✓ VERIFIED – NON-REPUDIABLE</span></td></tr>
                    <tr><td colspan="2"><strong>Signature Hash (SHA-256):</strong><span class="hash">${signatureInfo.signatureHash || "N/A"}</span></td></tr>
                </table>
            </div>
            ` : `
            <div class="no-noc-block">
                <div class="no-noc-title">⚠ NOC NOT OBTAINED</div>
                <p style="text-indent:0;font-size:13px;">The applicant has been unable to obtain a No Objection Certificate from the current advocate. In accordance with the provisions of Order III Rule 4, CPC, and the settled law laid down by the Hon'ble Supreme Court of India, the applicant prays that the Court may be pleased to permit the change of advocate without the NOC, upon being satisfied of the bona fides of the request.</p>
                <p style="text-indent:0;font-size:13px;margin-top:8px;"><strong>Reason for non-availability:</strong> ${request.reason_for_no_noc || "Not specified."}</p>
            </div>
            `}
        </div>

        <!-- Prayer -->
        <div class="section">
            <div class="section-title">4. Prayer</div>
            <div class="prayer">
                <p>In view of the facts and circumstances stated above, the applicant most humbly and respectfully prays before this Hon'ble Court that:</p>
                <p style="margin-top:8px;"><strong>(a)</strong> The current advocate, <strong>${advocateName}</strong>, be discharged from the case;</p>
                <p><strong>(b)</strong> The applicant be permitted to engage a new advocate of their choice for further proceedings;</p>
                <p><strong>(c)</strong> Any other or further relief(s) as this Hon'ble Court may deem fit and proper in the interest of justice be granted.</p>
            </div>
        </div>

        <!-- Verification -->
        <div class="section">
            <div class="section-title">5. Verification</div>
            <p>I, the applicant in the above-titled case, do hereby solemnly verify that the contents of the above application are true and correct to the best of my knowledge, belief and information. No part of it is false, and nothing material has been concealed therefrom.</p>
            <p class="no-indent" style="margin-top:10px;"><strong>Verified at:</strong> ${district} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Date:</strong> ${todayDate}</p>
        </div>

        <!-- Signatures -->
        <div class="sig-area">
            <div class="sig-col">
                <div class="sig-line"></div>
                <div class="sig-label"><strong>Signature / Thumb Impression</strong><br>of the Applicant (Litigant)</div>
            </div>
            <div class="sig-col" style="text-align:right;">
                <div class="sig-line"></div>
                <div class="sig-label"><strong>Advocate (if any)</strong><br>New Counsel / Appearing</div>
            </div>
        </div>

        <!-- Office Use -->
        <div class="office-use">
            <div class="office-title">For Court Use Only</div>
            <table class="details-table" style="font-size:12px;">
                <tr><td>Received on</td><td></td></tr>
                <tr><td>Order / Remarks</td><td></td></tr>
                <tr><td>Presiding Officer</td><td></td></tr>
            </table>
            <div class="stamp-area">
                <div class="stamp-box">Court Seal</div>
                <div style="font-size:11px;color:#666;text-align:right;">
                    <p>Portal Ref: ${request.request_id || request.id}</p>
                    <p>Generated via: NyaayDesk Digital Portal</p>
                    <p>This is a computer-generated document.</p>
                </div>
            </div>
        </div>

        <!-- Print Button -->
        <div class="no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>
    </div>
</body>
</html>`;

      // We can return a blob URL if we were using a real browser, but here we return a JSON with the HTML
      // and a flag to the frontend to render it.
      return new Response(JSON.stringify({ html: htmlContent, url: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "court-pending") {
      // Litigant submits signed/filed request to court
      const { requestId } = body;
      const { data: request, error: fetchError } = await adminSupabase
        .from("advocate_change_requests")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();
      if (fetchError || !request) throw new Error("Request not found");

      if (["NOC Signed", "Application Filed"].includes(request.status)) {
        const { data: updatedRequest, error: updateError } = await adminSupabase
          .from("advocate_change_requests")
          .update({ status: "Under Court Review" })
          .eq("request_id", requestId)
          .select()
          .single();
        if (updateError) throw updateError;
        return new Response(JSON.stringify({ message: "Application submitted to court successfully", request: updatedRequest }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else if (request.status === "Under Court Review" || request.status === "Approved") {
        return new Response(JSON.stringify({ message: "Application is already submitted to court", request }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ message: "Request is not in a submittable state. Current status: " + request.status }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

    } else {
      throw new Error("Invalid action");
    }

  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
