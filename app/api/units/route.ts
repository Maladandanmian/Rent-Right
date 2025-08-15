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

    // Verify user is a landlord
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (profile?.user_type !== "landlord") {
      return NextResponse.json({ error: "Only landlords can create units" }, { status: 403 })
    }

    const body = await request.json()
    const { property_id, unit_number, floor, size_sqft, bedrooms, bathrooms, monthly_rent, deposit_amount, status } =
      body

    // Validate required fields
    if (!property_id || !unit_number || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify property belongs to the landlord
    const { data: property } = await supabase
      .from("properties")
      .select("id")
      .eq("id", property_id)
      .eq("landlord_id", user.id)
      .single()

    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 })
    }

    // Check if unit number already exists for this property
    const { data: existingUnit } = await supabase
      .from("units")
      .select("id")
      .eq("property_id", property_id)
      .eq("unit_number", unit_number)
      .single()

    if (existingUnit) {
      return NextResponse.json({ error: "Unit number already exists for this property" }, { status: 400 })
    }

    // Create the unit
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .insert({
        property_id,
        unit_number,
        floor,
        size_sqft,
        bedrooms,
        bathrooms,
        monthly_rent,
        deposit_amount,
        status,
      })
      .select()
      .single()

    if (unitError) {
      console.error("Unit creation error:", unitError)
      return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
