// Supabase Edge Function: mine-blockchain-block
// Called by a Database Webhook when a new row is inserted into legal_cases
// Deploy: supabase functions deploy mine-blockchain-block

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple SHA-256 using Web Crypto API (Deno-compatible)
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function mineBlock(
  index: number,
  data: unknown,
  previousHash: string,
  difficulty: number,
  entityId: string,
  dataType: string,
  userId: string,
  userType: string
) {
  const target = "0".repeat(difficulty);
  let nonce = 0;
  let hash = "";
  const timestamp = new Date().toISOString();
  const networkId = "ecourt-mainnet-v1";

  do {
    nonce++;
    const blockString = JSON.stringify({ index, timestamp, data, previousHash, nonce, networkId, entityId, dataType });
    hash = await sha256(blockString);
  } while (!hash.startsWith(target));

  return {
    index,
    timestamp,
    data,
    previous_hash: previousHash,
    hash,
    nonce,
    network_id: networkId,
    data_type: dataType,
    entity_id: entityId,
    user_id: userId,
    user_type: userType,
    merkle_root: hash, // Simplified merkle root for single-data block
    verification_history: [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Handles both direct API calls and Database Webhook payloads
    const payload = body.record || body;

    const {
      entity_id,
      data_type = "CASE_FILING",
      user_id = "system",
      user_type = "system",
      data,
    } = payload;

    if (!entity_id) {
      return new Response(JSON.stringify({ error: "entity_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the last block to chain properly
    const { data: lastBlock } = await supabase
      .from("blockchain_blocks")
      .select("index, hash")
      .order("index", { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastBlock?.hash || "0000000000000000000000000000000000000000000000000000000000000000";
    const nextIndex = (lastBlock?.index ?? -1) + 1;
    const difficulty = parseInt(Deno.env.get("BLOCKCHAIN_DIFFICULTY") || "2");

    const blockData = data || payload;

    const block = await mineBlock(
      nextIndex,
      blockData,
      previousHash,
      difficulty,
      entity_id,
      data_type,
      user_id,
      user_type
    );

    // Insert the mined block into blockchain_blocks
    const { data: savedBlock, error } = await supabase
      .from("blockchain_blocks")
      .insert(block)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, block: savedBlock }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
