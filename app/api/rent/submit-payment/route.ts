import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a tenant
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (profile?.user_type !== "tenant") {
      return NextResponse.json({ error: "Only tenants can submit payments" }, { status: 403 })
    }

    const formData = await request.formData()
    const paymentId = formData.get("paymentId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const paidDate = formData.get("paidDate") as string
    const notes = formData.get("notes") as string
    const receiptFile = formData.get("receipt") as File

    if (!paymentId || !paymentMethod || !paidDate || !receiptFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify payment belongs to the tenant
    const { data: payment } = await supabase
      .from("rent_payments")
      .select(`
        *,
        tenancy:tenancies (
          tenant_id
        )
      `)
      .eq("id", paymentId)
      .single()

    if (!payment || payment.tenancy?.tenant_id !== user.id) {
      return NextResponse.json({ error: "Payment not found or access denied" }, { status: 404 })
    }

    if (payment.status === "paid") {
      return NextResponse.json({ error: "Payment already marked as paid" }, { status: 400 })
    }

    // Upload receipt to Supabase Storage
    const fileExt = receiptFile.name.split(".").pop()
    const fileName = `${paymentId}-${Date.now()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, receiptFile)

    if (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath)

    // Update payment record
    const { error: updateError } = await supabase
      .from("rent_payments")
      .update({
        paid_date: paidDate,
        payment_method: paymentMethod,
        receipt_image_url: publicUrl,
        notes: notes || null,
        status: "pending", // Landlord needs to verify
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)

    if (updateError) {
      console.error("Payment update error:", updateError)
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
