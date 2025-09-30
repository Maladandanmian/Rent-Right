import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify user is a landlord
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (profile?.user_type !== "landlord") {
      return NextResponse.json({ error: "Only landlords can update units" }, { status: 403 })
    }

    const body = await request.json()
    const { unit_number, floor, size_sqft, bedrooms, bathrooms, monthly_rent, deposit_amount, status } = body

    // Validate required fields
    if (!unit_number || !status) {
      return NextResponse.json({ error: "Unit number and status are required" }, { status: 400 })
    }

    // Verify unit belongs to the landlord's property
    const { data: unit } = await supabase.from("units").select("property_id").eq("id", params.id).single()

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }

    const { data: property } = await supabase
      .from("properties")
      .select("id")
      .eq("id", unit.property_id)
      .eq("landlord_id", user.id)
      .single()

    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 })
    }

    // Update the unit
    const { data: updatedUnit, error: unitError } = await supabase
      .from("units")
      .update({
        unit_number,
        floor,
        size_sqft,
        bedrooms,
        bathrooms,
        monthly_rent,
        deposit_amount,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (unitError) {
      console.error("Unit update error:", unitError)
      return NextResponse.json({ error: "Failed to update unit" }, { status: 500 })
    }

    return NextResponse.json(updatedUnit)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
