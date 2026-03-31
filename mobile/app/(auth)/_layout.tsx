import React from "react"

import { Redirect, Stack } from "expo-router"

import { LoadingState } from "../../src/components/ui"
import { useAuth } from "../../src/providers/AuthProvider"

export default function AuthLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
