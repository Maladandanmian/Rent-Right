export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  user_type: "landlord" | "tenant"
  preferred_language: "en" | "zh"
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  landlord_id: string
  name: string
  address: string
  district?: string
  property_type?: "residential" | "commercial" | "industrial"
  total_units: number
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  property_id: string
  unit_number: string
  floor?: number
  size_sqft?: number
  bedrooms?: number
  bathrooms?: number
  monthly_rent?: number
  deposit_amount?: number
  status: "vacant" | "occupied" | "maintenance"
  room_assignments?: string[]
  appliances?: string[]
  created_at: string
  updated_at: string
}

export interface Tenancy {
  id: string
  unit_id: string
  tenant_id: string
  lease_start: string
  lease_end: string
  monthly_rent: number
  deposit_paid?: number
  status: "active" | "terminated" | "expired"
  created_at: string
  updated_at: string
}

export interface RentPayment {
  id: string
  tenancy_id: string
  amount: number
  due_date: string
  paid_date?: string
  payment_method?: "bank_transfer" | "cash" | "cheque" | "fps"
  receipt_image_url?: string
  status: "pending" | "paid" | "overdue" | "partial"
  notes?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceRequest {
  id: string
  unit_id: string
  tenant_id?: string
  title: string
  description: string
  category?: "plumbing" | "electrical" | "hvac" | "appliances" | "structural" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "completed" | "cancelled"
  estimated_cost?: number
  actual_cost?: number
  scheduled_date?: string
  completed_date?: string
  contractor_name?: string
  contractor_phone?: string
  images_urls?: string[]
  created_at: string
  updated_at: string
}
