/**
 * ============================================
 * SKILL RADAR SCREEN - Presentation Layer
 * ============================================
 * Full skill radar view with:
 * - Main radar chart showing all 6 categories
 * - Tap-to-drill-down into sub-skill detail
 * - Sub-radar per category
 * - XP progress bars per sub-skill
 * ============================================
 */

"use client"

import { useState } from "react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { CATEGORY_COLORS } from "@/src/shared/presentation/category-colors"
import type { SkillCategory } from "@/src/skills/domain/skill.entity"
import { ChevronLeft, Sparkles } from "lucide-react"

export function SkillRadarScreen() {
  const { skills } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null)

  if (selectedCategory) {
    return (
      <SubRadarView
        category={selectedCategory}
        onBack={() => setSelectedCategory(null)}
      />
    )
  }

  const radarData = skills.categories.map((cat) => ({
    name: cat.name.split(" ")[0],
    level: cat.level,
    fullMark: 100,
  }))

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
          Radar de Habilidades
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Nivel general: {skills.overallLevel}/100
        </p>
      </header>

      {/* Main Radar */}
      <NeonCard glowColor="cyan">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid
              stroke="hsl(185, 100%, 50%)"
              strokeOpacity={0.12}
              strokeDasharray="2 4"
            />
            <PolarAngleAxis
              dataKey="name"
              tick={{
                fill: "hsl(185, 40%, 55%)",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "hsl(185, 40%, 40%)", fontSize: 8 }}
              tickCount={5}
            />
            <Radar
              name="Nivel"
              dataKey="level"
              stroke="hsl(185, 100%, 50%)"
              fill="hsl(185, 100%, 50%)"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </NeonCard>

      {/* Category Cards */}
      <h2 className="font-mono text-sm font-semibold text-foreground">
        Categorias
      </h2>
      <div className="flex flex-col gap-3">
        {skills.categories.map((cat) => {
          const colors = CATEGORY_COLORS[cat.id]
          return (
            <NeonCard
              key={cat.id}
              glowColor={colors.glow}
              interactive
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Sparkles className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <p className={`font-mono text-sm font-semibold ${colors.text}`}>
                      {cat.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {cat.subSkills.length} sub-habilidades
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-lg font-bold ${colors.text}`}>
                    {cat.level}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground">NIVEL</p>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.level}%`,
                    backgroundColor: colors.hex,
                  }}
                />
              </div>
            </NeonCard>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Sub-Radar View - Drill-down into a specific skill category.
 * Shows the sub-skills as a radar chart + XP bars.
 */
function SubRadarView({
  category,
  onBack,
}: {
  category: SkillCategory
  onBack: () => void
}) {
  const colors = CATEGORY_COLORS[category.id]

  const subData = category.subSkills.map((s) => ({
    name: s.name,
    level: s.level,
    fullMark: 100,
  }))

  const barData = category.subSkills.map((s) => ({
    name: s.name,
    xp: s.xpCurrent,
    needed: s.xpRequired,
    level: s.level,
  }))

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Volver al radar principal"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className={`font-mono text-lg font-bold ${colors.text}`}>
            {category.name}
          </h1>
          <p className="font-mono text-[10px] text-muted-foreground">
            Nivel {category.level}/100
          </p>
        </div>
      </header>

      {/* Sub-Skill Radar */}
      <NeonCard glowColor={colors.glow}>
        <h2 className="mb-2 font-mono text-xs font-semibold text-muted-foreground">
          Sub-Radar
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={subData} cx="50%" cy="50%" outerRadius="68%">
            <PolarGrid
              stroke={colors.hex}
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
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              tickCount={5}
            />
            <Radar
              name="Nivel"
              dataKey="level"
              stroke={colors.hex}
              fill={colors.hex}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </NeonCard>

      {/* XP Bar Chart */}
      <NeonCard glowColor={colors.glow}>
        <h2 className="mb-3 font-mono text-xs font-semibold text-muted-foreground">
          Progreso XP
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" barCategoryGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 30%, 18%)" />
            <XAxis
              type="number"
              domain={[0, 1000]}
              tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 9, fontFamily: "monospace" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={85}
              tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 9, fontFamily: "monospace" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(225, 35%, 9%)",
                border: `1px solid ${colors.hex}`,
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "11px",
                color: "hsl(185, 100%, 92%)",
              }}
            />
            <Bar dataKey="xp" radius={[0, 4, 4, 0]} barSize={14}>
              {barData.map((_, i) => (
                <Cell key={i} fill={colors.hex} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </NeonCard>

      {/* Sub-Skill Detail List */}
      <h2 className="font-mono text-sm font-semibold text-foreground">
        Detalle de Sub-Habilidades
      </h2>
      <div className="flex flex-col gap-2">
        {category.subSkills.map((skill) => (
          <div
            key={skill.id}
            className={`flex items-center gap-3 rounded-lg border ${colors.border} ${colors.bgFaded} px-4 py-3`}
          >
            <div className="flex-1">
              <p className="font-mono text-xs font-semibold text-foreground">
                {skill.name}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {skill.xpCurrent}/{skill.xpRequired} XP
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(skill.xpCurrent / skill.xpRequired) * 100}%`,
                    backgroundColor: colors.hex,
                  }}
                />
              </div>
            </div>
            <div className={`font-mono text-lg font-bold ${colors.text}`}>
              {skill.level}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
