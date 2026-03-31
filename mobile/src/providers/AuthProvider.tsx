import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

import { clearStoredToken, apiRequest, getStoredToken, setStoredToken } from "../lib/api"
import { configurePurchases, logOutPurchases } from "../lib/purchases"
import type { AuthResponse } from "../lib/types"

type AuthContextValue = {
  session: AuthResponse | null
  loading: boolean
  signIn: (input: { email: string; password: string }) => Promise<void>
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const token = await getStoredToken()
      if (!token) {
        setSession(null)
        return
      }

      const data = await apiRequest<AuthResponse>("/auth/me")
      setSession(data)
      await configurePurchases(String(data.user.id))
    } catch {
      await clearStoredToken()
      setSession(null)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      await refreshSession()
      setLoading(false)
    }

    void bootstrap()
  }, [])

  const signIn = async (input: { email: string; password: string }) => {
    const data = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
    })
    await setStoredToken(data.token)
    setSession(data)
    await configurePurchases(String(data.user.id))
  }

  const signUp = async (input: { name: string; email: string; password: string }) => {
    const data = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
    })
    await setStoredToken(data.token)
    setSession(data)
    await configurePurchases(String(data.user.id))
  }

  const signOut = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" })
    } finally {
      await clearStoredToken()
      await logOutPurchases()
      setSession(null)
    }
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
