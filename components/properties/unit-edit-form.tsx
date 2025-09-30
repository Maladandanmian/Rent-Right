"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

async function updateUnit(prevState: any, formData: FormData) {
  const unitId = formData.get("unitId")
  const propertyId = formData.get("propertyId")
  const unitNumber = formData.get("unitNumber")
  const floor = formData.get("floor")
  const sizeSqft = formData.get("sizeSqft")
  const bedrooms = formData.get("bedrooms")
  const bathrooms = formData.get("bathrooms")
  const monthlyRent = formData.get("monthlyRent")
  const depositAmount = formData.get("depositAmount")
  const status = formData.get("status")

  if (!unitId || !propertyId || !unitNumber || !status) {
    return { error: "Unit ID, property ID, unit number, and status are required" }
  }

  try {
    const response = await fetch(`/api/units/${unitId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unit_number: unitNumber.toString(),
        floor: floor ? Number.parseInt(floor.toString()) : null,
        size_sqft: sizeSqft ? Number.parseInt(sizeSqft.toString()) : null,
        bedrooms: bedrooms ? Number.parseInt(bedrooms.toString()) : null,
        bathrooms: bathrooms ? Number.parseInt(bathrooms.toString()) : null,
        monthly_rent: monthlyRent ? Number.parseFloat(monthlyRent.toString()) : null,
        deposit_amount: depositAmount ? Number.parseFloat(depositAmount.toString()) : null,
        status: status.toString(),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to update unit" }
    }

    return { success: true, propertyId: propertyId.toString() }
  } catch (error) {
    console.error("Unit update error:", error)
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
          {language === "zh" ? "更新中..." : "Updating..."}
        </>
      ) : language === "zh" ? (
        "更新單位"
      ) : (
        "Update Unit"
      )}
    </Button>
  )
}

interface UnitEditFormProps {
  profile: any
  propertyId: string
  unit: any
}

export default function UnitEditForm({ profile, propertyId, unit }: UnitEditFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(updateUnit, null)
  const [status, setStatus] = useState<string>(unit.status || "vacant")

  useEffect(() => {
    if (state?.success) {
      router.push(`/dashboard/properties/${state.propertyId}`)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="unitId" value={unit.id} />
      <input type="hidden" name="propertyId" value={propertyId} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{state.error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="unitNumber">{profile?.preferred_language === "zh" ? "單位號碼" : "Unit Number"} *</Label>
        <Input
          id="unitNumber"
          name="unitNumber"
          type="text"
          defaultValue={unit.unit_number}
          placeholder={profile?.preferred_language === "zh" ? "例如：A1, 1A, 101" : "e.g., A1, 1A, 101"}
          required
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor">{profile?.preferred_language === "zh" ? "樓層" : "Floor"}</Label>
          <Input
            id="floor"
            name="floor"
            type="number"
            min="1"
            defaultValue={unit.floor || ""}
            placeholder={profile?.preferred_language === "zh" ? "例如：1, 2, 3" : "e.g., 1, 2, 3"}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sizeSqft">{profile?.preferred_language === "zh" ? "面積 (平方呎)" : "Size (sq ft)"}</Label>
          <Input
            id="sizeSqft"
            name="sizeSqft"
            type="number"
            min="1"
            defaultValue={unit.size_sqft || ""}
            placeholder={profile?.preferred_language === "zh" ? "例如：500" : "e.g., 500"}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">{profile?.preferred_language === "zh" ? "房間數量" : "Bedrooms"}</Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min="0"
            defaultValue={unit.bedrooms || ""}
            placeholder={profile?.preferred_language === "zh" ? "例如：2" : "e.g., 2"}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">{profile?.preferred_language === "zh" ? "浴室數量" : "Bathrooms"}</Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min="0"
            step="0.5"
            defaultValue={unit.bathrooms || ""}
            placeholder={profile?.preferred_language === "zh" ? "例如：1.5" : "e.g., 1.5"}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyRent">
            {profile?.preferred_language === "zh" ? "月租 (HK$)" : "Monthly Rent (HK$)"}
          </Label>
          <Input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            min="0"
            step="0.01"
            defaultValue={unit.monthly_rent || ""}
            placeholder={profile?.preferred_language === "zh" ? "例如：15000" : "e.g., 15000"}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="depositAmount">{profile?.preferred_language === "zh" ? "按金 (HK$)" : "Deposit (HK$)"}</Label>
          <Input
            id="depositAmount"
            name="depositAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={unit.deposit_amount || ""}
            placeholder={profile?.preferred_language === "zh" ? "例如：30000" : "e.g., 30000"}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">{profile?.preferred_language === "zh" ? "狀態" : "Status"} *</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacant">{profile?.preferred_language === "zh" ? "空置" : "Vacant"}</SelectItem>
            <SelectItem value="occupied">{profile?.preferred_language === "zh" ? "已租出" : "Occupied"}</SelectItem>
            <SelectItem value="maintenance">
              {profile?.preferred_language === "zh" ? "維修中" : "Under Maintenance"}
            </SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
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
