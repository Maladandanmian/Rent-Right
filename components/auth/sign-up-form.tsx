"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Building2 } from "lucide-react"
import { signUp } from "@/lib/actions"
import { useState } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          註冊中... / Signing up...
        </>
      ) : (
        "創建業主帳戶 / Create Landlord Account"
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)
  const [language, setLanguage] = useState<string>("en")

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{state.error}</div>
      )}

      {state?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {state.success}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">全名 / Full Name *</Label>
        <Input id="fullName" name="fullName" type="text" placeholder="張三 / John Doe" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">電郵地址 / Email *</Label>
        <Input id="email" name="email" type="email" placeholder="your@email.com" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">電話號碼 / Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+852 1234 5678" className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密碼 / Password *</Label>
        <Input id="password" name="password" type="password" required className="w-full" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <div className="font-medium text-blue-900">業主帳戶 / Landlord Account</div>
            <div className="text-sm text-blue-700">租客將通過邀請加入 / Tenants will be invited to join</div>
          </div>
        </div>
        <input type="hidden" name="userType" value="landlord" />
      </div>

      <div className="space-y-2">
        <Label>偏好語言 / Preferred Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="zh">繁體中文</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="language" value={language} />
      </div>

      <SubmitButton />

      <div className="text-xs text-gray-500 text-center">
        註冊即表示您同意我們的服務條款和私隱政策
        <br />
        By signing up, you agree to our Terms of Service and Privacy Policy
      </div>
    </form>
  )
}
