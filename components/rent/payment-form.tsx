"use client"

import type React from "react"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

async function submitPayment(prevState: any, formData: FormData) {
  try {
    const response = await fetch("/api/rent/submit-payment", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to submit payment" }
    }

    return { success: true }
  } catch (error) {
    console.error("Payment submission error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

function SubmitButton({ language }: { language: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {language === "zh" ? "上傳中..." : "Uploading..."}
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          {language === "zh" ? "提交付款證明" : "Submit Payment Proof"}
        </>
      )}
    </Button>
  )
}

interface PaymentFormProps {
  profile: any
  payment: any
}

export default function PaymentForm({ profile, payment }: PaymentFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(submitPayment, null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/rent")
    }
  }, [state, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="paymentId" value={payment.id} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{state.error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">{profile?.preferred_language === "zh" ? "付款方式" : "Payment Method"} *</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue
              placeholder={profile?.preferred_language === "zh" ? "選擇付款方式" : "Select payment method"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">
              {profile?.preferred_language === "zh" ? "銀行轉帳" : "Bank Transfer"}
            </SelectItem>
            <SelectItem value="fps">
              {profile?.preferred_language === "zh" ? "轉數快 (FPS)" : "Faster Payment System (FPS)"}
            </SelectItem>
            <SelectItem value="cash">{profile?.preferred_language === "zh" ? "現金" : "Cash"}</SelectItem>
            <SelectItem value="cheque">{profile?.preferred_language === "zh" ? "支票" : "Cheque"}</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paidDate">{profile?.preferred_language === "zh" ? "付款日期" : "Payment Date"} *</Label>
        <Input
          id="paidDate"
          name="paidDate"
          type="date"
          required
          className="w-full"
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt">{profile?.preferred_language === "zh" ? "付款收據" : "Payment Receipt"} *</Label>
        <Input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/*,.pdf"
          required
          className="w-full"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-500">
          {profile?.preferred_language === "zh"
            ? "支援格式：JPG, PNG, PDF (最大 10MB)"
            : "Supported formats: JPG, PNG, PDF (Max 10MB)"}
        </p>
        {selectedFile && (
          <p className="text-sm text-green-600">
            {profile?.preferred_language === "zh" ? "已選擇文件" : "File selected"}: {selectedFile.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{profile?.preferred_language === "zh" ? "備註" : "Notes"}</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder={
            profile?.preferred_language === "zh" ? "任何額外資訊或備註..." : "Any additional information or notes..."
          }
          className="w-full"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
          {profile?.preferred_language === "zh" ? "取消" : "Cancel"}
        </Button>
        <div className="flex-1">
          <SubmitButton language={profile?.preferred_language || "en"} />
        </div>
      </div>
    </form>
  )
}
