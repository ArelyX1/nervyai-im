/**
 * ============================================
 * SETTINGS SCREEN - Presentation Layer
 * ============================================
 * User settings and preferences including:
 * - Profile editing with PHOTO UPLOAD
 * - Theme selection
 * - Notification preferences
 * - Validation strictness toggle
 * - Language selection
 * - Data export
 * ============================================
 */

"use client"

import { useState, useRef } from "react"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import {
  User, Bell, Shield, Globe, Palette, Download,
  Save, Smartphone, Camera,
} from "lucide-react"

export function SettingsScreen() {
  const { user, settings, updateUser, updateSettings, loginAccount, logoutAccount, accountId, resetAll, saveNow } = useApp()
  const [nickname, setNickname] = useState(user.nickname)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveProfile = () => {
    updateUser({ nickname })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  /** Handle photo upload via file input */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    updateUser({ avatarUrl: url })
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
          Configuracion
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Personaliza tu experiencia NervyAI
        </p>
      </header>

      {/* Profile Section */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Perfil</h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {/* Avatar with upload overlay */}
            <div className="relative group shrink-0">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full neon-border bg-surface-2 glow-cyan">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-neon-cyan" />
                )}
              </div>
              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="h-5 w-5 text-neon-cyan" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label="Subir foto de perfil"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
            <span className="font-mono text-[10px] text-muted-foreground">Nivel</span>
            <span className="font-mono text-sm font-bold text-neon-cyan">{user.level}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
            <span className="font-mono text-[10px] text-muted-foreground">XP Total</span>
            <span className="font-mono text-sm font-bold text-neon-magenta">{user.totalXp.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveProfile}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-neon-cyan/15 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/25"
            >
              <Save className="h-3.5 w-3.5" />
              {saved ? "Guardado!" : "Guardar Perfil"}
            </button>
            <button
              onClick={async () => { await saveNow(); alert('Estado guardado en backend (si configurado)') }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-neon-magenta/10 py-2 font-mono text-xs font-semibold text-neon-magenta neon-border-magenta transition-all hover:bg-neon-magenta/20"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar Todo
            </button>
          </div>
        </div>
      </NeonCard>

      {/* Theme */}
      <NeonCard glowColor="magenta">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-neon-magenta" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Tema</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["cyberpunk", "neon-blue", "neon-magenta"] as const).map((theme) => {
            const labels = { cyberpunk: "Cyberpunk", "neon-blue": "Neon Azul", "neon-magenta": "Neon Rosa" }
            const active = settings.theme === theme
            return (
              <button
                key={theme}
                onClick={() => updateSettings({ theme })}
                className={`rounded-lg px-3 py-2.5 font-mono text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-neon-magenta/20 text-neon-magenta neon-border-magenta"
                    : "bg-surface-2 text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {labels[theme]}
              </button>
            )
          })}
        </div>
      </NeonCard>

      {/* Notifications */}
      <NeonCard glowColor="lime">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-neon-lime" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Notificaciones</h2>
        </div>
        <div className="flex flex-col gap-3">
          <SettingsToggle
            label="Notificaciones activas"
            value={settings.notificationsEnabled}
            onChange={(v) => updateSettings({ notificationsEnabled: v })}
          />
          <div>
            <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
              Recordatorio diario
            </label>
            <input
              type="time"
              value={settings.dailyReminderTime}
              onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-lime"
            />
          </div>
        </div>
      </NeonCard>

      {/* Backend Sync */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Sincronizacion</h2>
        </div>
        <BackendConfig />
      </NeonCard>

      {/* Validation */}
      <NeonCard glowColor="orange">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-neon-orange" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Validacion</h2>
        </div>
        <SettingsToggle
          label="Modo estricto (requiere pruebas)"
          value={settings.strictValidation}
          onChange={(v) => updateSettings({ strictValidation: v })}
        />
        <p className="mt-2 font-mono text-[9px] text-muted-foreground">
          Cuando esta activo, las tareas con reglas de validacion necesitan pruebas adicionales para completarse.
        </p>
      </NeonCard>

      {/* Language */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Idioma</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["es", "en"] as const).map((lang) => {
            const labels = { es: "Espanol", en: "English" }
            const active = settings.language === lang
            return (
              <button
                key={lang}
                onClick={() => updateSettings({ language: lang })}
                className={`rounded-lg px-3 py-2.5 font-mono text-xs font-semibold transition-all ${
                  active
                    ? "bg-neon-cyan/20 text-neon-cyan neon-border"
                    : "bg-surface-2 text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {labels[lang]}
              </button>
            )
          })}
        </div>
      </NeonCard>

      {/* Export */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Exportar Datos</h2>
        </div>
        <p className="mb-3 font-mono text-[10px] text-muted-foreground">
          Descarga tus datos de progreso, tareas y habilidades en formato JSON.
        </p>
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-2 py-2.5 font-mono text-xs font-semibold text-muted-foreground border border-border hover:text-foreground transition-colors">
          <Download className="h-3.5 w-3.5" />
          Exportar JSON
        </button>
      </NeonCard>

      {/* App Info */}
      <div className="flex flex-col items-center gap-1 py-4">
        <p className="font-mono text-xs font-bold text-neon-cyan text-glow-cyan">NervyAI I.M.</p>
        <p className="font-mono text-[10px] text-muted-foreground">v2.0.0 | Desarrollo Personal</p>
        <div className="flex items-center gap-1 mt-1">
          <Smartphone className="h-3 w-3 text-muted-foreground" />
          <p className="font-mono text-[9px] text-muted-foreground">Powered by NervyAI</p>
        </div>
      </div>
      {/* Account */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Cuenta</h2>
        </div>
        <div className="flex flex-col gap-3">
          {accountId ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-bold text-neon-cyan">{accountId}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Conectado</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { logoutAccount() }}
                  className="rounded-lg px-3 py-2 text-xs font-semibold bg-surface-2 border border-border"
                >Cerrar Sesión</button>
                <button
                  onClick={() => { resetAll() }}
                  className="rounded-lg px-3 py-2 text-xs font-semibold bg-neon-cyan/10 text-neon-cyan neon-border"
                >Reset All</button>
              </div>
            </div>
          ) : (
            <AccountLoginForm onLogin={async (u, p, mode) => {
              const res = await loginAccount(u, p, mode)
              if (!res?.ok) alert(res?.error === 'invalid_pin' ? 'PIN incorrecto' : res?.error === 'account_exists' ? 'Esa cuenta ya existe' : 'Login fallido')
              return res
            }} />
          )}
        </div>
      </NeonCard>
    </div>
  )
}

