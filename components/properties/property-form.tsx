"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

async function createProperty(prevState: any, formData: FormData) {
  const name = formData.get("name")
  const address = formData.get("address")
  const district = formData.get("district")
  const propertyType = formData.get("propertyType")
  const totalUnits = formData.get("totalUnits")

  if (!name || !address || !propertyType || !totalUnits) {
    return { error: "All required fields must be filled" }
  }

  try {
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.toString(),
        address: address.toString(),
        district: district?.toString() || "",
        property_type: propertyType.toString(),
        total_units: Number.parseInt(totalUnits.toString()),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Failed to create property" }
    }

    return { success: true, propertyId: result.id }
  } catch (error) {
    console.error("Property creation error:", error)
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
          {language === "zh" ? "創建中..." : "Creating..."}
        </>
      ) : language === "zh" ? (
        "創建物業"
      ) : (
        "Create Property"
      )}
    </Button>
  )
}

interface PropertyFormProps {
  profile: any
}

export default function PropertyForm({ profile }: PropertyFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(createProperty, null)
  const [propertyType, setPropertyType] = useState<string>("")
  const [district, setDistrict] = useState<string>("")

  useEffect(() => {
    if (state?.success) {
      router.push(`/dashboard/properties/${state.propertyId}`)
    }
  }, [state, router])

  const hongKongDistricts = [
    "Central and Western",
    "Eastern",
    "Southern",
    "Wan Chai",
    "Sham Shui Po",
    "Kowloon City",
    "Kwun Tong",
    "Wong Tai Sin",
    "Yau Tsim Mong",
    "Islands",
    "Kwai Tsing",
    "North",
    "Sai Kung",
    "Sha Tin",
    "Tai Po",
    "Tsuen Wan",
    "Tuen Mun",
    "Yuen Long",
  ]

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{state.error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{profile?.preferred_language === "zh" ? "物業名稱" : "Property Name"} *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={profile?.preferred_language === "zh" ? "例如：海景大廈" : "e.g., Ocean View Building"}
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{profile?.preferred_language === "zh" ? "地址" : "Address"} *</Label>
        <Textarea
          id="address"
          name="address"
          placeholder={
            profile?.preferred_language === "zh"
              ? "例如：香港島中環皇后大道中123號"
              : "e.g., 123 Queen's Road Central, Central, Hong Kong Island"
          }
          required
          className="w-full"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="district">{profile?.preferred_language === "zh" ? "地區" : "District"}</Label>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger>
            <SelectValue placeholder={profile?.preferred_language === "zh" ? "選擇地區" : "Select district"} />
          </SelectTrigger>
          <SelectContent>
            {hongKongDistricts.map((dist) => (
              <SelectItem key={dist} value={dist}>
                {dist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="district" value={district} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyType">{profile?.preferred_language === "zh" ? "物業類型" : "Property Type"} *</Label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger>
            <SelectValue placeholder={profile?.preferred_language === "zh" ? "選擇物業類型" : "Select property type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="residential">{profile?.preferred_language === "zh" ? "住宅" : "Residential"}</SelectItem>
            <SelectItem value="commercial">{profile?.preferred_language === "zh" ? "商業" : "Commercial"}</SelectItem>
            <SelectItem value="industrial">{profile?.preferred_language === "zh" ? "工業" : "Industrial"}</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="propertyType" value={propertyType} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalUnits">
          {profile?.preferred_language === "zh" ? "總單位數量" : "Total Number of Units"} *
        </Label>
        <Input id="totalUnits" name="totalUnits" type="number" min="1" placeholder="1" required className="w-full" />
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
