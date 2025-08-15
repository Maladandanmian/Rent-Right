import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, DollarSign, Receipt, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function RentPage() {
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

  let rentPayments = []
  let totalPending = 0
  let totalOverdue = 0
  let totalPaid = 0

  if (profile?.user_type === "landlord") {
    // Get rent payments for landlord's properties
    const { data: payments } = await supabase
      .from("rent_payments")
      .select(`
        *,
        tenancy:tenancies (
          *,
          unit:units (
            unit_number,
            property:properties (
              name
            )
          ),
          tenant:profiles (
            full_name,
            email
          )
        )
      `)
      .in(
        "tenancy_id",
        await supabase
          .from("tenancies")
          .select("id")
          .in(
            "unit_id",
            await supabase
              .from("units")
              .select("id")
              .in(
                "property_id",
                await supabase
                  .from("properties")
                  .select("id")
                  .eq("landlord_id", user.id)
                  .then(({ data }) => data?.map((p) => p.id) || []),
              )
              .then(({ data }) => data?.map((u) => u.id) || []),
          )
          .then(({ data }) => data?.map((t) => t.id) || []),
      )
      .order("due_date", { ascending: false })

    rentPayments = payments || []

    // Calculate totals
    totalPending = rentPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
    totalOverdue = rentPayments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0)
    totalPaid = rentPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  } else {
    // Get rent payments for tenant
    const { data: payments } = await supabase
      .from("rent_payments")
      .select(`
        *,
        tenancy:tenancies (
          *,
          unit:units (
            unit_number,
            property:properties (
              name
            )
          )
        )
      `)
      .in(
        "tenancy_id",
        await supabase
          .from("tenancies")
          .select("id")
          .eq("tenant_id", user.id)
          .then(({ data }) => data?.map((t) => t.id) || []),
      )
      .order("due_date", { ascending: false })

    rentPayments = payments || []
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
            <h1 className="text-xl font-semibold text-gray-900">
              {profile?.preferred_language === "zh" ? "租金管理" : "Rent Collection"}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {profile?.user_type === "landlord" && (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {profile?.preferred_language === "zh" ? "待收租金" : "Pending Rent"}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">HK${totalPending.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.preferred_language === "zh" ? "等待付款" : "Awaiting payment"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {profile?.preferred_language === "zh" ? "逾期租金" : "Overdue Rent"}
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">HK${totalOverdue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.preferred_language === "zh" ? "需要跟進" : "Requires follow-up"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {profile?.preferred_language === "zh" ? "已收租金" : "Collected Rent"}
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">HK${totalPaid.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.preferred_language === "zh" ? "本月已收" : "This month"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Rent Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {profile?.user_type === "landlord"
                ? profile?.preferred_language === "zh"
                  ? "租金記錄"
                  : "Rent Records"
                : profile?.preferred_language === "zh"
                  ? "我的租金付款"
                  : "My Rent Payments"}
            </CardTitle>
            <CardDescription>
              {profile?.user_type === "landlord"
                ? profile?.preferred_language === "zh"
                  ? "管理所有物業的租金收取"
                  : "Manage rent collection for all properties"
                : profile?.preferred_language === "zh"
                  ? "查看您的租金付款記錄"
                  : "View your rent payment history"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rentPayments.length > 0 ? (
              <div className="space-y-4">
                {rentPayments.map((payment: any) => {
                  const isOverdue = new Date(payment.due_date) < new Date() && payment.status !== "paid"

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">
                              {payment.tenancy?.unit?.property?.name} -{" "}
                              {profile?.preferred_language === "zh" ? "單位" : "Unit"}{" "}
                              {payment.tenancy?.unit?.unit_number}
                            </h4>
                            {profile?.user_type === "landlord" && payment.tenancy?.tenant && (
                              <p className="text-sm text-gray-600">{payment.tenancy.tenant.full_name}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {profile?.preferred_language === "zh" ? "到期日" : "Due"}:{" "}
                                {new Date(payment.due_date).toLocaleDateString()}
                              </span>
                              {payment.paid_date && (
                                <span className="text-sm text-gray-500 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {profile?.preferred_language === "zh" ? "付款日" : "Paid"}:{" "}
                                  {new Date(payment.paid_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">HK${payment.amount.toLocaleString()}</div>
                          <Badge
                            variant={payment.status === "paid" ? "default" : isOverdue ? "destructive" : "secondary"}
                          >
                            {payment.status === "paid"
                              ? profile?.preferred_language === "zh"
                                ? "已付款"
                                : "Paid"
                              : isOverdue
                                ? profile?.preferred_language === "zh"
                                  ? "逾期"
                                  : "Overdue"
                                : profile?.preferred_language === "zh"
                                  ? "待付款"
                                  : "Pending"}
                          </Badge>
                        </div>

                        <div className="flex space-x-2">
                          {payment.receipt_image_url && (
                            <Button variant="outline" size="sm">
                              <Receipt className="h-4 w-4 mr-2" />
                              {profile?.preferred_language === "zh" ? "收據" : "Receipt"}
                            </Button>
                          )}

                          {profile?.user_type === "tenant" && payment.status !== "paid" && (
                            <Link href={`/dashboard/rent/${payment.id}/pay`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                {profile?.preferred_language === "zh" ? "上傳收據" : "Upload Receipt"}
                              </Button>
                            </Link>
                          )}

                          {profile?.user_type === "landlord" &&
                            payment.status === "pending" &&
                            payment.receipt_image_url && (
                              <Link href={`/dashboard/rent/${payment.id}/verify`}>
                                <Button size="sm" variant="outline">
                                  {profile?.preferred_language === "zh" ? "驗證" : "Verify"}
                                </Button>
                              </Link>
                            )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {profile?.preferred_language === "zh" ? "暫無租金記錄" : "No Rent Records"}
                </h3>
                <p className="text-gray-600">
                  {profile?.user_type === "landlord"
                    ? profile?.preferred_language === "zh"
                      ? "當有活躍租約時，租金記錄將會顯示在這裡"
                      : "Rent records will appear here when you have active tenancies"
                    : profile?.preferred_language === "zh"
                      ? "當您的業主設置租約後，租金付款將會顯示在這裡"
                      : "Rent payments will appear here when your landlord sets up your tenancy"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
