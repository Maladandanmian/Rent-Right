import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, LogOut, Users, Wrench, BarChart3, Plus, Home } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">RentRight HK</CardTitle>
            <CardDescription>Connect Supabase to get started</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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

  let properties = null
  let totalUnits = 0
  let occupiedUnits = 0
  let totalRent = 0
  let maintenanceRequests = 0

  if (profile?.user_type === "landlord") {
    // This is a temporary workaround until the RLS policies are fixed in the database
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false })

    if (propertiesData && propertiesData.length > 0) {
      // Fetch units separately for each property
      const propertiesWithUnits = await Promise.all(
        propertiesData.map(async (property) => {
          const { data: units } = await supabase
            .from("units")
            .select("id, status, monthly_rent")
            .eq("property_id", property.id)

          return {
            ...property,
            units: units || [],
          }
        }),
      )

      properties = propertiesWithUnits
    } else {
      properties = []
    }

    totalUnits = properties.reduce((sum: number, prop: any) => sum + (prop.units?.length || 0), 0)
    occupiedUnits = properties.reduce(
      (sum: number, prop: any) => sum + (prop.units?.filter((unit: any) => unit.status === "occupied").length || 0),
      0,
    )
    totalRent = properties.reduce(
      (sum: number, prop: any) =>
        sum +
        (prop.units
          ?.filter((unit: any) => unit.status === "occupied")
          .reduce((unitSum: number, unit: any) => unitSum + (unit.monthly_rent || 0), 0) || 0),
      0,
    )

    const unitIds = properties.flatMap((prop: any) => prop.units?.map((unit: any) => unit.id) || [])

    if (unitIds.length > 0) {
      const { count } = await supabase
        .from("maintenance_requests")
        .select("*", { count: "exact", head: true })
        .in("unit_id", unitIds)
        .eq("status", "open")

      maintenanceRequests = count || 0
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RentRight HK</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {profile?.preferred_language === "zh" ? "歡迎" : "Welcome"}, {profile?.full_name || user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                {profile?.preferred_language === "zh" ? "登出" : "Sign Out"}
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {profile?.preferred_language === "zh" ? "儀表板" : "Dashboard"}
          </h2>
          <p className="text-gray-600">
            {profile?.user_type === "landlord"
              ? profile?.preferred_language === "zh"
                ? "管理您的物業和租客"
                : "Manage your properties and tenants"
              : profile?.preferred_language === "zh"
                ? "查看您的租約和維修請求"
                : "View your lease and maintenance requests"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "物業" : "Properties"}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.preferred_language === "zh" ? "總物業數量" : "Total properties"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "單位" : "Units"}
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {occupiedUnits}/{totalUnits}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.preferred_language === "zh" ? "已租出/總數" : "Occupied/Total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "租金收入" : "Rent Income"}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">HK${totalRent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.preferred_language === "zh" ? "每月收入" : "Monthly income"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "維修請求" : "Maintenance"}
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenanceRequests}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.preferred_language === "zh" ? "待處理" : "Pending requests"}
              </p>
            </CardContent>
          </Card>
        </div>

        {profile?.user_type === "landlord" ? (
          properties && properties.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{profile?.preferred_language === "zh" ? "快速操作" : "Quick Actions"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/properties/new">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      {profile?.preferred_language === "zh" ? "添加物業" : "Add Property"}
                    </Button>
                  </Link>
                  <Link href="/dashboard/properties">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Building2 className="h-4 w-4 mr-2" />
                      {profile?.preferred_language === "zh" ? "管理物業" : "Manage Properties"}
                    </Button>
                  </Link>
                  <Link href="/dashboard/insights">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {profile?.preferred_language === "zh" ? "業務洞察" : "Business Insights"}
                    </Button>
                  </Link>
                  <Link href="/dashboard/tenants">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="h-4 w-4 mr-2" />
                      {profile?.preferred_language === "zh" ? "管理租客" : "Manage Tenants"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{profile?.preferred_language === "zh" ? "最近物業" : "Recent Properties"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {properties.slice(0, 3).map((property: any) => (
                      <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-gray-500">{property.units?.length || 0} units</div>
                        </div>
                        <Link href={`/dashboard/properties/${property.id}`}>
                          <Button size="sm" variant="ghost">
                            {profile?.preferred_language === "zh" ? "查看" : "View"}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{profile?.preferred_language === "zh" ? "開始使用" : "Getting Started"}</CardTitle>
                <CardDescription>
                  {profile?.preferred_language === "zh"
                    ? "設置您的第一個物業以開始管理租務"
                    : "Set up your first property to start managing rentals"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard/properties/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Building2 className="h-4 w-4 mr-2" />
                      {profile?.preferred_language === "zh" ? "添加物業" : "Add Property"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{profile?.preferred_language === "zh" ? "租客面板" : "Tenant Dashboard"}</CardTitle>
              <CardDescription>
                {profile?.preferred_language === "zh"
                  ? "您的業主將會邀請您加入租約。請耐心等候。"
                  : "Your landlord will invite you to join a tenancy. Please wait for their invitation."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {profile?.preferred_language === "zh" ? "暫時沒有租約資料" : "No tenancy information available"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
