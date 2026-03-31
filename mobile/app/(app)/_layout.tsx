import React from "react"

import { Redirect, Stack } from "expo-router"

import { LoadingState } from "../../src/components/ui"
import { useAuth } from "../../src/providers/AuthProvider"

export default function AppLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
