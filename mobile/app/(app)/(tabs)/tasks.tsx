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
  buildTaskReminderDate,
  clearReminder,
  upsertReminder,
} from "../../../src/lib/notifications"
import { queryKeys } from "../../../src/lib/query-keys"
import type { Task } from "../../../src/lib/types"

type TaskForm = {
  id?: number
  title: string
  description: string
  dueDate: string | null
  completed: boolean
  remind: boolean
}

const emptyForm: TaskForm = {
  title: "",
  description: "",
  dueDate: null,
  completed: false,
  remind: false,
}

export default function TasksScreen() {
  const queryClient = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<TaskForm>(emptyForm)

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => (await apiRequest<{ items: Task[] }>("/tasks")).items,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = form.id ? "PUT" : "POST"
      const payload = await apiRequest<{ item: Task }>("/tasks", {
        method,
        body: {
          id: form.id,
          title: form.title,
          description: form.description || null,
          dueDate: form.dueDate,
          completed: form.completed,
        },
      })

      if (form.remind) {
        await upsertReminder({
          resourceType: "task",
          resourceId: payload.item.id,
          title: "Task due",
          body: payload.item.title,
          scheduledFor: buildTaskReminderDate(payload.item.dueDate),
        })
      } else {
        await clearReminder("task", payload.item.id)
      }

      return payload.item
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      setVisible(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/tasks?id=${id}`, { method: "DELETE" })
      await clearReminder("task", id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })

  if (tasksQuery.isLoading) {
    return <LoadingState />
  }

  if (tasksQuery.isError) {
    return <ErrorState message={tasksQuery.error.message} onRetry={() => tasksQuery.refetch()} />
  }

  const tasks = tasksQuery.data ?? []

  return (
    <Screen scroll>
      <SectionTitle title="Tasks" subtitle="Keep daily execution moving." />
      <PrimaryButton title="Add task" onPress={() => setVisible(true)} />
      <SectionCard>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks yet" body="Create your first task to start organizing today." />
        ) : (
          tasks.map(task => (
            <ListItem
              key={task.id}
              title={task.title}
              subtitle={task.description || "No description"}
              meta={task.dueDate || (task.completed ? "Completed" : "Open")}
              onPress={() => {
                setForm({
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  dueDate: task.dueDate,
                  completed: task.completed,
                  remind: false,
                })
                setVisible(true)
              }}
            />
          ))
        )}
      </SectionCard>
      <SheetModal visible={visible} title={form.id ? "Edit task" : "New task"} onClose={() => setVisible(false)}>
        <SectionCard>
          <TextField label="Title" value={form.title} onChangeText={value => setForm(current => ({ ...current, title: value }))} />
          <TextField
            label="Description"
            value={form.description}
            onChangeText={value => setForm(current => ({ ...current, description: value }))}
            multiline
          />
          <DateField label="Due date" value={form.dueDate} onChange={value => setForm(current => ({ ...current, dueDate: value }))} />
          <SwitchRow label="Completed" value={form.completed} onValueChange={value => setForm(current => ({ ...current, completed: value }))} />
          <SwitchRow label="Notify me on the due date" value={form.remind} onValueChange={value => setForm(current => ({ ...current, remind: value }))} />
          {saveMutation.isError ? <Text style={{ color: "#B42318" }}>{saveMutation.error.message}</Text> : null}
          <PrimaryButton title={form.id ? "Save task" : "Create task"} onPress={() => saveMutation.mutate()} />
          {form.id ? <PrimaryButton title="Delete task" onPress={() => deleteMutation.mutate(form.id!)} /> : null}
        </SectionCard>
      </SheetModal>
    </Screen>
  )
}
