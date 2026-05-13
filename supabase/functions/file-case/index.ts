/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generate a unique case number, e.g. CIV2026-84731
function generateCaseNumber(caseType: string): string {
  const prefix = (caseType || "CS")
    .replace(/[^A-Z]/gi, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${rand}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Look up the litigant record to get their party_id ───────────────
    // We look up by email first, then by auth user id if needed
    let litigantRecord: Record<string, string> | null = null;

    const { data: litigantByEmail } = await supabase
      .from("litigants")
      .select("litigant_id, name, email, phone")
      .eq("email", user.email ?? "")
      .maybeSingle();

    if (litigantByEmail) {
      litigantRecord = litigantByEmail;
    } else {
      // Try user_metadata for litigant_id stored at registration
      const metaId = user.user_metadata?.litigant_id || user.user_metadata?.party_id;
      if (metaId) {
        const { data: litigantById } = await supabase
          .from("litigants")
          .select("litigant_id, name, email, phone")
          .eq("litigant_id", metaId)
          .maybeSingle();
        litigantRecord = litigantById ?? null;
      }
    }

    // ── Parse Body ───────────────────────────────────────────────────────
    const body = await req.json();

    let {
      court,
      case_type,
      plaintiff_details,
      respondent_details,
      police_station_details,
      lower_court_details,
      main_matter_details,
    } = body;

    // Basic validation
    if (!case_type) {
      return new Response(
        JSON.stringify({ error: "case_type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!plaintiff_details?.name) {
      return new Response(
        JSON.stringify({ error: "Plaintiff name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!respondent_details?.name) {
      return new Response(
        JSON.stringify({ error: "Respondent name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CRITICAL: Inject litigant's party_id & email into plaintiff_details
    // This ensures the case is always linked to the filing litigant,
    // regardless of whether the frontend form filled these fields.
    if (litigantRecord) {
      plaintiff_details = {
        ...plaintiff_details,
        party_id: litigantRecord.litigant_id,          // Always overwrite with real ID
        email: plaintiff_details?.email || litigantRecord.email, // Keep form email, fallback to profile
      };
    }

    // Also stamp the litigant's email on plaintiff if still missing
    if (!plaintiff_details.email && user.email) {
      plaintiff_details = { ...plaintiff_details, email: user.email };
    }
    if (!plaintiff_details.party_id) {
      // Last resort: use auth user id as party_id
      plaintiff_details = { ...plaintiff_details, party_id: user.id };
    }

    // ── Extract district (NOT NULL column) ──────────────────────────────
    const district: string =
      plaintiff_details?.district ||
      plaintiff_details?.address?.district ||
      "Unknown";

    // ── Generate unique Case Number ──────────────────────────────────────
    let caseNum = generateCaseNumber(case_type);

    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("legal_cases")
        .select("case_num")
        .eq("case_num", caseNum)
        .maybeSingle();
      if (!existing) break;
      caseNum = generateCaseNumber(case_type);
    }

    // ── Build insert payload ─────────────────────────────────────────────
    const criminalTypes = [
      "Criminal", "MAGISTRIAL CASES", "MISC. CRIM APLN",
      "SESSIONS CASES", "CRIM APPEAL",
    ];

    const caseRecord: Record<string, unknown> = {
      case_num: caseNum,
      court: court || "District & Sessions Court",
      case_type,
      district,
      plaintiff_details,
      respondent_details: respondent_details ?? {},
      lower_court_details: lower_court_details ?? {},
      main_matter_details: main_matter_details ?? {},
      hearings: [],
      documents: [],
      status: "Filed",
      case_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (criminalTypes.includes(case_type) && police_station_details) {
      caseRecord.police_station_details = police_station_details;
    }

    // ── Insert ────────────────────────────────────────────────────────────
    const { data: insertedCase, error: insertError } = await supabase
      .from("legal_cases")
      .insert([caseRecord])
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", JSON.stringify(insertError));
      return new Response(
        JSON.stringify({ error: insertError.message || "Failed to insert case", details: insertError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Case filed: ${caseNum} by litigant: ${plaintiff_details.party_id}`);

    return new Response(
      JSON.stringify({ message: "Case filed successfully", case_num: caseNum, case: insertedCase }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Uncaught error in file-case:", (error as any).message);
    return new Response(
      JSON.stringify({ error: (error as any).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
