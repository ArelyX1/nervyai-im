/**
 * ============================================
 * CALENDAR SCREEN - Presentation Layer
 * ============================================
 * Monthly calendar with:
 * - Neon indicators for tasks and goal entries
 * - Day selection for agenda view
 * - Tasks section per day
 * - "Objetivos del Dia" section with agenda-grid
 *   style cards and "+" button to log progress
 * ============================================
 */

"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { getCategoryColor } from "@/src/shared/presentation/category-colors"
import { hasEntryForDate, getCurrentStreak } from "@/src/goals/domain/goal.entity"
import { ChevronLeft, ChevronRight, CheckCircle2, Plus, Check, Flame } from "lucide-react"

const DAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0]
}

export function CalendarScreen() {
  const { tasks, goals, completeTask, logDailyGoalProgress } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const todayKey = toDateKey(new Date())

  /** Map of date -> tasks */
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {}
    for (const task of tasks) {
      if (task.dueDate) {
        if (!map[task.dueDate]) map[task.dueDate] = []
        map[task.dueDate].push(task)
      }
      if (task.completedAt) {
        const key = task.completedAt.split("T")[0]
        if (!map[key]) map[key] = []
        if (!map[key].find((t) => t.id === task.id)) {
          map[key].push(task)
        }
      }
    }
    return map
  }, [tasks])

  /** Set of dates with goal entries completed */
  const goalDates = useMemo(() => {
    const dates = new Set<string>()
    for (const goal of goals) {
      for (const entry of goal.entries) {
        if (entry.completed) dates.add(entry.date)
      }
    }
    return dates
  }, [goals])

  /** Build calendar grid */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const dayTasks = tasksByDate[selectedDate] || []
  const activeGoals = goals.filter((g) => g.status === "active")

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
          Calendario
        </h1>
      </header>

      {/* Calendar Grid */}
      <NeonCard glowColor="cyan">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-md p-1.5 text-muted-foreground hover:text-neon-cyan transition-colors" aria-label="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-mono text-sm font-bold text-foreground">
            {MONTHS_ES[month]} {year}
          </h2>
          <button onClick={nextMonth} className="rounded-md p-1.5 text-muted-foreground hover:text-neon-cyan transition-colors" aria-label="Mes siguiente">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAYS_ES.map((d) => (
            <div key={d} className="py-1 text-center font-mono text-[9px] font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayTasksList = tasksByDate[dateKey] || []
            const hasCompleted = dayTasksList.some((t) => t.status === "completed")
            const hasPending = dayTasksList.some((t) => t.status !== "completed")
            const hasGoalEntry = goalDates.has(dateKey)
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDate

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-md font-mono text-xs transition-all ${
                  isSelected
                    ? "bg-neon-cyan/20 text-neon-cyan neon-border"
                    : isToday
                      ? "bg-surface-3 text-foreground"
                      : "text-muted-foreground hover:bg-surface-2"
                }`}
              >
                <span className={isToday && !isSelected ? "font-bold text-neon-cyan" : ""}>
                  {day}
                </span>
                {(hasCompleted || hasPending || hasGoalEntry) && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {hasCompleted && <span className="h-1 w-1 rounded-full bg-neon-lime" />}
                    {hasPending && <span className="h-1 w-1 rounded-full bg-neon-orange" />}
                    {hasGoalEntry && <span className="h-1 w-1 rounded-full bg-neon-magenta" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-lime" />
            <span className="font-mono text-[8px] text-muted-foreground">Completada</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-orange" />
            <span className="font-mono text-[8px] text-muted-foreground">Pendiente</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-magenta" />
            <span className="font-mono text-[8px] text-muted-foreground">Objetivo</span>
          </div>
        </div>
      </NeonCard>

      {/* Selected Day Heading */}
      <h2 className="font-mono text-sm font-semibold text-foreground">
        {selectedDate === todayKey ? "Hoy" : selectedDate}
      </h2>

      {/* ─── OBJETIVOS DEL DIA (Agenda Grid) ─── */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold text-neon-magenta">
          <span className="h-2 w-2 rounded-full bg-neon-magenta" />
          Objetivos del Dia
          <span className="text-muted-foreground font-normal">
            ({activeGoals.length})
          </span>
        </h3>

        {activeGoals.length === 0 ? (
          <NeonCard glowColor="magenta">
            <p className="py-3 text-center font-mono text-xs text-muted-foreground">
              Sin objetivos activos
            </p>
          </NeonCard>
        ) : (
          <div className="flex flex-col gap-2">
            {activeGoals.map((goal) => {
              const colors = getCategoryColor(goal.categoryId)
              const isDoneToday = hasEntryForDate(goal, selectedDate)
              const streak = getCurrentStreak(goal)

              return (
                <div
                  key={goal.id}
                  className={`flex items-center gap-3 rounded-lg border ${isDoneToday ? "border-neon-lime/30 bg-neon-lime/5" : `${colors.border} ${colors.bgFaded}`} px-3 py-3`}
                >
                  {/* Log button */}
                  <button
                    onClick={() => logDailyGoalProgress(goal.id, selectedDate)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-all ${
                      isDoneToday
                        ? "bg-neon-lime/20 text-neon-lime"
                        : `${colors.bg} ${colors.text} hover:opacity-80 active:scale-95`
                    }`}
                    aria-label={isDoneToday ? `Desmarcar ${goal.title}` : `Registrar ${goal.title}`}
                  >
                    {isDoneToday ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-xs font-semibold ${isDoneToday ? "text-neon-lime" : "text-foreground"}`}>
                      {goal.title}
                    </p>
                    {goal.dailyAction && (
                      <p className="font-mono text-[10px] text-muted-foreground truncate">
                        {goal.dailyAction}
                      </p>
                    )}
                  </div>

                  {/* Streak */}
                  {streak > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Flame className="h-3 w-3 text-neon-orange" />
                      <span className="font-mono text-[10px] font-bold text-neon-orange">{streak}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── TAREAS DEL DIA ─── */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold text-neon-cyan">
          <span className="h-2 w-2 rounded-full bg-neon-cyan" />
          Tareas
          <span className="text-muted-foreground font-normal">
            ({dayTasks.length})
          </span>
        </h3>

        {dayTasks.length === 0 ? (
          <NeonCard glowColor="cyan">
            <p className="py-3 text-center font-mono text-xs text-muted-foreground">
              Sin tareas para esta fecha
            </p>
          </NeonCard>
        ) : (
          <div className="flex flex-col gap-2">
            {dayTasks.map((task) => {
              const colors = getCategoryColor(task.skillCategoryId)
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border ${colors.border} ${colors.bgFaded} px-3 py-2.5`}
                >
                  <button
                    onClick={() => completeTask(task.id)}
                    disabled={task.status === "completed"}
                    className={task.status === "completed" ? "text-neon-lime" : "text-muted-foreground hover:text-neon-lime transition-colors"}
                    aria-label={`Completar ${task.title}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-xs font-semibold ${task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground">+{task.xpReward} XP</p>
                  </div>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors.hex }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
