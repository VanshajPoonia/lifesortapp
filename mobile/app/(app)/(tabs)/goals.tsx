import React, { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Text } from "react-native"

import { DateField } from "../../../src/components/date-time-fields"
import {
  EmptyState,
  ErrorState,
  ListItem,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionCard,
  SectionTitle,
  SheetModal,
  SwitchRow,
  TextField,
} from "../../../src/components/ui"
import { apiRequest } from "../../../src/lib/api"
import {
  buildGoalReminderDate,
  clearReminder,
  upsertReminder,
} from "../../../src/lib/notifications"
import { queryKeys } from "../../../src/lib/query-keys"
import type { Goal } from "../../../src/lib/types"

type GoalForm = {
  id?: number
  title: string
  description: string
  targetDate: string | null
  progress: string
  remind: boolean
}

const emptyForm: GoalForm = {
  title: "",
  description: "",
  targetDate: null,
  progress: "0",
  remind: false,
}

export default function GoalsScreen() {
  const queryClient = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<GoalForm>(emptyForm)

  const goalsQuery = useQuery({
    queryKey: queryKeys.goals,
    queryFn: async () => (await apiRequest<{ items: Goal[] }>("/goals")).items,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = await apiRequest<{ item: Goal }>("/goals", {
        method: form.id ? "PUT" : "POST",
        body: {
          id: form.id,
          title: form.title,
          description: form.description || null,
          targetDate: form.targetDate,
          progress: Number(form.progress || 0),
          reminderEnabled: form.remind,
          reminderDays: form.remind ? 0 : null,
        },
      })

      if (form.remind) {
        await upsertReminder({
          resourceType: "goal",
          resourceId: payload.item.id,
          title: "Goal reminder",
          body: payload.item.title,
          scheduledFor: buildGoalReminderDate(payload.item.targetDate),
        })
      } else {
        await clearReminder("goal", payload.item.id)
      }

      return payload.item
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals })
      setVisible(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/goals?id=${id}`, { method: "DELETE" })
      await clearReminder("goal", id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals })
    },
  })

  if (goalsQuery.isLoading) {
    return <LoadingState />
  }

  if (goalsQuery.isError) {
    return <ErrorState message={goalsQuery.error.message} onRetry={() => goalsQuery.refetch()} />
  }

  const goals = goalsQuery.data ?? []

  return (
    <Screen scroll>
      <SectionTitle title="Goals" subtitle="Track progress toward longer arcs." />
      <PrimaryButton title="Add goal" onPress={() => setVisible(true)} />
      <SectionCard>
        {goals.length === 0 ? (
          <EmptyState title="No goals yet" body="Create one long-term target to get started." />
        ) : (
          goals.map(goal => (
            <ListItem
              key={goal.id}
              title={goal.title}
              subtitle={`Progress ${goal.progress}%`}
              meta={goal.targetDate || goal.status}
              onPress={() => {
                setForm({
                  id: goal.id,
                  title: goal.title,
                  description: goal.description || "",
                  targetDate: goal.targetDate,
                  progress: String(goal.progress || 0),
                  remind: goal.reminderEnabled,
                })
                setVisible(true)
              }}
            />
          ))
        )}
      </SectionCard>
      <SheetModal visible={visible} title={form.id ? "Edit goal" : "New goal"} onClose={() => setVisible(false)}>
        <SectionCard>
          <TextField label="Title" value={form.title} onChangeText={value => setForm(current => ({ ...current, title: value }))} />
          <TextField
            label="Description"
            value={form.description}
            onChangeText={value => setForm(current => ({ ...current, description: value }))}
            multiline
          />
          <DateField label="Target date" value={form.targetDate} onChange={value => setForm(current => ({ ...current, targetDate: value }))} />
          <TextField
            label="Progress"
            value={form.progress}
            onChangeText={value => setForm(current => ({ ...current, progress: value }))}
            placeholder="0-100"
          />
          <SwitchRow label="Notify me on the target date" value={form.remind} onValueChange={value => setForm(current => ({ ...current, remind: value }))} />
          {saveMutation.isError ? <Text style={{ color: "#B42318" }}>{saveMutation.error.message}</Text> : null}
          <PrimaryButton title={form.id ? "Save goal" : "Create goal"} onPress={() => saveMutation.mutate()} />
          {form.id ? <PrimaryButton title="Delete goal" onPress={() => deleteMutation.mutate(form.id!)} /> : null}
        </SectionCard>
      </SheetModal>
    </Screen>
  )
}
