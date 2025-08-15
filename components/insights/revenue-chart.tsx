"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface RevenueChartProps {
  data: any[]
  language?: string
}

export function RevenueChart({ data, language }: RevenueChartProps) {
  // Generate mock data for the past 12 months
  const months = []
  const currentDate = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthName =
      language === "zh" ? `${date.getMonth() + 1}月` : date.toLocaleDateString("en-US", { month: "short" })

    // Calculate revenue for this month (simplified calculation)
    const monthlyRevenue = data.reduce(
      (sum, prop) =>
        sum +
        (prop.units
          ?.filter((unit: any) => unit.status === "occupied")
          .reduce((unitSum: number, unit: any) => unitSum + (unit.monthly_rent || 0), 0) || 0),
      0,
    )

    months.push({
      month: monthName,
      revenue: monthlyRevenue + (Math.random() * 5000 - 2500), // Add some variation
    })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={months}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [`HK$${value.toLocaleString()}`, language === "zh" ? "收入" : "Revenue"]}
        />
        <Bar dataKey="revenue" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
