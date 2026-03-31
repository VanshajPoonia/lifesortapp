import { z } from "zod"

import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import {
  mapBudgetCategoryRow,
  mapBudgetGoalRow,
  mapBudgetTransactionRow,
} from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import {
  budgetCategoryInputSchema,
  budgetGoalInputSchema,
  budgetTransactionInputSchema,
} from "@/shared/contracts/mobile"

const budgetMutationSchema = z.object({
  entity: z.enum(["category", "transaction", "goal"]),
  payload: z.record(z.string(), z.unknown()),
})

function invalidBudgetPayload(message: string) {
  return mobileError(400, "invalid_payload", message)
}

function parseId(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get("id"))
  return Number.isNaN(id) ? null : id
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [categoryRows, transactionRows, goalRows, summaryRows] = await Promise.all([
    sql`
      SELECT *
      FROM budget_categories
      WHERE user_id = ${auth.user.id}
      ORDER BY name ASC
    `,
    sql`
      SELECT
        t.*,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon
      FROM budget_transactions t
      LEFT JOIN budget_categories c ON c.id = t.category_id
      WHERE t.user_id = ${auth.user.id}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 100
    `,
    sql`
      SELECT
        g.*,
        c.name AS category_name
      FROM budget_goals g
      LEFT JOIN budget_categories c ON c.id = g.category_id
      WHERE g.user_id = ${auth.user.id}
      ORDER BY g.deadline ASC NULLS LAST
    `,
    sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthly_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthly_expenses
      FROM budget_transactions
      WHERE user_id = ${auth.user.id}
        AND EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}
    `,
  ])

  const summary = summaryRows[0] || { monthly_income: 0, monthly_expenses: 0 }
  const income = Number(summary.monthly_income || 0)
  const expenses = Number(summary.monthly_expenses || 0)

  return mobileJson({
    categories: categoryRows.map(mapBudgetCategoryRow),
    transactions: transactionRows.map(mapBudgetTransactionRow),
    goals: goalRows.map(mapBudgetGoalRow),
    summary: {
      income,
      expenses,
      balance: income - expenses,
    },
  })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, budgetMutationSchema)
  if (!parsed.success) {
    return parsed.response
  }

  if (parsed.data.entity === "category") {
    const payload = budgetCategoryInputSchema.safeParse(parsed.data.payload)
    if (!payload.success) {
      return invalidBudgetPayload(payload.error.issues[0]?.message || "Invalid category payload.")
    }
    const rows = await sql`
      INSERT INTO budget_categories (user_id, name, color, icon, budget_limit)
      VALUES (
        ${auth.user.id},
        ${payload.data.name},
        ${payload.data.color || "#3B82F6"},
        ${payload.data.icon || "folder"},
        ${payload.data.budgetLimit ?? 0}
      )
      RETURNING *
    `
    return mobileJson({ entity: "category", item: mapBudgetCategoryRow(rows[0]) }, 201)
  }

  if (parsed.data.entity === "transaction") {
    const payload = budgetTransactionInputSchema.safeParse(parsed.data.payload)
    if (!payload.success) {
      return invalidBudgetPayload(payload.error.issues[0]?.message || "Invalid transaction payload.")
    }
    const rows = await sql`
      INSERT INTO budget_transactions (
        user_id,
        category_id,
        type,
        amount,
        description,
        date,
        is_recurring,
        recurring_frequency
      )
      VALUES (
        ${auth.user.id},
        ${payload.data.categoryId ?? null},
        ${payload.data.type},
        ${payload.data.amount},
        ${payload.data.description || ""},
        ${payload.data.date || new Date().toISOString().split("T")[0]},
        ${payload.data.isRecurring ?? false},
        ${payload.data.recurringFrequency ?? null}
      )
      RETURNING *
    `
    return mobileJson({ entity: "transaction", item: mapBudgetTransactionRow(rows[0]) }, 201)
  }

  const payload = budgetGoalInputSchema.safeParse(parsed.data.payload)
  if (!payload.success) {
    return invalidBudgetPayload(payload.error.issues[0]?.message || "Invalid goal payload.")
  }
  const rows = await sql`
    INSERT INTO budget_goals (user_id, category_id, name, target_amount, current_amount, deadline)
    VALUES (
      ${auth.user.id},
      ${payload.data.categoryId ?? null},
      ${payload.data.name},
      ${payload.data.targetAmount},
      ${payload.data.currentAmount ?? 0},
      ${payload.data.deadline ?? null}
    )
    RETURNING *
  `

  return mobileJson({ entity: "goal", item: mapBudgetGoalRow(rows[0]) }, 201)
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, budgetMutationSchema)
  if (!parsed.success) {
    return parsed.response
  }

  if (parsed.data.entity === "category") {
    const payload = budgetCategoryInputSchema.extend({ id: z.number() }).safeParse(parsed.data.payload)
    if (!payload.success) {
      return invalidBudgetPayload(payload.error.issues[0]?.message || "Invalid category payload.")
    }
    const rows = await sql`
      UPDATE budget_categories
      SET
        name = ${payload.data.name},
        color = ${payload.data.color || "#3B82F6"},
        icon = ${payload.data.icon || "folder"},
        budget_limit = ${payload.data.budgetLimit ?? 0},
        updated_at = NOW()
      WHERE id = ${payload.data.id} AND user_id = ${auth.user.id}
      RETURNING *
    `
    return rows[0]
      ? mobileJson({ entity: "category", item: mapBudgetCategoryRow(rows[0]) })
      : mobileError(404, "category_not_found", "Budget category not found.")
  }

  if (parsed.data.entity === "transaction") {
    const payload = budgetTransactionInputSchema.extend({ id: z.number() }).safeParse(parsed.data.payload)
    if (!payload.success) {
      return invalidBudgetPayload(payload.error.issues[0]?.message || "Invalid transaction payload.")
    }
    const rows = await sql`
      UPDATE budget_transactions
      SET
        category_id = ${payload.data.categoryId ?? null},
        type = ${payload.data.type},
        amount = ${payload.data.amount},
        description = ${payload.data.description || ""},
        date = ${payload.data.date || new Date().toISOString().split("T")[0]},
        is_recurring = ${payload.data.isRecurring ?? false},
        recurring_frequency = ${payload.data.recurringFrequency ?? null},
        updated_at = NOW()
      WHERE id = ${payload.data.id} AND user_id = ${auth.user.id}
      RETURNING *
    `
    return rows[0]
      ? mobileJson({ entity: "transaction", item: mapBudgetTransactionRow(rows[0]) })
      : mobileError(404, "transaction_not_found", "Budget transaction not found.")
  }

  const payload = budgetGoalInputSchema.extend({ id: z.number() }).safeParse(parsed.data.payload)
  if (!payload.success) {
    return invalidBudgetPayload(payload.error.issues[0]?.message || "Invalid goal payload.")
  }
  const rows = await sql`
    UPDATE budget_goals
    SET
      category_id = ${payload.data.categoryId ?? null},
      name = ${payload.data.name},
      target_amount = ${payload.data.targetAmount},
      current_amount = ${payload.data.currentAmount ?? 0},
      deadline = ${payload.data.deadline ?? null},
      updated_at = NOW()
    WHERE id = ${payload.data.id} AND user_id = ${auth.user.id}
    RETURNING *
  `

  return rows[0]
    ? mobileJson({ entity: "goal", item: mapBudgetGoalRow(rows[0]) })
    : mobileError(404, "budget_goal_not_found", "Budget goal not found.")
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const { searchParams } = new URL(request.url)
  const entity = searchParams.get("entity")
  const id = parseId(request)

  if (!entity || !id) {
    return mobileError(400, "missing_delete_params", "Entity and id are required.")
  }

  if (entity === "category") {
    await sql`DELETE FROM budget_categories WHERE id = ${id} AND user_id = ${auth.user.id}`
  } else if (entity === "transaction") {
    await sql`DELETE FROM budget_transactions WHERE id = ${id} AND user_id = ${auth.user.id}`
  } else if (entity === "goal") {
    await sql`DELETE FROM budget_goals WHERE id = ${id} AND user_id = ${auth.user.id}`
  } else {
    return mobileError(400, "invalid_entity", "Unsupported budget entity.")
  }

  return mobileJson({ success: true })
}
