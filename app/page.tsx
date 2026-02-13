/**
 * ============================================
 * ROOT PAGE - App Shell & Screen Router
 * ============================================
 * Client-side SPA shell that renders the active
 * screen based on bottom navigation state.
 * Wraps everything in the AppProvider for
 * hexagonal architecture state access.
 * ============================================
 */

"use client"

import { useState } from "react"
import { AppProvider } from "@/src/shared/presentation/app-context"
import { BottomNav, type NavTab } from "@/src/shared/presentation/components/bottom-nav"
import { DashboardScreen } from "@/src/dashboard/presentation/dashboard-screen"
import { GoalsGridScreen } from "@/src/goals/presentation/goals-grid-screen"
import { SkillRadarScreen } from "@/src/skills/presentation/skill-radar-screen"
import { TasksScreen } from "@/src/tasks/presentation/tasks-screen"
import { CalendarScreen } from "@/src/calendar/presentation/calendar-screen"
import { StatsScreen } from "@/src/statistics/presentation/stats-screen"
import { SettingsScreen } from "@/src/settings/presentation/settings-screen"

function AppShell() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard")

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen onNavigate={setActiveTab} />
      case "goals":
        return <GoalsGridScreen />
      case "radar":
        return <SkillRadarScreen />
      case "tasks":
        return <TasksScreen />
      case "calendar":
        return <CalendarScreen />
      case "stats":
        return <StatsScreen />
      case "settings":
        return <SettingsScreen />
      default:
        return <DashboardScreen onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="relative min-h-svh bg-background cyber-grid-bg">
      <main className="mx-auto max-w-lg px-4 pb-20 pt-6">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
