/**
 * ============================================
 * CALENDAR SCREEN - Presentation Layer
 * ============================================
 * Monthly calendar with neon indicators for
 * scheduled tasks and completed milestones.
 * Supports day selection to view tasks for
 * that specific date.
 * ============================================
 */

"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { CATEGORY_COLORS } from "@/src/shared/presentation/category-colors"
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"

const DAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0]
}

export function CalendarScreen() {
  const { tasks, completeTask } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

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
  const todayKey = toDateKey(new Date())

  const dayTasks = tasksByDate[selectedDate] || []

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
          Calendario
        </h1>
      </header>

      {/* Calendar */}
      <NeonCard glowColor="cyan">
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-md p-1.5 text-muted-foreground hover:text-neon-cyan transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-mono text-sm font-bold text-foreground">
            {MONTHS_ES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-md p-1.5 text-muted-foreground hover:text-neon-cyan transition-colors"
            aria-label="Mes siguiente"
          >
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
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayTasksList = tasksByDate[dateKey] || []
            const hasCompleted = dayTasksList.some((t) => t.status === "completed")
            const hasPending = dayTasksList.some((t) => t.status !== "completed")
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
                {/* Indicators */}
                {(hasCompleted || hasPending) && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {hasCompleted && <span className="h-1 w-1 rounded-full bg-neon-lime" />}
                    {hasPending && <span className="h-1 w-1 rounded-full bg-neon-orange" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </NeonCard>

      {/* Selected Day Tasks */}
      <div>
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">
          {selectedDate === todayKey ? "Hoy" : selectedDate}
          <span className="ml-2 text-muted-foreground font-normal">
            ({dayTasks.length} {dayTasks.length === 1 ? "tarea" : "tareas"})
          </span>
        </h2>
        {dayTasks.length === 0 ? (
          <NeonCard glowColor="cyan">
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Sin tareas para esta fecha
            </p>
          </NeonCard>
        ) : (
          <div className="flex flex-col gap-2">
            {dayTasks.map((task) => {
              const colors = CATEGORY_COLORS[task.skillCategoryId]
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
                    <p className="font-mono text-[9px] text-muted-foreground">
                      +{task.xpReward} XP
                    </p>
                  </div>
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: colors.hex }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
