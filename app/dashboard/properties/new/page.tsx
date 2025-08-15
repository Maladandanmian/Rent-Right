import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import Link from "next/link"
import PropertyForm from "@/components/properties/property-form"

export default async function NewPropertyPage() {
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
          <h1 className="text-xl font-semibold text-gray-900">
            {profile?.preferred_language === "zh" ? "新增物業" : "New Property"}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{profile?.preferred_language === "zh" ? "添加新物業" : "Add New Property"}</CardTitle>
            <CardDescription>
              {profile?.preferred_language === "zh"
                ? "填寫物業詳情以開始管理租務"
                : "Fill in the property details to start managing rentals"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropertyForm profile={profile} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
