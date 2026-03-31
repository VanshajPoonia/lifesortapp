import React, { useEffect, useState } from "react"

import { router } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Text } from "react-native"

import {
  ErrorState,
  ListItem,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionCard,
  SectionTitle,
  TextField,
} from "../../src/components/ui"
import { apiRequest } from "../../src/lib/api"
import { connectGoogleCalendar } from "../../src/lib/calendar-auth"
import { restorePurchases } from "../../src/lib/purchases"
import { queryKeys } from "../../src/lib/query-keys"
import type { Profile, Subscription } from "../../src/lib/types"
import { useAuth } from "../../src/providers/AuthProvider"

type ProfileForm = {
  name: string
  bio: string
  phone: string
  location: string
  dateOfBirth: string
}

const emptyProfile: ProfileForm = {
  name: "",
  bio: "",
  phone: "",
  location: "",
  dateOfBirth: "",
}

export default function SettingsScreen() {
  const queryClient = useQueryClient()
  const { signOut } = useAuth()
  const [form, setForm] = useState<ProfileForm>(emptyProfile)
  const [message, setMessage] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => (await apiRequest<{ profile: Profile }>("/profile")).profile,
  })
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: async () => (await apiRequest<{ subscription: Subscription; canRestorePurchases: boolean }>("/subscription")),
  })
  const integrationsQuery = useQuery({
    queryKey: queryKeys.calendarIntegrations,
    queryFn: () => apiRequest<{ integrations: Array<{ provider: string; email: string | null }> }>("/calendar/integrations"),
  })

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        name: profileQuery.data.name || "",
        bio: profileQuery.data.bio || "",
        phone: profileQuery.data.phone || "",
        location: profileQuery.data.location || "",
        dateOfBirth: profileQuery.data.dateOfBirth || "",
      })
    }
  }, [profileQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ profile: Profile }>("/profile", {
        method: "PUT",
        body: {
          name: form.name || null,
          bio: form.bio || null,
          phone: form.phone || null,
          location: form.location || null,
          dateOfBirth: form.dateOfBirth || null,
        },
      }),
    onSuccess: async () => {
      setMessage("Profile saved.")
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile })
    },
  })

  const connectMutation = useMutation({
    mutationFn: () => connectGoogleCalendar(),
    onSuccess: async connected => {
      setMessage(connected ? "Google Calendar connected." : "Calendar connection cancelled.")
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendarIntegrations })
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendarSync })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restorePurchases(),
    onSuccess: async () => {
      setMessage("Purchases restored. Syncing subscription state.")
      await queryClient.invalidateQueries({ queryKey: queryKeys.subscription })
    },
  })

  if (profileQuery.isLoading || subscriptionQuery.isLoading || integrationsQuery.isLoading) {
    return <LoadingState />
  }

  if (profileQuery.isError) {
    return <ErrorState message={profileQuery.error.message} onRetry={() => profileQuery.refetch()} />
  }

  const subscriptionData = subscriptionQuery.data
  const integrationsData = integrationsQuery.data
  if (!subscriptionData || !integrationsData) {
    return <LoadingState />
  }

  const subscription = subscriptionData.subscription
  const googleIntegration = integrationsData.integrations.find(item => item.provider === "google")

  return (
    <Screen scroll>
      <SectionTitle title="Settings" subtitle="Profile, subscription, and integrations." />
      <SectionCard>
        <SectionTitle title="Profile" />
        <TextField label="Name" value={form.name} onChangeText={value => setForm(current => ({ ...current, name: value }))} />
        <TextField label="Bio" value={form.bio} onChangeText={value => setForm(current => ({ ...current, bio: value }))} multiline />
        <TextField label="Phone" value={form.phone} onChangeText={value => setForm(current => ({ ...current, phone: value }))} />
        <TextField label="Location" value={form.location} onChangeText={value => setForm(current => ({ ...current, location: value }))} />
        <TextField label="Date of birth" value={form.dateOfBirth} onChangeText={value => setForm(current => ({ ...current, dateOfBirth: value }))} placeholder="YYYY-MM-DD" />
        <PrimaryButton title="Save profile" onPress={() => saveMutation.mutate()} />
      </SectionCard>
      <SectionCard>
        <SectionTitle title="Subscription" subtitle={`Status: ${subscription.status}`} />
        <ListItem title="Source" meta={subscription.source} />
        <ListItem title="Ends at" meta={subscription.endsAt || subscription.trialEndsAt || "Open-ended"} />
        <PrimaryButton title="Restore purchases" onPress={() => restoreMutation.mutate()} />
      </SectionCard>
      <SectionCard>
        <SectionTitle title="Google Calendar" subtitle={googleIntegration?.email || "Not connected"} />
        <PrimaryButton title="Connect Google Calendar" onPress={() => connectMutation.mutate()} />
      </SectionCard>
      {message ? (
        <SectionCard>
          <Text style={{ color: "#0F766E" }}>{message}</Text>
        </SectionCard>
      ) : null}
      <SectionCard>
        <PrimaryButton
          title="Sign out"
          onPress={async () => {
            await signOut()
            router.replace("/(auth)/sign-in")
          }}
        />
      </SectionCard>
    </Screen>
  )
}
