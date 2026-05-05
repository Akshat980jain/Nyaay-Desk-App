// Supabase Edge Function: register-user
// Handles registration for all user types: litigant, advocate, clerk, admin
// Deploy: supabase functions deploy register-user

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { user_type, email, password, ...profileData } = body;

    if (!user_type || !email || !password) {
      return new Response(JSON.stringify({ error: "user_type, email and password are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const validRoles = ["litigant", "advocate", "clerk", "admin"];
    if (!validRoles.includes(user_type)) {
      return new Response(JSON.stringify({ error: "Invalid user_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Will send OTP for confirmation
      user_metadata: { user_role: user_type, ...profileData },
    });

    if (authError) throw authError;

    const authUserId = authData.user.id;

    // 2. Insert into the appropriate profile table
    const tableMap: Record<string, string> = {
      litigant: "litigants",
      advocate: "advocates",
      clerk: "clerks",
      admin: "court_admins",
    };

    const table = tableMap[user_type];
    const idField: Record<string, string> = {
      litigant: "litigant_id",
      advocate: "advocate_id",
      clerk: "clerk_id",
      admin: "admin_id",
    };

    const prefixMap: Record<string, string> = {
      litigant: "LIT",
      advocate: "ADV",
      clerk: "CLK",
      admin: "ADM",
    };

    const generatedId = `${prefixMap[user_type]}-${Date.now()}`;

    const insertPayload: Record<string, unknown> = {
      [idField[user_type]]: generatedId,
      auth_user_id: authUserId,
      email,
      name: profileData.name || profileData.full_name || email,
      status: user_type === "litigant" ? "active" : "pending",
      ...profileData,
    };

    const { error: insertError } = await supabase.from(table).insert(insertPayload);
    if (insertError) {
      // Rollback: delete auth user if profile insert fails
      await supabase.auth.admin.deleteUser(authUserId);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        message: "Registration successful. Please check your email to verify your account.",
        user_id: generatedId,
        auth_id: authUserId,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
