import { z } from "zod"

import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapCalendarEventRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { calendarEventInputSchema } from "@/shared/contracts/mobile"

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
    FROM calendar_events
    WHERE user_id = ${auth.user.id}
    ORDER BY event_date, start_time
  `

  return mobileJson({ items: rows.map(mapCalendarEventRow) })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, calendarEventInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    INSERT INTO calendar_events (
      user_id,
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      category,
      attendees
    )
    VALUES (
      ${auth.user.id},
      ${parsed.data.title},
      ${parsed.data.description || null},
      ${parsed.data.eventDate || null},
      ${parsed.data.startTime || null},
      ${parsed.data.endTime || null},
      ${parsed.data.location || null},
      ${parsed.data.category || null},
      ${parsed.data.attendees || null}
    )
    RETURNING *
  `

  return mobileJson({ item: mapCalendarEventRow(row[0]) }, 201)
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, calendarEventInputSchema.extend({ id: z.number() }))
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    UPDATE calendar_events
    SET
      title = ${parsed.data.title},
      description = ${parsed.data.description || null},
      event_date = ${parsed.data.eventDate || null},
      start_time = ${parsed.data.startTime || null},
      end_time = ${parsed.data.endTime || null},
      location = ${parsed.data.location || null},
      category = ${parsed.data.category || null},
      attendees = ${parsed.data.attendees || null},
      updated_at = NOW()
    WHERE id = ${parsed.data.id} AND user_id = ${auth.user.id}
    RETURNING *
  `

  if (!row[0]) {
    return mobileError(404, "event_not_found", "Calendar event not found.")
  }

  return mobileJson({ item: mapCalendarEventRow(row[0]) })
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const id = readIdFromUrl(request)
  if (!id) {
    return mobileError(400, "missing_id", "Event id is required.")
  }

  await sql`DELETE FROM calendar_events WHERE id = ${id} AND user_id = ${auth.user.id}`
  return mobileJson({ success: true })
}
