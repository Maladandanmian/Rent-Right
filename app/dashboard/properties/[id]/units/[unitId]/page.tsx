import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import Link from "next/link"
import UnitEditForm from "@/components/properties/unit-edit-form"

export default async function UnitDetailsPage({ params }: { params: { id: string; unitId: string } }) {
  if (!isSupabaseConfigured) {
    redirect("/")
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.user_type !== "landlord") {
    redirect("/dashboard")
  }

  // Get property
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("landlord_id", user.id)
    .single()

  if (!property) {
    redirect("/dashboard/properties")
  }

  // Get unit
  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", params.unitId)
    .eq("property_id", property.id)
    .single()

  if (!unit) {
    redirect(`/dashboard/properties/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <Building2 className="h-8 w-8" />
            <span className="text-2xl font-bold">RentRight HK</span>
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-700">
            {profile?.preferred_language === "zh" ? "物業" : "Properties"}
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/properties/${property.id}`} className="text-blue-600 hover:text-blue-700">
            {property.name}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">
            {profile?.preferred_language === "zh" ? "單位" : "Unit"} {unit.unit_number}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>
              {profile?.preferred_language === "zh" ? "編輯單位" : "Edit Unit"} {unit.unit_number}
            </CardTitle>
            <CardDescription>
              {profile?.preferred_language === "zh"
                ? `更新 ${property.name} 的單位資料`
                : `Update unit details for ${property.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnitEditForm profile={profile} propertyId={property.id} unit={unit} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
