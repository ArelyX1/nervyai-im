/**
 * ============================================
 * APP CONTEXT - Presentation Layer
 * ============================================
 * React Context provider that makes the app
 * store available to all child components.
 * ============================================
 */

"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAppStore, type AppStore } from "./use-app-store"

const AppContext = createContext<AppStore | null>(null)

/** Provider component - wrap your app with this */
export function AppProvider({ children }: { children: ReactNode }) {
  const store = useAppStore()
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

/** Hook to access the app store from any component */
export function useApp(): AppStore {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within <AppProvider>")
  return ctx
}
