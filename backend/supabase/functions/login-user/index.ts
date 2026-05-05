// Supabase Edge Function: login-user
// Handles login for all roles with role validation
// Deploy: supabase functions deploy login-user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Clerk login page is a shared court-staff portal: accepts both clerks AND admins
// Maps expected_role → which actual roles are permitted on that portal
const ALLOWED_ROLES: Record<string, string[]> = {
  litigant: ["litigant"],
  advocate: ["advocate"],
  clerk:    ["clerk"],
  admin:    ["admin"],
};

// Maps actual user role → profile table
const TABLE_MAP: Record<string, string> = {
  litigant: "litigants",
  advocate: "advocates",
  clerk:    "clerks",
  admin:    "court_admins",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Use anon key for auth.signInWithPassword
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    // Use service role to query profile tables (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, password, expected_role } = await req.json();

    if (!email || !password || !expected_role) {
      return new Response(JSON.stringify({ error: "email, password and expected_role required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Check that the user's actual role is permitted for this login portal
    const actualRole: string = authData.user.user_metadata?.user_role;
    const permittedRoles = ALLOWED_ROLES[expected_role] ?? [expected_role];

    if (!permittedRoles.includes(actualRole)) {
      return new Response(
        JSON.stringify({ error: `Account not registered as ${expected_role}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch profile from the table matching the ACTUAL role (not expected_role)
    const profileTable = TABLE_MAP[actualRole];
    if (!profileTable) {
      return new Response(JSON.stringify({ error: "Unknown role" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from(profileTable)
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Check account status (not suspended)
    if (profile.status === "suspended") {
      return new Response(JSON.stringify({ error: "Account suspended. Contact court administration." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5. For advocates, check that they are verified
    if (actualRole === "advocate" && !profile.is_verified) {
      return new Response(
        JSON.stringify({ error: "Account pending verification by court administration." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Return ACTUAL role so frontend routes to the correct dashboard
    //    e.g. admin logging in via /clerklogin → user_type='admin' → frontend goes to /admindash
    return new Response(
      JSON.stringify({
        message: "Login successful",
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user_type: actualRole,
        profile,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
