"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface MaintenanceCostChartProps {
  data: any[]
  language?: string
}

export function MaintenanceCostChart({ data, language }: MaintenanceCostChartProps) {
  // Group maintenance costs by category (mock data for demonstration)
  const categories = [
    { name: language === "zh" ? "水電" : "Plumbing", cost: 15000 },
    { name: language === "zh" ? "電器" : "Electrical", cost: 8000 },
    { name: language === "zh" ? "油漆" : "Painting", cost: 12000 },
    { name: language === "zh" ? "清潔" : "Cleaning", cost: 5000 },
    { name: language === "zh" ? "其他" : "Others", cost: 7000 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={categories}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: number) => [`HK$${value.toLocaleString()}`, language === "zh" ? "成本" : "Cost"]} />
        <Bar dataKey="cost" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}
