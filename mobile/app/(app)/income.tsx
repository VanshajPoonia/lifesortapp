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
  SwitchRow,
  TextField,
} from "../../src/components/ui"
import { apiRequest } from "../../src/lib/api"
import { queryKeys } from "../../src/lib/query-keys"
import type { IncomeSource } from "../../src/lib/types"

type IncomeForm = {
  id?: number
  name: string
  type: string
  amount: string
  frequency: string
  active: boolean
}

const emptyForm: IncomeForm = {
  name: "",
  type: "",
  amount: "",
  frequency: "monthly",
  active: true,
}

export default function IncomeScreen() {
  const queryClient = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState<IncomeForm>(emptyForm)

  const incomeQuery = useQuery({
    queryKey: queryKeys.income,
    queryFn: async () => (await apiRequest<{ items: IncomeSource[] }>("/income")).items,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ item: IncomeSource }>("/income", {
        method: form.id ? "PUT" : "POST",
        body: {
          id: form.id,
          name: form.name,
          type: form.type,
          amount: Number(form.amount || 0),
          frequency: form.frequency,
          active: form.active,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.income })
      await queryClient.invalidateQueries({ queryKey: queryKeys.budget })
      setVisible(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/income?id=${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.income })
      await queryClient.invalidateQueries({ queryKey: queryKeys.budget })
    },
  })

  if (incomeQuery.isLoading) {
    return <LoadingState />
  }

  if (incomeQuery.isError) {
    return <ErrorState message={incomeQuery.error.message} onRetry={() => incomeQuery.refetch()} />
  }

  const incomeSources = incomeQuery.data ?? []

  return (
    <Screen scroll>
      <SectionTitle title="Income" subtitle="Track recurring and active sources." />
      <PrimaryButton title="Add income source" onPress={() => setVisible(true)} />
      <SectionCard>
        {incomeSources.length === 0 ? (
          <EmptyState title="No income sources" body="Add salary, freelance, or side-income streams here." />
        ) : (
          incomeSources.map(source => (
            <ListItem
              key={source.id}
              title={source.name}
              subtitle={`${source.frequency || "custom"} • ${source.type || "General"}`}
              meta={`$${source.amount.toFixed(0)}`}
              onPress={() => {
                setForm({
                  id: source.id,
                  name: source.name,
                  type: source.type || "",
                  amount: String(source.amount),
                  frequency: source.frequency || "monthly",
                  active: source.active,
                })
                setVisible(true)
              }}
            />
          ))
        )}
      </SectionCard>
      <SheetModal visible={visible} title={form.id ? "Edit income" : "New income"} onClose={() => setVisible(false)}>
        <SectionCard>
          <TextField label="Name" value={form.name} onChangeText={value => setForm(current => ({ ...current, name: value }))} />
          <TextField label="Type" value={form.type} onChangeText={value => setForm(current => ({ ...current, type: value }))} placeholder="Salary, freelance, dividends" />
          <TextField label="Amount" value={form.amount} onChangeText={value => setForm(current => ({ ...current, amount: value }))} placeholder="0" />
          <TextField label="Frequency" value={form.frequency} onChangeText={value => setForm(current => ({ ...current, frequency: value }))} placeholder="monthly" />
          <SwitchRow label="Active" value={form.active} onValueChange={value => setForm(current => ({ ...current, active: value }))} />
          {saveMutation.isError ? <Text style={{ color: "#B42318" }}>{saveMutation.error.message}</Text> : null}
          <PrimaryButton title={form.id ? "Save income" : "Create income"} onPress={() => saveMutation.mutate()} />
          {form.id ? <PrimaryButton title="Delete income" onPress={() => deleteMutation.mutate(form.id!)} /> : null}
        </SectionCard>
      </SheetModal>
    </Screen>
  )
}
