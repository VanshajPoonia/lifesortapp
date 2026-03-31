import React, { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Text } from "react-native"

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
  TextField,
} from "../../src/components/ui"
import { apiRequest } from "../../src/lib/api"
import { queryKeys } from "../../src/lib/query-keys"
import type { Note } from "../../src/lib/types"

type NoteForm = {
  id?: number
  title: string
  content: string
}

const emptyForm: NoteForm = {
  title: "",
  content: "",
}

export default function NotesScreen() {
  const queryClient = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<NoteForm>(emptyForm)

  const notesQuery = useQuery({
    queryKey: queryKeys.notes,
    queryFn: async () => (await apiRequest<{ items: Note[] }>("/notes")).items,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ item: Note }>("/notes", {
        method: form.id ? "PUT" : "POST",
        body: {
          id: form.id,
          title: form.title,
          content: form.content,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notes })
      setVisible(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/notes?id=${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notes })
    },
  })

  if (notesQuery.isLoading) {
    return <LoadingState />
  }

  if (notesQuery.isError) {
    return <ErrorState message={notesQuery.error.message} onRetry={() => notesQuery.refetch()} />
  }

  const notes = notesQuery.data ?? []

  return (
    <Screen scroll>
      <SectionTitle title="Notes" subtitle="Quick capture for loose ideas." />
      <PrimaryButton title="Add note" onPress={() => setVisible(true)} />
      <SectionCard>
        {notes.length === 0 ? (
          <EmptyState title="No notes yet" body="Capture your first note here." />
        ) : (
          notes.map(note => (
            <ListItem
              key={note.id}
              title={note.title}
              subtitle={note.content.slice(0, 80)}
              meta={note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : null}
              onPress={() => {
                setForm({
                  id: note.id,
                  title: note.title,
                  content: note.content,
                })
                setVisible(true)
              }}
            />
          ))
        )}
      </SectionCard>
      <SheetModal visible={visible} title={form.id ? "Edit note" : "New note"} onClose={() => setVisible(false)}>
        <SectionCard>
          <TextField label="Title" value={form.title} onChangeText={value => setForm(current => ({ ...current, title: value }))} />
          <TextField
            label="Content"
            value={form.content}
            onChangeText={value => setForm(current => ({ ...current, content: value }))}
            multiline
          />
          {saveMutation.isError ? <Text style={{ color: "#B42318" }}>{saveMutation.error.message}</Text> : null}
          <PrimaryButton title={form.id ? "Save note" : "Create note"} onPress={() => saveMutation.mutate()} />
          {form.id ? <PrimaryButton title="Delete note" onPress={() => deleteMutation.mutate(form.id!)} /> : null}
        </SectionCard>
      </SheetModal>
    </Screen>
  )
}
