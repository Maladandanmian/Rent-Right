import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/process.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const verifyWebhookSignature = async (body: string, signature: string, secret: string) => {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ])

  const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))
  const bodyBytes = encoder.encode(body)

  return await crypto.subtle.verify("HMAC", key, signatureBytes, bodyBytes)
}

interface EmailRequest {
  type: "signup" | "recovery" | "invite"
  email: string
  user_id: string
  confirmation_url?: string
  recovery_url?: string
  invite_url?: string
}

const getEmailTemplate = (type: string, language: string, data: any) => {
  const templates = {
    signup: {
      en: {
        subject: "Confirm your RentRight HK account",
        html: `
          <h2>Confirm your RentRight HK account</h2>
          <p>Thank you for joining RentRight HK, Hong Kong's property management platform.</p>
          <p>Please click the link below to confirm your email address:</p>
          <p><a href="${data.confirmation_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirm your account</a></p>
          <p>If you did not create an account, you can safely ignore this email.</p>
          <p>Best regards,<br>RentRight HK Team</p>
        `,
      },
      zh: {
        subject: "確認您的 RentRight HK 帳戶",
        html: `
          <h2>確認您的 RentRight HK 帳戶</h2>
          <p>感謝您加入 RentRight HK，香港的物業管理平台。</p>
          <p>請點擊以下連結確認您的電郵地址：</p>
          <p><a href="${data.confirmation_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">確認帳戶</a></p>
          <p>如果您沒有創建帳戶，可以安全地忽略此電郵。</p>
          <p>此致，<br>RentRight HK 團隊</p>
        `,
      },
    },
    recovery: {
      en: {
        subject: "Recover your RentRight HK account",
        html: `
          <h2>Recover your RentRight HK account</h2>
          <p>Please click the link below to recover your account:</p>
          <p><a href="${data.recovery_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Recover your account</a></p>
          <p>If you did not request a password recovery, you can safely ignore this email.</p>
          <p>Best regards,<br>RentRight HK Team</p>
        `,
      },
      zh: {
        subject: "恢復您的 RentRight HK 帳戶",
        html: `
          <h2>恢復您的 RentRight HK 帳戶</h2>
          <p>請點擊以下連結恢復您的帳戶：</p>
          <p><a href="${data.recovery_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">恢復帳戶</a></p>
          <p>如果您沒有請求密碼恢復，可以安全地忽略此電郵。</p>
          <p>此致，<br>RentRight HK 團隊</p>
        `,
      },
    },
    invite: {
      en: {
        subject: "You've been invited to RentRight HK",
        html: `
          <h2>You've been invited to RentRight HK</h2>
          <p>You've been invited to join RentRight HK, Hong Kong's property management platform.</p>
          <p>Please click the link below to accept the invitation:</p>
          <p><a href="${data.invite_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept invitation</a></p>
          <p>Best regards,<br>RentRight HK Team</p>
        `,
      },
      zh: {
        subject: "您已被邀請加入 RentRight HK",
        html: `
          <h2>您已被邀請加入 RentRight HK</h2>
          <p>您已被邀請加入 RentRight HK，香港的物業管理平台。</p>
          <p>請點擊以下連結接受邀請：</p>
          <p><a href="${data.invite_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">接受邀請</a></p>
          <p>此致，<br>RentRight HK 團隊</p>
        `,
      },
    },
  }

  return templates[type]?.[language] || templates[type]?.["en"]
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get("x-supabase-signature")
    const webhookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET")

    if (webhookSecret && signature) {
      const isValid = await verifyWebhookSignature(body, signature.replace("v1,", ""), webhookSecret)
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const { type, email, user_id, confirmation_url, recovery_url, invite_url }: EmailRequest = JSON.parse(body)

    // Get user metadata to determine language preference
    const { data: user, error: userError } = await supabaseClient.auth.admin.getUserById(user_id)

    if (userError) {
      console.error("Error fetching user:", userError)
      return new Response(JSON.stringify({ error: "Failed to fetch user data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const preferredLanguage = user.user?.user_metadata?.preferred_language || "en"

    // Get appropriate template
    const templateData = {
      confirmation_url,
      recovery_url,
      invite_url,
    }

    const template = getEmailTemplate(type, preferredLanguage, templateData)

    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Send email using Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RentRight HK <noreply@rentright.hk>",
        to: [email],
        subject: template.subject,
        html: template.html,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error("Resend API error:", errorText)
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const result = await resendResponse.json()

    return new Response(JSON.stringify({ success: true, message_id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in send-auth-email function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
