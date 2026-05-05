import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const action = pathParts[pathParts.length - 1];

  try {
    // ── Auth: verify the caller's JWT ─────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── Resolve advocate identity ─────────────────────────────────────────────
    // Use auth_user_id (= user.id from JWT) as primary key — always reliable.
    // Falls back to email if auth_user_id not in DB (legacy migrated accounts).

    let advocate: any = null;

    // Strategy 1: auth_user_id match (fastest, always correct)
    const { data: byAuthId } = await adminSupabase
      .from("advocates")
      .select("advocate_id")
      .eq("id", user.id)
      .maybeSingle();

    advocate = byAuthId;

    // Strategy 2: email match (for migrated accounts missing auth_user_id)
    if (!advocate && user.email) {
      const { data: byEmail } = await adminSupabase
        .from("advocates")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      advocate = byEmail;
    }

    const advocateId = advocate?.advocate_id;


    // ── GET /profile ──────────────────────────────────────────────────────────
    if (action === "profile" && req.method === "GET") {
      if (!advocate) {
        return new Response(
          JSON.stringify({ message: "Advocate profile not found. Ensure you are logged in as an advocate." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ advocate }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Resolve advocate_id and district for downstream queries
    const advocateId = advocate?.advocate_id || metaAdvocateId || "";
    const district   = advocate?.district || user.user_metadata?.district || "";

    // ── GET /my-cases ─────────────────────────────────────────────────────────
    if (action === "my-cases" && req.method === "GET") {
      if (!advocateId) {
        return new Response(JSON.stringify({ cases: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: allCases, error } = await adminSupabase
        .from("legal_cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const cases = (allCases || []).filter((c: any) =>
        c.plaintiff_details?.advocate_id === advocateId ||
        c.respondent_details?.advocate_id === advocateId
      );

      return new Response(JSON.stringify({ cases }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── GET /district-cases ───────────────────────────────────────────────────
    if (action === "district-cases" && req.method === "GET") {
      if (!district) {
        return new Response(JSON.stringify({ cases: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: cases, error } = await adminSupabase
        .from("legal_cases")
        .select("*")
        .eq("district", district)
        .neq("status", "Closed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ cases: cases || [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── GET /pending-requests ─────────────────────────────────────────────────
    if (action === "pending-requests" && req.method === "GET") {
      const { data: allCases, error } = await adminSupabase
        .from("legal_cases")
        .select("case_num, court, case_type, district, plaintiff_details, respondent_details, advocate_requests");

      if (error) throw error;

      const pendingRequests = (allCases || [])
        .map((c: any) => {
          const reqs = Array.isArray(c.advocate_requests) ? c.advocate_requests : [];
          const myPending = reqs.filter(
            (r: any) => r.advocate_id === advocateId && r.status === "pending"
          );
          return {
            case_id: c.case_num,
            case_num: c.case_num,
            court: c.court,
            case_type: c.case_type,
            district: c.district,
            plaintiff: c.plaintiff_details?.name || "",
            respondent: c.respondent_details?.name || "",
            requests: myPending,
          };
        })
        .filter((r: any) => r.requests.length > 0);

      return new Response(JSON.stringify({ pendingRequests }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── GET /sent-requests ────────────────────────────────────────────────────
    if (action === "sent-requests" && req.method === "GET") {
      const { data: allCases, error } = await adminSupabase
        .from("legal_cases")
        .select("case_num, court, case_type, district, plaintiff_details, respondent_details, advocate_requests");

      if (error) throw error;

      const sentRequests: any[] = [];
      (allCases || []).forEach((c: any) => {
        const reqs = Array.isArray(c.advocate_requests) ? c.advocate_requests : [];
        reqs.forEach((r: any) => {
          if (r.advocate_id === advocateId) {
            sentRequests.push({
              case_id: c.case_num,
              case_num: c.case_num,
              court: c.court,
              case_type: c.case_type,
              district: c.district,
              plaintiff: c.plaintiff_details?.name || "",
              respondent: c.respondent_details?.name || "",
              party_type: r.party_type,
              request_status: r.status,
              requested_at: r.requested_at,
              updated_at: r.updated_at,
            });
          }
        });
      });

      return new Response(JSON.stringify({ sentRequests }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── POST /join-case ───────────────────────────────────────────────────────
    if (action === "join-case" && req.method === "POST") {
      const body = await req.json();
      const { caseNum, partyType } = body;

      const { data: caseData, error: fetchErr } = await adminSupabase
        .from("legal_cases")
        .select("advocate_requests")
        .eq("case_num", caseNum)
        .single();

      if (fetchErr) throw fetchErr;

      const existing = Array.isArray(caseData?.advocate_requests) ? caseData.advocate_requests : [];
      const newRequest = {
        advocate_id: advocateId,
        party_type: partyType,
        status: "pending",
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await adminSupabase
        .from("legal_cases")
        .update({ advocate_requests: [...existing, newRequest] })
        .eq("case_num", caseNum);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ message: "Join request sent successfully" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── PUT /handle-request ───────────────────────────────────────────────────
    if (action === "handle-request" && req.method === "PUT") {
      const body = await req.json();
      const { caseNum, requestId, status: newStatus } = body;

      const { data: caseData, error: fetchErr } = await adminSupabase
        .from("legal_cases")
        .select("*")
        .eq("case_num", caseNum)
        .single();

      if (fetchErr) throw fetchErr;

      const reqs = Array.isArray(caseData?.advocate_requests) ? caseData.advocate_requests : [];
      const updatedRequests = reqs.map((r: any) => {
        if (r.advocate_id === advocateId &&
            (r._id === requestId || r.request_id === requestId || r.requested_at === requestId)) {
          return { ...r, status: newStatus, updated_at: new Date().toISOString() };
        }
        return r;
      });

      let updatePayload: any = { advocate_requests: updatedRequests };

      if (newStatus === "approved") {
        const approvedReq = reqs.find(
          (r: any) => r.advocate_id === advocateId &&
            (r._id === requestId || r.request_id === requestId || r.requested_at === requestId)
        );
        if (approvedReq) {
          const advName = advocate?.name || "";
          if (approvedReq.party_type === "plaintiff") {
            updatePayload.plaintiff_details = { ...caseData.plaintiff_details, advocate_id: advocateId, advocate: advName };
          } else {
            updatePayload.respondent_details = { ...caseData.respondent_details, advocate_id: advocateId, advocate: advName };
          }
        }
      }

      const { error: updateErr } = await adminSupabase
        .from("legal_cases")
        .update(updatePayload)
        .eq("case_num", caseNum);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ message: `Request ${newStatus} successfully` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── GET /my-document-requests ─────────────────────────────────────────────
    if (action === "my-document-requests" && req.method === "GET") {
      try {
        const { data: requests, error } = await adminSupabase
          .from("document_requests")
          .select("*")
          .eq("advocate_id", advocateId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("document_requests query failed (table may not exist):", error.message);
          return new Response(JSON.stringify({ requests: [] }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ requests: requests || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch {
        return new Response(JSON.stringify({ requests: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── GET /hearings?caseNum=<> ──────────────────────────────────────────────
    if (action === "hearings" && req.method === "GET") {
      const caseNum = url.searchParams.get("caseNum");
      if (!caseNum) throw new Error("caseNum query param required");

      const { data: caseData, error } = await adminSupabase
        .from("legal_cases")
        .select("hearings, case_num, court, district")
        .eq("case_num", caseNum)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ hearings: caseData?.hearings || [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── GET /case-documents?caseNum=<> ───────────────────────────────────────
    if (action === "case-documents" && req.method === "GET") {
      const caseNum = url.searchParams.get("caseNum");
      if (!caseNum) throw new Error("caseNum query param required");

      const { data: caseData, error } = await adminSupabase
        .from("legal_cases")
        .select("documents, case_num")
        .eq("case_num", caseNum)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ documents: caseData?.documents || [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── GET /video-meeting?caseNum=<> ─────────────────────────────────────────
    if (action === "video-meeting" && req.method === "GET") {
      const caseNum = url.searchParams.get("caseNum");
      if (!caseNum) throw new Error("caseNum query param required");

      const { data: caseData, error } = await adminSupabase
        .from("legal_cases")
        .select("video_meeting, case_num")
        .eq("case_num", caseNum)
        .single();

      if (error) throw error;

      const meeting = caseData?.video_meeting;
      if (!meeting || !meeting.meeting_link) {
        return new Response(JSON.stringify({ message: "No meeting scheduled" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ meeting }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ message: "Route not found", action }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("advocate-portal error:", error);
    return new Response(JSON.stringify({ message: error?.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
