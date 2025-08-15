import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SignUpForm from "@/components/auth/sign-up-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default async function SignUpPage() {
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
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <Building2 className="h-8 w-8" />
            <span className="text-2xl font-bold">RentRight HK</span>
          </Link>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">創建業主帳戶</CardTitle>
            <CardDescription>Create your landlord account</CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>

        {/* Login link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            已有帳戶？ Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              登入 / Login
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            租客請等待業主邀請 / Tenants will receive invitations from landlords
          </p>
        </div>
      </div>
    </div>
  )
}
