import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * send-push-notification Edge Function
 * 
 * Triggered by database changes on the 'hearings' table.
 * Dispatches FCM notifications to Litigants and Advocates.
 */
serve(async (req) => {
  try {
    const { record, old_record, type } = await req.json()
    
    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Determine Notification Content
    let title = "Case Update"
    let body = "A new hearing has been scheduled."
    
    if (type === 'UPDATE') {
      title = "Hearing Date Changed"
      body = `Your next hearing is now scheduled for ${record.next_hearing_date}.`
    }

    // 3. Fetch recipient tokens
    // We fetch tokens for both Litigant and Advocate associated with this case
    const { data: caseData } = await supabaseAdmin
      .from('legal_cases')
      .select('litigant_id, advocate_id, case_num')
      .eq('id', record.case_id)
      .single()

    if (caseData) {
      const userIds = [caseData.litigant_id, caseData.advocate_id].filter(id => id != null)
      
      const { data: tokens } = await supabaseAdmin
        .from('user_fcm_tokens')
        .select('token')
        .in('user_id', userIds)

      // 4. Dispatch to FCM
      if (tokens && tokens.length > 0) {
        const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
        
        for (const { token } of tokens) {
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`
            },
            body: JSON.stringify({
              to: token,
              notification: { title, body, sound: 'default' },
              data: { case_num: caseData.case_num, type: 'hearing_update' }
            })
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
