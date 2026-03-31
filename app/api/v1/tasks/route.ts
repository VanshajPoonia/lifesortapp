import { z } from "zod"

import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapTaskRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { taskInputSchema } from "@/shared/contracts/mobile"

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
    FROM tasks
    WHERE user_id = ${auth.user.id}
    ORDER BY created_at DESC
  `

  return mobileJson({ items: rows.map(mapTaskRow) })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, taskInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    INSERT INTO tasks (user_id, title, description, priority, due_date, completed, category)
    VALUES (
      ${auth.user.id},
      ${parsed.data.title},
      ${parsed.data.description || null},
      ${parsed.data.priority || "medium"},
      ${parsed.data.dueDate || null},
      ${parsed.data.completed || false},
      ${parsed.data.category || null}
    )
    RETURNING *
  `

  return mobileJson({ item: mapTaskRow(row[0]) }, 201)
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, taskInputSchema.extend({ id: z.number() }))
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    UPDATE tasks
    SET
      title = ${parsed.data.title},
      description = ${parsed.data.description || null},
      priority = ${parsed.data.priority || "medium"},
      due_date = ${parsed.data.dueDate || null},
      completed = ${parsed.data.completed || false},
      category = ${parsed.data.category || null},
      updated_at = NOW()
    WHERE id = ${parsed.data.id} AND user_id = ${auth.user.id}
    RETURNING *
  `

  if (!row[0]) {
    return mobileError(404, "task_not_found", "Task not found.")
  }

  return mobileJson({ item: mapTaskRow(row[0]) })
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const id = readIdFromUrl(request)
  if (!id) {
    return mobileError(400, "missing_id", "Task id is required.")
  }

  await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${auth.user.id}`
  return mobileJson({ success: true })
}
