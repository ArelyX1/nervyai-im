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
import { AppProvider, useApp } from "@/src/shared/presentation/app-context"
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
  const app = useApp()

  // If no account is active, show a blocking login overlay
  if (!app.accountId) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-surface-2 p-6 neon-border">
            <h2 className="font-mono text-lg font-bold text-foreground mb-2">Acceso</h2>
            <p className="font-mono text-xs text-muted-foreground mb-4">
              Inicia sesión o crea una cuenta. Tu estado se sincroniza entre dispositivos.
            </p>
            <LoginScreen onSuccess={() => { /* no-op */ }} />
          </div>
        </div>
      </div>
    )
  }

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

function LoginScreen({ onSuccess }: { onSuccess?: () => void }) {
  const { loginAccount } = useApp()
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [backendUrl, setBackendUrl] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('backendUrl') || '' : ''
  )
  const [user, setUser] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!user.trim()) return setError('Introduce un usuario')
    if (!/^[0-9]{4,}$/.test(pin)) return setError('El PIN debe tener al menos 4 dígitos')
    if (backendUrl.trim()) {
      if (typeof window !== 'undefined') {
        let u = backendUrl.trim().replace(/\/$/, '')
        if (!u.endsWith('/api')) u = u + (u.endsWith('/') ? 'api' : '/api')
        localStorage.setItem('backendUrl', u)
        localStorage.setItem('useBackend', 'true')
      }
    }
    setLoading(true)
    try {
      const res = await loginAccount(user.trim(), pin, mode)
      if (!res || !res.ok) {
        if (res?.error === 'invalid_pin') return setError('PIN incorrecto')
        if (res?.error === 'account_exists') return setError('Esa cuenta ya existe. Usa Iniciar sesión.')
        if (res?.error === 'account_not_found') return setError('Cuenta no encontrada. Crea una nueva.')
        return setError('Error de conexión. Verifica la URL del backend.')
      }
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Backend URL (optional) - needed for multi-device sync */}
      <div>
        <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
          URL del backend (opcional)
        </label>
        <input
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          placeholder="http://localhost:4001"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
        />
        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
          Para sincronizar entre dispositivos, usa la URL de tu servidor.
        </p>
      </div>

      {/* Tabs: Iniciar sesión / Crear cuenta */}
      <div className="flex gap-2 rounded-lg bg-surface-3 p-1">
        <button
          onClick={() => { setMode('login'); setError(null) }}
          className={`flex-1 rounded-md py-2 font-mono text-xs font-semibold transition-all ${
            mode === 'login'
              ? 'bg-neon-cyan/20 text-neon-cyan neon-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => { setMode('create'); setError(null) }}
          className={`flex-1 rounded-md py-2 font-mono text-xs font-semibold transition-all ${
            mode === 'create'
              ? 'bg-neon-magenta/20 text-neon-magenta neon-border-magenta'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <input
        value={user}
        onChange={(e) => setUser(e.target.value)}
        placeholder="Usuario"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
      />
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="PIN (4 dígitos)"
        maxLength={8}
        inputMode="numeric"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
      />
      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 rounded-lg bg-neon-cyan/15 py-2 font-mono text-sm text-neon-cyan neon-border disabled:opacity-60"
        >
          {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  )
}
