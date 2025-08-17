import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FileText, Wrench } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  let supabaseConnected = true
  let session = null

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    session = data.session

    if (error) {
      console.error("Supabase connection error:", error)
      supabaseConnected = false
    }
  } catch (error) {
    console.error("Failed to connect to Supabase:", error)
    supabaseConnected = false
  }

  // If Supabase connection failed, show setup message
  if (!supabaseConnected) {
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

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RentRight HK</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">登入 / Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>開始使用 / Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">香港業主租務管理平台</h2>
          <p className="text-xl text-gray-600 mb-2">Property Management Made Simple for Hong Kong Landlords</p>
          <p className="text-lg text-gray-500 mb-8">輕鬆管理租金收取、維修安排及物業洞察</p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              免費開始 / Start Free
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">租金管理</CardTitle>
              <CardDescription>Rent Collection</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">自動化租金追蹤，OCR收據驗證</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Wrench className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">維修安排</CardTitle>
              <CardDescription>Maintenance Scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">簡化維修請求和承包商管理</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">租客管理</CardTitle>
              <CardDescription>Tenant Management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">集中管理租客資料和租約</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">物業洞察</CardTitle>
              <CardDescription>Property Insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">稅務報告和收益分析</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">準備開始管理您的物業？</h3>
          <p className="text-gray-600 mb-6">Ready to streamline your property management?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                創建帳戶 / Create Account
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                已有帳戶？登入 / Already have an account? Login
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
