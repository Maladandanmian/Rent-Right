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
      return NextResponse.json({ error: "Only landlords can create properties" }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, district, property_type, total_units } = body

    // Validate required fields
    if (!name || !address || !property_type || !total_units) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        landlord_id: user.id,
        name,
        address,
        district,
        property_type,
        total_units,
      })
      .select()
      .single()

    if (propertyError) {
      console.error("Property creation error:", propertyError)
      return NextResponse.json({ error: "Failed to create property" }, { status: 500 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
