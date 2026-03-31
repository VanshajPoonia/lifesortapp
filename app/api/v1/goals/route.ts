import { z } from "zod"

import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapGoalRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { goalInputSchema } from "@/shared/contracts/mobile"

function readIdFromUrl(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get("id"))
  return Number.isNaN(id) ? null : id
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const rows = await sql`
    SELECT *
    FROM goals
    WHERE user_id = ${auth.user.id}
    ORDER BY created_at DESC
  `

  return mobileJson({ items: rows.map(mapGoalRow) })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, goalInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    INSERT INTO goals (
      user_id,
      title,
      description,
      category,
      target_date,
      status,
      progress,
      target_value,
      current_value,
      value_unit,
      email_reminder,
      reminder_days
    )
    VALUES (
      ${auth.user.id},
      ${parsed.data.title},
      ${parsed.data.description || null},
      ${parsed.data.category || "personal"},
      ${parsed.data.targetDate || null},
      ${parsed.data.status || "in_progress"},
      ${parsed.data.progress ?? 0},
      ${parsed.data.targetValue ?? null},
      ${parsed.data.currentValue ?? 0},
      ${parsed.data.valueUnit ?? null},
      ${parsed.data.reminderEnabled ?? false},
      ${parsed.data.reminderDays ?? 3}
    )
    RETURNING *
  `

  return mobileJson({ item: mapGoalRow(row[0]) }, 201)
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, goalInputSchema.extend({ id: z.number() }))
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    UPDATE goals
    SET
      title = ${parsed.data.title},
      description = ${parsed.data.description || null},
      category = ${parsed.data.category || "personal"},
      target_date = ${parsed.data.targetDate || null},
      status = ${parsed.data.status || "in_progress"},
      progress = ${parsed.data.progress ?? 0},
      target_value = ${parsed.data.targetValue ?? null},
      current_value = ${parsed.data.currentValue ?? 0},
      value_unit = ${parsed.data.valueUnit ?? null},
      email_reminder = ${parsed.data.reminderEnabled ?? false},
      reminder_days = ${parsed.data.reminderDays ?? 3},
      updated_at = NOW()
    WHERE id = ${parsed.data.id} AND user_id = ${auth.user.id}
    RETURNING *
  `

  if (!row[0]) {
    return mobileError(404, "goal_not_found", "Goal not found.")
  }

  return mobileJson({ item: mapGoalRow(row[0]) })
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const id = readIdFromUrl(request)
  if (!id) {
    return mobileError(400, "missing_id", "Goal id is required.")
  }

  await sql`DELETE FROM goals WHERE id = ${id} AND user_id = ${auth.user.id}`
  return mobileJson({ success: true })
}
