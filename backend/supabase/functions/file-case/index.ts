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

    const userType = user.user_metadata?.role; // litigant or advocate
    const body = await req.json();

    const {
      court,
      case_type,
      plaintiff_details,
      respondent_details,
      police_station_details,
      lower_court_details,
      main_matter_details,
      hearings,
      status,
      case_approved,
      representing_party // only for advocate
    } = body;

    if (!court || !case_type || !plaintiff_details || !respondent_details) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let district = "";
    let finalPlaintiffDetails = { ...plaintiff_details };
    let finalRespondentDetails = { ...respondent_details };

    if (userType === "litigant") {
      // Litigant filing
      const partyId = user.user_metadata?.party_id;
      const { data: litigant, error: litigantError } = await supabase
        .from("litigants")
        .select("*")
        .eq("litigant_id", partyId)
        .single();
      
      if (litigantError || !litigant) throw new Error("Litigant profile not found");
      district = litigant.address?.district || litigant.district;
      
    } else if (userType === "advocate") {
      // Advocate filing
      const advocateId = user.user_metadata?.advocate_id;
      if (!representing_party) throw new Error("Representing party is required for advocate filing");

      const { data: advocate, error: advocateError } = await supabase
        .from("advocates")
        .select("*")
        .eq("advocate_id", advocateId)
        .single();
      
      if (advocateError || !advocate) throw new Error("Advocate profile not found");
      district = advocate.district;

      if (representing_party === "plaintiff") {
        finalPlaintiffDetails.advocate_id = advocate.advocate_id;
        finalPlaintiffDetails.advocate = advocate.name;
      } else {
        finalRespondentDetails.advocate_id = advocate.advocate_id;
        finalRespondentDetails.advocate = advocate.name;
      }
    } else {
      throw new Error("Invalid user role for filing case");
    }

    const cnrNumber = "CNR" + Date.now() + Math.floor(Math.random() * 1000);
    const newCase = {
      case_num: cnrNumber,
      case_no: cnrNumber,
      court,
      case_type,
      district,
      plaintiff_details: finalPlaintiffDetails,
      respondent_details: finalRespondentDetails,
      police_station_details,
      lower_court_details,
      main_matter_details,
      hearings: hearings || [],
      status: status || "Filed",
      case_approved: case_approved || false,
      created_at: new Date().toISOString()
    };

    const { data: savedCase, error: insertError } = await supabase
      .from("legal_cases")
      .insert([newCase])
      .select()
      .single();

    if (insertError) throw insertError;

    // Trigger blockchain mining (Async call)
    // We don't wait for it to complete to return response quickly
    // But we use the service role client for this to bypass RLS if needed
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Call the mine-blockchain-block function
    // Note: In a real production app, you might use a DB webhook or a queue
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/mine-blockchain-block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        entity_id: cnrNumber,
        data_type: 'CASE_FILING',
        user_id: user.id,
        user_type: userType,
        data: savedCase
      })
    }).catch(err => console.error("Blockchain trigger failed:", err));

    return new Response(JSON.stringify({ 
      message: "Case filed successfully", 
      case: savedCase, 
      case_num: cnrNumber,
      blockchain: { queued: true }
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Filing error:", error);
    return new Response(JSON.stringify({ message: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
