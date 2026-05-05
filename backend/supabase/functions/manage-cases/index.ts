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

    // Get user info from token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Response("Unauthorized", { status: 401 });

    const userType = user.user_metadata?.role;
    if (userType !== "clerk" && userType !== "admin") {
      return new Response(JSON.stringify({ message: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop(); // e.g. manage-cases or subpath

    // For simplicity, we'll use the body to determine the action for POST/PATCH
    // and query params for GET
    if (req.method === "GET") {
      // List cases for clerk/admin district
      const clerkId = user.user_metadata?.clerk_id || user.user_metadata?.admin_id;
      
      // Get clerk district
      const { data: profile } = await supabase
        .from(userType === "clerk" ? "clerks" : "court_admins")
        .select("district, court_name")
        .eq(userType === "clerk" ? "clerk_id" : "admin_id", clerkId)
        .single();
      
      let query = supabase.from("legal_cases").select("*");
      
      if (userType === "clerk" && profile?.district) {
        query = query.eq("district", profile.district);
      } else if (userType === "admin" && profile?.court_name) {
        // Admin might see all in court
        query = query.eq("court", profile.court_name);
      }

      const { data: cases, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify({ cases, message: "Cases fetched successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" || req.method === "PATCH") {
      const body = await req.json();
      const { action, caseNum } = body;

      if (!caseNum) throw new Error("caseNum is required");

      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      let result;
      let dataType = "";
      let blockData = {};

      if (action === "approve") {
        const { case_approved } = body;
        const { data, error } = await adminSupabase
          .from("legal_cases")
          .update({ case_approved })
          .eq("case_num", caseNum)
          .select()
          .single();
        if (error) throw error;
        result = data;
        dataType = "case_approval";
        blockData = { case_num: caseNum, approved: case_approved };

      } else if (action === "update-status") {
        const { status, remarks } = body;
        const { data: caseData } = await adminSupabase.from("legal_cases").select("status_history").eq("case_num", caseNum).single();
        
        const newHistory = {
          status, remarks, updated_at: new Date().toISOString(), updated_by: user.id
        };
        const updatedHistory = [...(caseData?.status_history || []), newHistory];

        const { data, error } = await adminSupabase
          .from("legal_cases")
          .update({ status, status_history: updatedHistory })
          .eq("case_num", caseNum)
          .select()
          .single();
        if (error) throw error;
        result = data;
        dataType = "case_status_update";
        blockData = { case_num: caseNum, old_status: caseData?.status, new_status: status, remarks };

      } else if (action === "add-hearing") {
        const { hearing_date, hearing_type, remarks, next_hearing_date } = body;
        const { data: caseData } = await adminSupabase.from("legal_cases").select("hearings").eq("case_num", caseNum).single();
        
        const newHearing = {
          hearing_date, hearing_type, remarks, next_hearing_date, 
          added_at: new Date().toISOString(), added_by: user.id
        };
        const updatedHearings = [...(caseData?.hearings || []), newHearing];

        const { data, error } = await adminSupabase
          .from("legal_cases")
          .update({ hearings: updatedHearings })
          .eq("case_num", caseNum)
          .select()
          .single();
        if (error) throw error;
        result = data;
        dataType = "hearing_added";
        blockData = newHearing;

      } else {
        throw new Error("Invalid action");
      }

      // Trigger blockchain mining
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/mine-blockchain-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          entity_id: caseNum,
          data_type: dataType,
          user_id: user.id,
          user_type: userType,
          data: blockData
        })
      }).catch(err => console.error("Blockchain trigger failed:", err));

      return new Response(JSON.stringify({ message: "Action completed successfully", case: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
