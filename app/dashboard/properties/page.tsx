import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, MapPin, Users, Home } from "lucide-react"
import Link from "next/link"

export default async function PropertiesPage() {
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

  // Get properties with unit counts
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      units (
        id,
        status
      )
    `)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <Building2 className="h-8 w-8" />
              <span className="text-2xl font-bold">RentRight HK</span>
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-semibold text-gray-900">
              {profile?.preferred_language === "zh" ? "物業管理" : "Properties"}
            </h1>
          </div>
          <Link href="/dashboard/properties/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {profile?.preferred_language === "zh" ? "添加物業" : "Add Property"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {properties && properties.length > 0 ? (
          <div className="grid gap-6">
            {properties.map((property: any) => {
              const totalUnits = property.units?.length || 0
              const occupiedUnits = property.units?.filter((unit: any) => unit.status === "occupied").length || 0
              const vacantUnits = property.units?.filter((unit: any) => unit.status === "vacant").length || 0

              return (
                <Card key={property.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{property.name}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.address}
                          {property.district && `, ${property.district}`}
                        </CardDescription>
                      </div>
                      <Badge variant={property.property_type === "residential" ? "default" : "secondary"}>
                        {property.property_type === "residential"
                          ? profile?.preferred_language === "zh"
                            ? "住宅"
                            : "Residential"
                          : property.property_type === "commercial"
                            ? profile?.preferred_language === "zh"
                              ? "商業"
                              : "Commercial"
                            : profile?.preferred_language === "zh"
                              ? "工業"
                              : "Industrial"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{totalUnits}</div>
                        <div className="text-sm text-gray-500">
                          {profile?.preferred_language === "zh" ? "總單位" : "Total Units"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{occupiedUnits}</div>
                        <div className="text-sm text-gray-500">
                          {profile?.preferred_language === "zh" ? "已租出" : "Occupied"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{vacantUnits}</div>
                        <div className="text-sm text-gray-500">
                          {profile?.preferred_language === "zh" ? "空置" : "Vacant"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/properties/${property.id}`}>
                        <Button variant="outline" size="sm">
                          <Home className="h-4 w-4 mr-2" />
                          {profile?.preferred_language === "zh" ? "查看單位" : "View Units"}
                        </Button>
                      </Link>
                      <Link href={`/dashboard/properties/${property.id}/tenants`}>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          {profile?.preferred_language === "zh" ? "管理租客" : "Manage Tenants"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {profile?.preferred_language === "zh" ? "還沒有物業" : "No Properties Yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {profile?.preferred_language === "zh"
                  ? "添加您的第一個物業以開始管理租務"
                  : "Add your first property to start managing rentals"}
              </p>
              <Link href="/dashboard/properties/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {profile?.preferred_language === "zh" ? "添加物業" : "Add Property"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
