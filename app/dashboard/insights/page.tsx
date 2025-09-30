import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, TrendingUp, DollarSign, Calendar, FileText, Download } from "lucide-react"
import Link from "next/link"
import { RevenueChart } from "@/components/insights/revenue-chart"
import { OccupancyChart } from "@/components/insights/occupancy-chart"
import { MaintenanceCostChart } from "@/components/insights/maintenance-cost-chart"

export default async function InsightsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.user_type !== "landlord") {
    redirect("/dashboard")
  }

  // Get comprehensive analytics data
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      units (
        id,
        status,
        monthly_rent,
        tenancies (
          id,
          status,
          monthly_rent,
          lease_start,
          lease_end,
          rent_payments (
            id,
            amount,
            status,
            due_date,
            paid_date
          )
        )
      )
    `)
    .eq("landlord_id", user.id)

  // Calculate key metrics
  const totalProperties = properties?.length || 0
  const totalUnits = properties?.reduce((sum, prop) => sum + (prop.units?.length || 0), 0) || 0
  const occupiedUnits =
    properties?.reduce(
      (sum, prop) => sum + (prop.units?.filter((unit) => unit.status === "occupied").length || 0),
      0,
    ) || 0
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

  // Calculate monthly revenue
  const monthlyRevenue =
    properties?.reduce(
      (sum, prop) =>
        sum +
        (prop.units
          ?.filter((unit) => unit.status === "occupied")
          .reduce((unitSum, unit) => unitSum + (unit.monthly_rent || 0), 0) || 0),
      0,
    ) || 0

  // Calculate annual revenue projection
  const annualProjection = monthlyRevenue * 12

  const unitIds = properties?.flatMap((prop) => prop.units?.map((unit) => unit.id) || []) || []

  let maintenanceData = null
  if (unitIds.length > 0) {
    const { data } = await supabase
      .from("maintenance_requests")
      .select("actual_cost, completed_date")
      .in("unit_id", unitIds)
      .gte("completed_date", new Date(new Date().getFullYear(), 0, 1).toISOString())
      .not("actual_cost", "is", null)

    maintenanceData = data
  }

  const totalMaintenanceCosts = maintenanceData?.reduce((sum, req) => sum + (req.actual_cost || 0), 0) || 0

  // Calculate collection rate
  const allPayments =
    properties?.flatMap(
      (prop) =>
        prop.units?.flatMap((unit) => unit.tenancies?.flatMap((tenancy) => tenancy.rent_payments || []) || []) || [],
    ) || []

  const paidPayments = allPayments.filter((payment) => payment.status === "paid")
  const collectionRate = allPayments.length > 0 ? (paidPayments.length / allPayments.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← {profile?.preferred_language === "zh" ? "返回儀表板" : "Back to Dashboard"}
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.preferred_language === "zh" ? "業務洞察" : "Business Insights"}
              </h1>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            {profile?.preferred_language === "zh" ? "導出報告" : "Export Report"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Performance Indicators */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "入住率" : "Occupancy Rate"}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {occupiedUnits}/{totalUnits} {profile?.preferred_language === "zh" ? "單位" : "units"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "月收入" : "Monthly Revenue"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">HK${monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.preferred_language === "zh" ? "當前月份" : "Current month"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "收租率" : "Collection Rate"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {paidPayments.length}/{allPayments.length} {profile?.preferred_language === "zh" ? "已收" : "collected"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.preferred_language === "zh" ? "維修成本" : "Maintenance Costs"}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">HK${totalMaintenanceCosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.preferred_language === "zh" ? "本年度" : "This year"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{profile?.preferred_language === "zh" ? "收入趨勢" : "Revenue Trend"}</CardTitle>
              <CardDescription>
                {profile?.preferred_language === "zh"
                  ? "過去12個月的租金收入"
                  : "Rental income over the past 12 months"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={properties || []} language={profile?.preferred_language} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{profile?.preferred_language === "zh" ? "入住率分析" : "Occupancy Analysis"}</CardTitle>
              <CardDescription>
                {profile?.preferred_language === "zh" ? "各物業的入住情況" : "Occupancy status by property"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OccupancyChart data={properties || []} language={profile?.preferred_language} />
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {profile?.preferred_language === "zh" ? "維修成本分析" : "Maintenance Cost Analysis"}
              </CardTitle>
              <CardDescription>
                {profile?.preferred_language === "zh" ? "按類別劃分的維修支出" : "Maintenance expenses by category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceCostChart data={maintenanceData || []} language={profile?.preferred_language} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{profile?.preferred_language === "zh" ? "財務摘要" : "Financial Summary"}</CardTitle>
              <CardDescription>
                {profile?.preferred_language === "zh" ? "年度財務概覽" : "Annual financial overview"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {profile?.preferred_language === "zh" ? "年度收入預測" : "Annual Revenue Projection"}
                </span>
                <span className="text-lg font-bold text-green-600">HK${annualProjection.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {profile?.preferred_language === "zh" ? "維修成本" : "Maintenance Costs"}
                </span>
                <span className="text-lg font-bold text-red-600">-HK${totalMaintenanceCosts.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {profile?.preferred_language === "zh" ? "淨收入預測" : "Net Income Projection"}
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    HK${(annualProjection - totalMaintenanceCosts).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Insights for Hong Kong */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{profile?.preferred_language === "zh" ? "香港稅務洞察" : "Hong Kong Tax Insights"}</span>
            </CardTitle>
            <CardDescription>
              {profile?.preferred_language === "zh"
                ? "根據香港稅務條例的重要提醒"
                : "Important reminders based on Hong Kong tax regulations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                {profile?.preferred_language === "zh" ? "物業稅 (Property Tax)" : "Property Tax"}
              </h4>
              <p className="text-sm text-blue-800">
                {profile?.preferred_language === "zh"
                  ? "租金收入需繳納17%物業稅。建議保留所有維修收據作扣稅用途。"
                  : "Rental income is subject to 17% property tax. Keep all maintenance receipts for tax deductions."}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                {profile?.preferred_language === "zh" ? "可扣稅項目" : "Tax Deductible Items"}
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• {profile?.preferred_language === "zh" ? "維修及保養費用" : "Repair and maintenance costs"}</li>
                <li>• {profile?.preferred_language === "zh" ? "管理費" : "Management fees"}</li>
                <li>• {profile?.preferred_language === "zh" ? "保險費" : "Insurance premiums"}</li>
                <li>• {profile?.preferred_language === "zh" ? "差餉及地租" : "Rates and government rent"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
