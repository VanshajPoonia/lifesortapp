import { z } from "zod"

import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapNoteRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { noteInputSchema } from "@/shared/contracts/mobile"

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
    FROM notes
    WHERE user_id = ${auth.user.id}
    ORDER BY updated_at DESC
  `

  return mobileJson({ items: rows.map(mapNoteRow) })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(
    request,
    noteInputSchema.extend({ title: z.string().optional(), content: z.string().optional() }),
  )
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    INSERT INTO notes (user_id, title, content)
    VALUES (${auth.user.id}, ${parsed.data.title || "Untitled"}, ${parsed.data.content || ""})
    RETURNING *
  `

  return mobileJson({ item: mapNoteRow(row[0]) }, 201)
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, noteInputSchema.extend({ id: z.number() }))
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    UPDATE notes
    SET
      title = COALESCE(${parsed.data.title}, title),
      content = COALESCE(${parsed.data.content}, content),
      updated_at = NOW()
    WHERE id = ${parsed.data.id} AND user_id = ${auth.user.id}
    RETURNING *
  `

  if (!row[0]) {
    return mobileError(404, "note_not_found", "Note not found.")
  }

  return mobileJson({ item: mapNoteRow(row[0]) })
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const id = readIdFromUrl(request)
  if (!id) {
    return mobileError(400, "missing_id", "Note id is required.")
  }

  await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${auth.user.id}`
  return mobileJson({ success: true })
}
