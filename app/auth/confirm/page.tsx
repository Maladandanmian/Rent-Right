"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmUser = async () => {
      const code = searchParams.get("code")

      if (!code) {
        setStatus("error")
        setMessage("Invalid confirmation link")
        return
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setStatus("error")
          setMessage(error.message)
        } else {
          setStatus("success")
          setMessage("Account confirmed successfully!")
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      } catch (error) {
        setStatus("error")
        setMessage("An error occurred during confirmation")
      }
    }

    confirmUser()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Confirming Account..."}
            {status === "success" && "Account Confirmed!"}
            {status === "error" && "Confirmation Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">{message}</p>
          {status === "success" && <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>}
        </CardContent>
      </Card>
    </div>
  )
}
