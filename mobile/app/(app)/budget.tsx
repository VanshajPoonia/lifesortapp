import React, { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Text, View } from "react-native"

import { DateField } from "../../src/components/date-time-fields"
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
import type { BudgetCategory, BudgetGoal, BudgetTransaction } from "../../src/lib/types"

type BudgetPayload = {
  categories: BudgetCategory[]
  transactions: BudgetTransaction[]
  goals: BudgetGoal[]
  summary: {
    income: number
    expenses: number
    balance: number
  }
}

type EntityType = "category" | "transaction" | "goal" | null

export default function BudgetScreen() {
  const queryClient = useQueryClient()
  const [entity, setEntity] = useState<EntityType>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#3B82F6", icon: "folder", budgetLimit: "0" })
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    description: "",
    type: "expense",
    date: null as string | null,
  })
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: null as string | null })

  const budgetQuery = useQuery({
    queryKey: queryKeys.budget,
    queryFn: () => apiRequest<BudgetPayload>("/budget"),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      if (entity === "category") {
        return apiRequest("/budget", {
          method: "POST",
          body: {
            entity: "category",
            payload: {
              name: categoryForm.name,
              color: categoryForm.color,
              icon: categoryForm.icon,
              budgetLimit: Number(categoryForm.budgetLimit || 0),
            },
          },
        })
      }

      if (entity === "transaction") {
        return apiRequest("/budget", {
          method: "POST",
          body: {
            entity: "transaction",
            payload: {
              amount: Number(transactionForm.amount || 0),
              description: transactionForm.description,
              type: transactionForm.type,
              date: transactionForm.date,
            },
          },
        })
      }

      return apiRequest("/budget", {
        method: "POST",
        body: {
          entity: "goal",
          payload: {
            name: goalForm.name,
            targetAmount: Number(goalForm.targetAmount || 0),
            currentAmount: Number(goalForm.currentAmount || 0),
            deadline: goalForm.deadline,
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.budget })
      setEntity(null)
    },
  })

  if (budgetQuery.isLoading) {
    return <LoadingState />
  }

  if (budgetQuery.isError) {
    return <ErrorState message={budgetQuery.error.message} onRetry={() => budgetQuery.refetch()} />
  }

  const budget = budgetQuery.data
  if (!budget) {
    return <LoadingState />
  }

  return (
    <Screen scroll>
      <SectionTitle title="Budget" subtitle="Focused on categories, transactions, goals, and income." />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <PrimaryButton title="Add transaction" onPress={() => setEntity("transaction")} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <PrimaryButton title="Add category" onPress={() => setEntity("category")} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <PrimaryButton title="Add budget goal" onPress={() => setEntity("goal")} />
      </View>
      <SectionCard>
        <SectionTitle title="This month" />
        <ListItem title="Income" meta={`$${budget.summary.income.toFixed(0)}`} />
        <ListItem title="Expenses" meta={`$${budget.summary.expenses.toFixed(0)}`} />
        <ListItem title="Balance" meta={`$${budget.summary.balance.toFixed(0)}`} />
      </SectionCard>
      <SectionCard>
        <SectionTitle title="Categories" />
        {budget.categories.length === 0 ? (
          <EmptyState title="No categories yet" body="Create a few budget buckets to organize spending." />
        ) : (
          budget.categories.map(category => (
            <ListItem key={category.id} title={category.name} meta={`$${category.budgetLimit.toFixed(0)}`} />
          ))
        )}
      </SectionCard>
      <SectionCard>
        <SectionTitle title="Recent transactions" />
        {budget.transactions.length === 0 ? (
          <EmptyState title="No transactions yet" body="Add income or expenses to see your monthly flow." />
        ) : (
          budget.transactions.slice(0, 10).map(transaction => (
            <ListItem
              key={transaction.id}
              title={transaction.description || transaction.type}
              subtitle={transaction.categoryName}
              meta={`$${transaction.amount.toFixed(0)}`}
            />
          ))
        )}
      </SectionCard>
      <SectionCard>
        <SectionTitle title="Budget goals" />
        {budget.goals.length === 0 ? (
          <EmptyState title="No budget goals yet" body="Create a savings target or monthly cap." />
        ) : (
          budget.goals.map(goal => (
            <ListItem
              key={goal.id}
              title={goal.name}
              subtitle={`$${goal.currentAmount.toFixed(0)} of $${goal.targetAmount.toFixed(0)}`}
              meta={goal.deadline}
            />
          ))
        )}
      </SectionCard>

      <SheetModal visible={entity === "category"} title="New category" onClose={() => setEntity(null)}>
        <SectionCard>
          <TextField label="Name" value={categoryForm.name} onChangeText={value => setCategoryForm(current => ({ ...current, name: value }))} />
          <TextField label="Color" value={categoryForm.color} onChangeText={value => setCategoryForm(current => ({ ...current, color: value }))} />
          <TextField label="Icon" value={categoryForm.icon} onChangeText={value => setCategoryForm(current => ({ ...current, icon: value }))} />
          <TextField label="Budget limit" value={categoryForm.budgetLimit} onChangeText={value => setCategoryForm(current => ({ ...current, budgetLimit: value }))} />
          {createMutation.isError ? <Text style={{ color: "#B42318" }}>{createMutation.error.message}</Text> : null}
          <PrimaryButton title="Create category" onPress={() => createMutation.mutate()} />
        </SectionCard>
      </SheetModal>

      <SheetModal visible={entity === "transaction"} title="New transaction" onClose={() => setEntity(null)}>
        <SectionCard>
          <TextField label="Amount" value={transactionForm.amount} onChangeText={value => setTransactionForm(current => ({ ...current, amount: value }))} />
          <TextField label="Description" value={transactionForm.description} onChangeText={value => setTransactionForm(current => ({ ...current, description: value }))} />
          <TextField label="Type" value={transactionForm.type} onChangeText={value => setTransactionForm(current => ({ ...current, type: value }))} placeholder="income or expense" />
          <DateField label="Date" value={transactionForm.date} onChange={value => setTransactionForm(current => ({ ...current, date: value }))} />
          {createMutation.isError ? <Text style={{ color: "#B42318" }}>{createMutation.error.message}</Text> : null}
          <PrimaryButton title="Create transaction" onPress={() => createMutation.mutate()} />
        </SectionCard>
      </SheetModal>

      <SheetModal visible={entity === "goal"} title="New budget goal" onClose={() => setEntity(null)}>
        <SectionCard>
          <TextField label="Name" value={goalForm.name} onChangeText={value => setGoalForm(current => ({ ...current, name: value }))} />
          <TextField label="Target amount" value={goalForm.targetAmount} onChangeText={value => setGoalForm(current => ({ ...current, targetAmount: value }))} />
          <TextField label="Current amount" value={goalForm.currentAmount} onChangeText={value => setGoalForm(current => ({ ...current, currentAmount: value }))} />
          <DateField label="Deadline" value={goalForm.deadline} onChange={value => setGoalForm(current => ({ ...current, deadline: value }))} />
          {createMutation.isError ? <Text style={{ color: "#B42318" }}>{createMutation.error.message}</Text> : null}
          <PrimaryButton title="Create goal" onPress={() => createMutation.mutate()} />
        </SectionCard>
      </SheetModal>
    </Screen>
  )
}
