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

import React, { useState } from "react"
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

function BackendHealthCheck() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [backendUrl, setBackendUrl] = useState<string>('')

  React.useEffect(() => {
    const checkBackend = async () => {
      // Try to detect backend URL same way as useAppStore
      let url = localStorage.getItem('backendUrl')
      if (!url) {
        const hostname = window.location.hostname
        if (hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
          url = `http://${hostname}:4001/api/health`
        } else {
          url = `http://app.neravy.us:4001/api/health`
        }
      } else {
        url = url + '/health'
      }
      
      setBackendUrl(url)
      console.log('[HEALTH] Checking:', url)
      
      try {
        const res = await fetch(url)
        if (res.ok) {
          console.log('[HEALTH] ✅ Backend online:', url)
          setBackendStatus('online')
        } else {
          console.error('[HEALTH] ❌ HTTP', res.status, res.statusText, 'from:', url)
          setBackendStatus('offline')
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        if (errMsg.includes('NetworkError') || errMsg.includes('Failed to fetch')) {
          console.error('[HEALTH] ❌ Network Error (CORS?) - Backend may be down or wrong URL:', url)
        } else {
          console.error('[HEALTH] ❌ Connection failed:', errMsg)
        }
        setBackendStatus('offline')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = backendStatus === 'online' ? 'text-neon-cyan' : backendStatus === 'offline' ? 'text-neon-magenta' : 'text-yellow-400'
  const statusText = backendStatus === 'online' ? '✅ Backend Online' : backendStatus === 'offline' ? '❌ Backend Offline' : '⏳ Checking...'

  return (
    <div className={`font-mono text-xs ${statusColor} mb-4`}>
      {statusText}
      {backendStatus === 'offline' && backendUrl && (
        <div className="text-xs text-muted-foreground mt-1">
          Tried: {backendUrl}
        </div>
      )}
    </div>
  )
}

function LoginScreen({ onSuccess }: { onSuccess?: () => void }) {
  const { loginAccount } = useApp()
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [user, setUser] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    console.log('[LOGIN] Starting login/create process')
    setError(null)
    if (!user.trim()) return setError('Introduce un usuario')
    if (!/^[0-9]{4,}$/.test(pin)) return setError('El PIN debe tener al menos 4 dígitos')
    setLoading(true)
    console.log('[LOGIN] Calling loginAccount with:', { user: user.trim(), pin, mode })
    try {
      const res = await loginAccount(user.trim(), pin, mode)
      console.log('[LOGIN] loginAccount response:', res)
      if (!res || !res.ok) {
        if (res?.error === 'invalid_pin') return setError('PIN incorrecto')
        if (res?.error === 'account_exists') return setError('Esa cuenta ya existe. Usa Iniciar sesión.')
        if (res?.error === 'account_not_found') return setError('Cuenta no encontrada. Crea una nueva.')
        return setError('Error de conexión. Verifica la URL del backend.')
      }
      console.log('[LOGIN] Login successful, account created/logged in')
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <BackendHealthCheck />
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

      <ClearDataButton />
    </div>
  )
}

const SECURITY_CODE = "369"

function ClearDataButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState<string | null>(null)

  const handleClear = () => {
    setCodeError(null)
    if (code !== SECURITY_CODE) {
      setCodeError("Código incorrecto")
      return
    }
    if (typeof window === "undefined") return
    // Borrar estado de la app
    localStorage.removeItem("nervyai-app-state")
    localStorage.removeItem("accountId")
    localStorage.removeItem("accountPin")
    localStorage.removeItem("backendUrl")
    localStorage.removeItem("useBackend")
    // Borrar cuentas locales
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("local_account_")) keysToRemove.push(key)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    setShowConfirm(false)
    setCode("")
    window.location.reload()
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="mt-2 font-mono text-[10px] text-muted-foreground hover:text-red-400 transition-colors underline"
      >
        Limpiar JSON (borrar todos los datos guardados)
      </button>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="font-mono text-[10px] text-muted-foreground mb-2">
        Código de seguridad para borrar todos los datos:
      </p>
      <input
        type="password"
        inputMode="numeric"
        value={code}
        onChange={(e) => { setCode(e.target.value); setCodeError(null) }}
        placeholder="Código"
        maxLength={6}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm mb-2"
      />
      {codeError && (
        <p className="font-mono text-xs text-red-400 mb-2">{codeError}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 rounded-lg bg-red-500/20 py-2 font-mono text-xs text-red-400 border border-red-500/40"
        >
          Borrar todo
        </button>
        <button
          type="button"
          onClick={() => { setShowConfirm(false); setCode(""); setCodeError(null) }}
          className="rounded-lg bg-surface-3 py-2 px-3 font-mono text-xs text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
