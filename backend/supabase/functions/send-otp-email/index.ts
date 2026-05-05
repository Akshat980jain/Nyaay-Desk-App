import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, otp } = await req.json()

  // This is a template for sending emails via an external service like SendGrid or Resend
  // You can trigger this from a Database Webhook when an OTP is inserted
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: Deno.env.get('FROM_EMAIL') },
      subject: 'Your Verification Code',
      content: [{ type: 'text/plain', value: `Your OTP is: ${otp}` }],
    }),
  })

  return new Response(JSON.stringify({ success: response.ok }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
