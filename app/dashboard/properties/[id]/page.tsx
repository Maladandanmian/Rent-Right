import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, MapPin, Home, Users, Edit } from "lucide-react"
import Link from "next/link"

export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
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

  // Get property with units and tenancies
  const { data: property } = await supabase
    .from("properties")
    .select(`
      *,
      units (
        *,
        tenancies (
          *,
          tenant:profiles (
            full_name,
            email,
            phone
          )
        )
      )
    `)
    .eq("id", params.id)
    .eq("landlord_id", user.id)
    .single()

  if (!property) {
    redirect("/dashboard/properties")
  }

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
            <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-700">
              {profile?.preferred_language === "zh" ? "物業" : "Properties"}
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-semibold text-gray-900">{property.name}</h1>
          </div>
          <Link href={`/dashboard/properties/${property.id}/units/new`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {profile?.preferred_language === "zh" ? "添加單位" : "Add Unit"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Property Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{property.name}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address}
                  {property.district && `, ${property.district}`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
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
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  {profile?.preferred_language === "zh" ? "編輯" : "Edit"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Units Grid */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {profile?.preferred_language === "zh" ? "單位" : "Units"} ({property.units?.length || 0})
          </h3>
        </div>

        {property.units && property.units.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {property.units.map((unit: any) => {
              const activeTenancy = unit.tenancies?.find((t: any) => t.status === "active")
              const tenant = activeTenancy?.tenant

              return (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {profile?.preferred_language === "zh" ? "單位" : "Unit"} {unit.unit_number}
                        </CardTitle>
                        {unit.floor && (
                          <CardDescription>
                            {profile?.preferred_language === "zh" ? "樓層" : "Floor"} {unit.floor}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={
                          unit.status === "occupied"
                            ? "default"
                            : unit.status === "vacant"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {unit.status === "occupied"
                          ? profile?.preferred_language === "zh"
                            ? "已租出"
                            : "Occupied"
                          : unit.status === "vacant"
                            ? profile?.preferred_language === "zh"
                              ? "空置"
                              : "Vacant"
                            : profile?.preferred_language === "zh"
                              ? "維修中"
                              : "Maintenance"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Unit Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {unit.size_sqft && (
                          <div>
                            <div className="text-gray-500">
                              {profile?.preferred_language === "zh" ? "面積" : "Size"}
                            </div>
                            <div className="font-medium">{unit.size_sqft} sq ft</div>
                          </div>
                        )}
                        {unit.bedrooms && (
                          <div>
                            <div className="text-gray-500">
                              {profile?.preferred_language === "zh" ? "房間" : "Bedrooms"}
                            </div>
                            <div className="font-medium">{unit.bedrooms}</div>
                          </div>
                        )}
                        {unit.monthly_rent && (
                          <div>
                            <div className="text-gray-500">
                              {profile?.preferred_language === "zh" ? "租金" : "Rent"}
                            </div>
                            <div className="font-medium">HK${unit.monthly_rent.toLocaleString()}</div>
                          </div>
                        )}
                      </div>

                      {/* Tenant Info */}
                      {tenant ? (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {profile?.preferred_language === "zh" ? "租客" : "Tenant"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{tenant.full_name}</div>
                            <div className="text-gray-600">{tenant.email}</div>
                            {tenant.phone && <div className="text-gray-600">{tenant.phone}</div>}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-sm text-orange-800">
                            {profile?.preferred_language === "zh" ? "無租客" : "No tenant"}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/dashboard/properties/${property.id}/units/${unit.id}`}>
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Home className="h-4 w-4 mr-2" />
                            {profile?.preferred_language === "zh" ? "詳情" : "Details"}
                          </Button>
                        </Link>
                        {!tenant && (
                          <Link href={`/dashboard/properties/${property.id}/units/${unit.id}/invite`}>
                            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                              <Users className="h-4 w-4 mr-2" />
                              {profile?.preferred_language === "zh" ? "邀請租客" : "Invite Tenant"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {profile?.preferred_language === "zh" ? "還沒有單位" : "No Units Yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {profile?.preferred_language === "zh"
                  ? "為此物業添加單位以開始管理租務"
                  : "Add units to this property to start managing rentals"}
              </p>
              <Link href={`/dashboard/properties/${property.id}/units/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {profile?.preferred_language === "zh" ? "添加單位" : "Add Unit"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
