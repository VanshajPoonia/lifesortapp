import React, { useState } from "react"

import { router } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Text } from "react-native"

import {
  PrimaryButton,
  Screen,
  SectionCard,
  SectionTitle,
} from "../../src/components/ui"
import { apiRequest } from "../../src/lib/api"
import { connectGoogleCalendar } from "../../src/lib/calendar-auth"
import { requestNotificationPermission } from "../../src/lib/notifications"
import { queryKeys } from "../../src/lib/query-keys"
import { useAuth } from "../../src/providers/AuthProvider"

export default function OnboardingScreen() {
  const queryClient = useQueryClient()
  const { refreshSession } = useAuth()
  const [notificationPermission, setNotificationPermission] = useState<"unknown" | "granted" | "denied">("unknown")
  const [calendarConnected, setCalendarConnected] = useState(false)

  const notificationMutation = useMutation({
    mutationFn: () => requestNotificationPermission(),
    onSuccess: permission => {
      setNotificationPermission(permission)
    },
  })

  const calendarMutation = useMutation({
    mutationFn: () => connectGoogleCalendar(),
    onSuccess: success => {
      setCalendarConnected(success)
    },
  })

  const finishMutation = useMutation({
    mutationFn: () =>
      apiRequest("/onboarding", {
        method: "POST",
        body: {
          appPreferences: {
            mobileOnboardingCompleteAt: new Date().toISOString(),
          },
          notificationPermission,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding })
      await refreshSession()
      router.replace("/(app)/(tabs)")
    },
  })

  return (
    <Screen scroll>
      <SectionTitle title="Finish setup" subtitle="Make the mobile app feel like a real iPhone experience." />
      <SectionCard>
        <SectionTitle title="1. Notifications" subtitle="Enable local reminders for tasks, goals, and events." />
        <PrimaryButton title="Enable notifications" onPress={() => notificationMutation.mutate()} />
        <Text>Status: {notificationPermission}</Text>
      </SectionCard>
      <SectionCard>
        <SectionTitle title="2. Google Calendar" subtitle="Connect Google Calendar for synced events." />
        <PrimaryButton title="Connect Google Calendar" onPress={() => calendarMutation.mutate()} />
        <Text>Status: {calendarConnected ? "connected" : "not connected yet"}</Text>
      </SectionCard>
      <SectionCard>
        <PrimaryButton title="Finish onboarding" onPress={() => finishMutation.mutate()} />
      </SectionCard>
    </Screen>
  )
}
