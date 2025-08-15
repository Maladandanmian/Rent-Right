import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/io/mod.ts" // Declaring Deno variable

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const signature = req.headers.get("authorization")
    if (signature !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 })
    }

    const payload = await req.json()
    const { type, record } = payload

    // Handle user signup event
    if (type === "INSERT" && payload.table === "users") {
      const userId = record.id
      const email = record.email
      const userMetadata = record.user_metadata || {}

      // Create profile automatically
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: email,
        full_name: userMetadata.full_name || "",
        user_type: userMetadata.user_type || "landlord",
        language: userMetadata.language || "en",
        phone: userMetadata.phone || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        throw profileError
      }

      // Send custom confirmation email
      const confirmationUrl = `${Deno.env.get("SITE_URL")}/auth/confirm?token=${record.confirmation_token}`

      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: "confirmation",
          to: email,
          data: {
            confirmationUrl,
            lang: userMetadata.language || "en",
          },
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

serve(handler)
