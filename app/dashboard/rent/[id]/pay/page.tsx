import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import Link from "next/link"
import PaymentForm from "@/components/rent/payment-form"

export default async function PayRentPage({ params }: { params: { id: string } }) {
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

  if (profile?.user_type !== "tenant") {
    redirect("/dashboard")
  }

  // Get rent payment with tenancy details
  const { data: payment } = await supabase
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
    .eq("id", params.id)
    .in(
      "tenancy_id",
      await supabase
        .from("tenancies")
        .select("id")
        .eq("tenant_id", user.id)
        .then(({ data }) => data?.map((t) => t.id) || []),
    )
    .single()

  if (!payment) {
    redirect("/dashboard/rent")
  }

  if (payment.status === "paid") {
    redirect("/dashboard/rent")
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
          <Link href="/dashboard/rent" className="text-blue-600 hover:text-blue-700">
            {profile?.preferred_language === "zh" ? "租金" : "Rent"}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">
            {profile?.preferred_language === "zh" ? "上傳付款收據" : "Upload Payment Receipt"}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{profile?.preferred_language === "zh" ? "租金付款" : "Rent Payment"}</CardTitle>
            <CardDescription>
              {payment.tenancy?.unit?.property?.name} - {profile?.preferred_language === "zh" ? "單位" : "Unit"}{" "}
              {payment.tenancy?.unit?.unit_number}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{profile?.preferred_language === "zh" ? "金額" : "Amount"}:</span>
                  <div className="font-semibold">HK${payment.amount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">{profile?.preferred_language === "zh" ? "到期日" : "Due Date"}:</span>
                  <div className="font-semibold">{new Date(payment.due_date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <PaymentForm profile={profile} payment={payment} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