/** Reusable toggle switch */
function SettingsToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={`relative h-6 w-11 rounded-full transition-all ${value ? "bg-neon-cyan/30" : "bg-surface-3"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-all ${
            value ? "translate-x-5 bg-neon-cyan glow-cyan" : "bg-muted-foreground"
          }`}
        />
      </button>
    </div>
  )
}

function AccountLoginForm({ onLogin }: { onLogin: (username: string, pin: string) => Promise<void> }) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!username?.trim() || !/^[0-9]{4,}$/.test(pin)) {
      alert('Usuario y PIN (4+ dígitos) requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await onLogin(username.trim(), pin.trim())
      if (res?.ok && res.found) alert('Cuenta encontrada. Sesión iniciada.')
      else if (res?.ok && res.created) alert('Cuenta creada y sincronizada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="mb-1 block font-mono text-[10px] text-muted-foreground">Usuario</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground" />
      </div>
      <div>
        <label className="mb-1 block font-mono text-[10px] text-muted-foreground">PIN (4+ dígitos)</label>
        <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground" />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading} className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold bg-neon-cyan/15 text-neon-cyan neon-border">{loading ? 'Entrando...' : 'Entrar / Crear'}</button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">Si el usuario no existe se creará una cuenta nueva con este PIN y tu estado actual.</p>
    </div>
  )
}

function BackendConfig() {
  const [url, setUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('backendUrl') || '' : ''))
  const [enabled, setEnabled] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('useBackend') === 'true' : false))

  const apply = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem('backendUrl', url)
    localStorage.setItem('useBackend', enabled ? 'true' : 'false')
    alert('Configuracion guardada. Si activaste el backend, asegúrate de que el servidor esté corriendo y refresca la página.')
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block font-mono text-[10px] text-muted-foreground">Backend URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:4001" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-foreground">Usar backend</span>
        <button onClick={() => setEnabled(!enabled)} role="switch" aria-checked={enabled} className={`relative h-6 w-11 rounded-full transition-all ${enabled ? "bg-neon-cyan/30" : "bg-surface-3"}`}>
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-all ${enabled ? "translate-x-5 bg-neon-cyan glow-cyan" : "bg-muted-foreground"}`} />
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={apply} className="rounded-lg px-3 py-2 text-xs font-semibold bg-neon-cyan/15 text-neon-cyan neon-border">Guardar</button>
      </div>
    </div>
  )
}
