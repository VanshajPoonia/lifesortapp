import React, { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Text } from "react-native"

import { DateField, TimeField } from "../../../src/components/date-time-fields"
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
  buildCalendarReminderDate,
  clearReminder,
  upsertReminder,
} from "../../../src/lib/notifications"
import { queryKeys } from "../../../src/lib/query-keys"
import type { CalendarEvent } from "../../../src/lib/types"

type CalendarForm = {
  id?: number
  title: string
  description: string
  eventDate: string | null
  startTime: string | null
  endTime: string | null
  remind: boolean
}

const emptyForm: CalendarForm = {
  title: "",
  description: "",
  eventDate: null,
  startTime: null,
  endTime: null,
  remind: false,
}

export default function CalendarScreen() {
  const queryClient = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<CalendarForm>(emptyForm)

  const localEventsQuery = useQuery({
    queryKey: queryKeys.calendarEvents,
    queryFn: async () => (await apiRequest<{ items: CalendarEvent[] }>("/calendar-events")).items,
  })

  const syncedEventsQuery = useQuery({
    queryKey: queryKeys.calendarSync,
    queryFn: async () => (await apiRequest<{ items: Array<any> }>("/calendar/sync")).items,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = await apiRequest<{ item: CalendarEvent }>("/calendar-events", {
        method: form.id ? "PUT" : "POST",
        body: {
          id: form.id,
          title: form.title,
          description: form.description || null,
          eventDate: form.eventDate,
          startTime: form.startTime,
          endTime: form.endTime,
        },
      })

      if (form.remind) {
        await upsertReminder({
          resourceType: "calendar",
          resourceId: payload.item.id,
          title: "Upcoming event",
          body: payload.item.title,
          scheduledFor: buildCalendarReminderDate(payload.item.eventDate, payload.item.startTime),
        })
      } else {
        await clearReminder("calendar", payload.item.id)
      }

      return payload.item
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendarEvents })
      setVisible(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/calendar-events?id=${id}`, { method: "DELETE" })
      await clearReminder("calendar", id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendarEvents })
    },
  })

  if (localEventsQuery.isLoading || syncedEventsQuery.isLoading) {
    return <LoadingState />
  }

  if (localEventsQuery.isError) {
    return <ErrorState message={localEventsQuery.error.message} onRetry={() => localEventsQuery.refetch()} />
  }

  const localEvents = localEventsQuery.data ?? []
  const syncedEvents = syncedEventsQuery.data ?? []

  return (
    <Screen scroll>
      <SectionTitle title="Calendar" subtitle="Local events plus synced Google events." />
      <PrimaryButton title="Add event" onPress={() => setVisible(true)} />
      <SectionCard>
        <SectionTitle title="Your events" />
        {localEvents.length === 0 ? (
          <EmptyState title="No local events" body="Create events you want to see on iPhone first." />
        ) : (
          localEvents.map(event => (
            <ListItem
              key={event.id}
              title={event.title}
              subtitle={event.description}
              meta={event.eventDate || null}
              onPress={() => {
                setForm({
                  id: event.id,
                  title: event.title,
                  description: event.description || "",
                  eventDate: event.eventDate,
                  startTime: event.startTime,
                  endTime: event.endTime,
                  remind: false,
                })
                setVisible(true)
              }}
            />
          ))
        )}
      </SectionCard>
      <SectionCard>
        <SectionTitle title="Google events" />
        {syncedEvents.length === 0 ? (
          <EmptyState title="Nothing synced yet" body="Connect Google Calendar from Settings or Onboarding." />
        ) : (
          syncedEvents.map(event => (
            <ListItem
              key={event.id}
              title={event.title}
              subtitle={event.description || "Google Calendar"}
              meta={event.start ? new Date(event.start).toLocaleString() : null}
            />
          ))
        )}
      </SectionCard>
      <SheetModal visible={visible} title={form.id ? "Edit event" : "New event"} onClose={() => setVisible(false)}>
        <SectionCard>
          <TextField label="Title" value={form.title} onChangeText={value => setForm(current => ({ ...current, title: value }))} />
          <TextField
            label="Description"
            value={form.description}
            onChangeText={value => setForm(current => ({ ...current, description: value }))}
            multiline
          />
          <DateField label="Date" value={form.eventDate} onChange={value => setForm(current => ({ ...current, eventDate: value }))} />
          <TimeField label="Start time" value={form.startTime} onChange={value => setForm(current => ({ ...current, startTime: value }))} />
          <TimeField label="End time" value={form.endTime} onChange={value => setForm(current => ({ ...current, endTime: value }))} />
          <SwitchRow label="Notify me 1 hour before" value={form.remind} onValueChange={value => setForm(current => ({ ...current, remind: value }))} />
          {saveMutation.isError ? <Text style={{ color: "#B42318" }}>{saveMutation.error.message}</Text> : null}
          <PrimaryButton title={form.id ? "Save event" : "Create event"} onPress={() => saveMutation.mutate()} />
          {form.id ? <PrimaryButton title="Delete event" onPress={() => deleteMutation.mutate(form.id!)} /> : null}
        </SectionCard>
      </SheetModal>
    </Screen>
  )
}
