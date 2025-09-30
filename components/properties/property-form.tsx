"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

async function createProperty(prevState: any, formData: FormData) {
  const name = formData.get("name")
  const address = formData.get("address")
  const district = formData.get("district")
  const propertyType = formData.get("propertyType")
  const totalUnits = formData.get("totalUnits")
  const sizeSqft = formData.get("sizeSqft")
  const bedrooms = formData.get("bedrooms")
  const bathrooms = formData.get("bathrooms")
  const roomAssignments = formData.get("roomAssignments")
  const appliances = formData.get("appliances")

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
        size_sqft: sizeSqft ? Number.parseInt(sizeSqft.toString()) : undefined,
        bedrooms: bedrooms ? Number.parseInt(bedrooms.toString()) : undefined,
        bathrooms: bathrooms ? Number.parseInt(bathrooms.toString()) : undefined,
        room_assignments: roomAssignments ? JSON.parse(roomAssignments.toString()) : undefined,
        appliances: appliances ? JSON.parse(appliances.toString()) : undefined,
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
  const [sizeSqft, setSizeSqft] = useState<string>("")
  const [sizeSqm, setSizeSqm] = useState<string>("")
  const [bedrooms, setBedrooms] = useState<string>("1")
  const [bathrooms, setBathrooms] = useState<string>("1")
  const [roomAssignments, setRoomAssignments] = useState<string[]>([])
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([])

  useEffect(() => {
    if (state?.success) {
      router.push(`/dashboard/properties/${state.propertyId}`)
    }
  }, [state, router])

  useEffect(() => {
    if (sizeSqft) {
      const sqm = (Number.parseFloat(sizeSqft) * 0.092903).toFixed(2)
      setSizeSqm(sqm)
    } else {
      setSizeSqm("")
    }
  }, [sizeSqft])

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

  const roomTypes = [
    { value: "master_bedroom", label: profile?.preferred_language === "zh" ? "主人房" : "Master Bedroom" },
    { value: "bedroom_2", label: profile?.preferred_language === "zh" ? "第二睡房" : "2nd Bedroom" },
    { value: "bedroom_3", label: profile?.preferred_language === "zh" ? "第三睡房" : "3rd Bedroom" },
    { value: "bedroom_4", label: profile?.preferred_language === "zh" ? "第四睡房" : "4th Bedroom" },
    { value: "bathroom_1", label: profile?.preferred_language === "zh" ? "主浴室" : "Main Bathroom" },
    { value: "bathroom_2", label: profile?.preferred_language === "zh" ? "第二浴室" : "2nd Bathroom" },
    { value: "bathroom_3", label: profile?.preferred_language === "zh" ? "第三浴室" : "3rd Bathroom" },
    { value: "kitchen", label: profile?.preferred_language === "zh" ? "廚房" : "Kitchen" },
    { value: "living_room", label: profile?.preferred_language === "zh" ? "客廳" : "Living Room" },
    { value: "dining_room", label: profile?.preferred_language === "zh" ? "飯廳" : "Dining Room" },
    { value: "maid_room", label: profile?.preferred_language === "zh" ? "工人房" : "Maid's Room" },
    { value: "study_room", label: profile?.preferred_language === "zh" ? "書房" : "Study Room" },
    { value: "balcony", label: profile?.preferred_language === "zh" ? "露台" : "Balcony" },
    { value: "utility_room", label: profile?.preferred_language === "zh" ? "雜物房" : "Utility Room" },
  ]

  const appliancesList = [
    { value: "air_conditioner", label: profile?.preferred_language === "zh" ? "冷氣機" : "Air Conditioner" },
    { value: "refrigerator", label: profile?.preferred_language === "zh" ? "雪櫃" : "Refrigerator" },
    { value: "washing_machine", label: profile?.preferred_language === "zh" ? "洗衣機" : "Washing Machine" },
    { value: "dryer", label: profile?.preferred_language === "zh" ? "乾衣機" : "Dryer" },
    { value: "dishwasher", label: profile?.preferred_language === "zh" ? "洗碗機" : "Dishwasher" },
    { value: "microwave", label: profile?.preferred_language === "zh" ? "微波爐" : "Microwave" },
    { value: "oven", label: profile?.preferred_language === "zh" ? "焗爐" : "Oven" },
    { value: "gas_stove", label: profile?.preferred_language === "zh" ? "煤氣爐" : "Gas Stove" },
    { value: "induction_cooker", label: profile?.preferred_language === "zh" ? "電磁爐" : "Induction Cooker" },
    { value: "water_heater", label: profile?.preferred_language === "zh" ? "熱水爐" : "Water Heater" },
    { value: "tv", label: profile?.preferred_language === "zh" ? "電視" : "TV" },
    { value: "water_dispenser", label: profile?.preferred_language === "zh" ? "飲水機" : "Water Dispenser" },
    { value: "range_hood", label: profile?.preferred_language === "zh" ? "抽油煙機" : "Range Hood" },
    { value: "dehumidifier", label: profile?.preferred_language === "zh" ? "抽濕機" : "Dehumidifier" },
  ]

  const toggleRoomAssignment = (room: string) => {
    setRoomAssignments((prev) => (prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]))
  }

  const toggleAppliance = (appliance: string) => {
    setSelectedAppliances((prev) =>
      prev.includes(appliance) ? prev.filter((a) => a !== appliance) : [...prev, appliance],
    )
  }

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

      <div className="border-t pt-6 space-y-6">
        <h3 className="text-lg font-semibold">{profile?.preferred_language === "zh" ? "單位詳情" : "Unit Details"}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sizeSqft">
              {profile?.preferred_language === "zh" ? "單位面積 (平方呎)" : "Unit Size (sqft)"}
            </Label>
            <Input
              id="sizeSqft"
              name="sizeSqft"
              type="number"
              min="0"
              placeholder="800"
              value={sizeSqft}
              onChange={(e) => setSizeSqft(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sizeSqm">
              {profile?.preferred_language === "zh" ? "單位面積 (平方米)" : "Unit Size (sqm)"}
            </Label>
            <Input
              id="sizeSqm"
              type="text"
              value={sizeSqm}
              readOnly
              placeholder="74.32"
              className="w-full bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedrooms">{profile?.preferred_language === "zh" ? "睡房數量" : "Number of Bedrooms"}</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">
              {profile?.preferred_language === "zh" ? "浴室數量" : "Number of Bathrooms"}
            </Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>{profile?.preferred_language === "zh" ? "房間配置" : "Room Assignments"}</Label>
          <div className="grid grid-cols-2 gap-3">
            {roomTypes.map((room) => (
              <div key={room.value} className="flex items-center space-x-2">
                <Checkbox
                  id={room.value}
                  checked={roomAssignments.includes(room.value)}
                  onCheckedChange={() => toggleRoomAssignment(room.value)}
                />
                <label
                  htmlFor={room.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {room.label}
                </label>
              </div>
            ))}
          </div>
          <input type="hidden" name="roomAssignments" value={JSON.stringify(roomAssignments)} />
        </div>

        <div className="space-y-3">
          <Label>{profile?.preferred_language === "zh" ? "包括電器" : "Included Appliances"}</Label>
          <div className="grid grid-cols-2 gap-3">
            {appliancesList.map((appliance) => (
              <div key={appliance.value} className="flex items-center space-x-2">
                <Checkbox
                  id={appliance.value}
                  checked={selectedAppliances.includes(appliance.value)}
                  onCheckedChange={() => toggleAppliance(appliance.value)}
                />
                <label
                  htmlFor={appliance.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {appliance.label}
                </label>
              </div>
            ))}
          </div>
          <input type="hidden" name="appliances" value={JSON.stringify(selectedAppliances)} />
        </div>
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
