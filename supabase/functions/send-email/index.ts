import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

interface EmailRequest {
  type: "confirmation" | "invitation" | "password_reset" | "notification"
  to: string
  data: any
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const emailTemplates = {
  confirmation: (data: any) => ({
    subject: data.lang === "zh" ? "確認您的 RentRight HK 帳戶" : "Confirm your RentRight HK account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${data.lang === "zh" ? "RentRight HK" : "RentRight HK"}</h1>
        <h2>${data.lang === "zh" ? "歡迎！請確認您的帳戶" : "Welcome! Please confirm your account"}</h2>
        <p>${data.lang === "zh" ? "點擊下面的按鈕確認您的電子郵件地址：" : "Click the button below to confirm your email address:"}</p>
        <a href="${data.confirmationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
          ${data.lang === "zh" ? "確認帳戶" : "Confirm Account"}
        </a>
        <p style="color: #666; font-size: 14px;">
          ${data.lang === "zh" ? "如果您沒有創建此帳戶，請忽略此電子郵件。" : "If you did not create this account, please ignore this email."}
        </p>
      </div>
    `,
  }),

  invitation: (data: any) => ({
    subject: data.lang === "zh" ? `您被邀請加入 ${data.propertyName}` : `You're invited to join ${data.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">RentRight HK</h1>
        <h2>${data.lang === "zh" ? "租戶邀請" : "Tenant Invitation"}</h2>
        <p>${data.lang === "zh" ? `${data.landlordName} 邀請您加入 ${data.propertyName} 作為租戶。` : `${data.landlordName} has invited you to join ${data.propertyName} as a tenant.`}</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>${data.lang === "zh" ? "物業詳情：" : "Property Details:"}</h3>
          <p><strong>${data.lang === "zh" ? "地址：" : "Address:"}</strong> ${data.propertyAddress}</p>
          <p><strong>${data.lang === "zh" ? "單位：" : "Unit:"}</strong> ${data.unitNumber}</p>
        </div>
        <a href="${data.invitationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
          ${data.lang === "zh" ? "接受邀請" : "Accept Invitation"}
        </a>
        <p style="color: #666; font-size: 14px;">
          ${data.lang === "zh" ? "此邀請將在7天後過期。" : "This invitation will expire in 7 days."}
        </p>
      </div>
    `,
  }),
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { type, to, data }: EmailRequest = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured")
    }

    const template = emailTemplates[type as keyof typeof emailTemplates]
    if (!template) {
      throw new Error(`Unknown email type: ${type}`)
    }

    const emailContent = template(data)

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RentRight HK <noreply@rentright.hk>",
        to: to,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(`Resend API error: ${result.message}`)
    }

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

serve(handler)
