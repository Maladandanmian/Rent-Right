"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          登入中... / Signing in...
        </>
      ) : (
        "登入 / Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{state.error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">電郵地址 / Email</Label>
        <Input id="email" name="email" type="email" placeholder="your@email.com" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密碼 / Password</Label>
        <Input id="password" name="password" type="password" required className="w-full" />
      </div>

      <SubmitButton />
    </form>
  )
}
