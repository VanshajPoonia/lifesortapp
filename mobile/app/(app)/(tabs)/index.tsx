import React from "react"

import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"

import {
  EmptyState,
  ErrorState,
  ListItem,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionCard,
  SectionTitle,
  StatGrid,
} from "../../../src/components/ui"
import { apiRequest } from "../../../src/lib/api"
import { queryKeys } from "../../../src/lib/query-keys"
import type { DashboardSummary, OnboardingStatus } from "../../../src/lib/types"

export default function HomeScreen() {
  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiRequest<DashboardSummary>("/dashboard/summary"),
  })
  const onboardingQuery = useQuery({
    queryKey: queryKeys.onboarding,
    queryFn: () => apiRequest<OnboardingStatus>("/onboarding"),
  })

  if (summaryQuery.isLoading || onboardingQuery.isLoading) {
    return <LoadingState />
  }

  if (summaryQuery.isError) {
    return <ErrorState message={summaryQuery.error.message} onRetry={() => summaryQuery.refetch()} />
  }

  const summary = summaryQuery.data
  const onboarding = onboardingQuery.data
  if (!summary || !onboarding) {
    return <LoadingState />
  }

  return (
    <Screen scroll>
      <SectionTitle title="LifeSort" subtitle={summary.subscriptionBanner.message} />
      {!onboarding.onboardingCompleted ? (
        <SectionCard>
          <SectionTitle title="Finish setup" subtitle="Enable notifications and connect your calendar." />
          <PrimaryButton title="Continue onboarding" onPress={() => router.push("/(app)/onboarding")} />
        </SectionCard>
      ) : null}
      <StatGrid
        stats={[
          { label: "Tasks done", value: `${summary.stats.completedTasks}/${summary.stats.totalTasks}` },
          { label: "Goals done", value: `${summary.stats.completedGoals}/${summary.stats.totalGoals}` },
          { label: "Monthly income", value: `$${summary.stats.monthlyIncome.toFixed(0)}` },
          { label: "Monthly expenses", value: `$${summary.stats.monthlyExpenses.toFixed(0)}` },
        ]}
      />
      <SectionCard>
        <SectionTitle title="Upcoming" subtitle="Your next important items across modules." />
        {summary.upcoming.length === 0 ? (
          <EmptyState title="Nothing upcoming" body="Tasks, goals, and events will appear here." />
        ) : (
          summary.upcoming.map(item => (
            <ListItem
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              meta={item.date ? new Date(item.date).toLocaleDateString() : null}
            />
          ))
        )}
      </SectionCard>
    </Screen>
  )
}
