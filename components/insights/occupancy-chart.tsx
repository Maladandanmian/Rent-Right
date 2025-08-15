"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface OccupancyChartProps {
  data: any[]
  language?: string
}

export function OccupancyChart({ data, language }: OccupancyChartProps) {
  const totalUnits = data.reduce((sum, prop) => sum + (prop.units?.length || 0), 0)
  const occupiedUnits = data.reduce(
    (sum, prop) => sum + (prop.units?.filter((unit: any) => unit.status === "occupied").length || 0),
    0,
  )
  const vacantUnits = totalUnits - occupiedUnits

  const chartData = [
    {
      name: language === "zh" ? "已租出" : "Occupied",
      value: occupiedUnits,
      color: "#22c55e",
    },
    {
      name: language === "zh" ? "空置" : "Vacant",
      value: vacantUnits,
      color: "#ef4444",
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, language === "zh" ? "單位" : "Units"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
