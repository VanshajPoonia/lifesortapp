import React from "react"

import { Redirect } from "expo-router"

import { LoadingState } from "../src/components/ui"
import { useAuth } from "../src/providers/AuthProvider"

export default function IndexScreen() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />
  }

  if (!session.user.onboardingCompleted) {
    return <Redirect href="/(app)/onboarding" />
  }

  return <Redirect href="/(app)/(tabs)" />
}
