/**
 * ============================================
 * MINI RADAR CHART - Dashboard Component
 * ============================================
 * Compact radar/spider chart for the dashboard
 * overview. Uses Recharts RadarChart component.
 * ============================================
 */

"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import type { SkillCategory } from "@/src/skills/domain/skill.entity"

interface MiniRadarChartProps {
  categories: SkillCategory[]
}

export function MiniRadarChart({ categories }: MiniRadarChartProps) {
  const data = categories.map((cat) => ({
    name: cat.name.split(" ")[0],
    level: cat.level,
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid
          stroke="hsl(185, 100%, 50%)"
          strokeOpacity={0.15}
          strokeDasharray="2 4"
        />
        <PolarAngleAxis
          dataKey="name"
          tick={{
            fill: "hsl(185, 40%, 55%)",
            fontSize: 10,
            fontFamily: "monospace",
          }}
        />
        <Radar
          name="Nivel"
          dataKey="level"
          stroke="hsl(185, 100%, 50%)"
          fill="hsl(185, 100%, 50%)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
