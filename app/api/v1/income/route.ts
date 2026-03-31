import { z } from "zod"

import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapIncomeSourceRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { incomeSourceInputSchema } from "@/shared/contracts/mobile"

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
    FROM income_sources
    WHERE user_id = ${auth.user.id}
    ORDER BY created_at DESC
  `

  return mobileJson({ items: rows.map(mapIncomeSourceRow) })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, incomeSourceInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    INSERT INTO income_sources (user_id, source_name, category, amount, frequency, active)
    VALUES (
      ${auth.user.id},
      ${parsed.data.name},
      ${parsed.data.type},
      ${parsed.data.amount},
      ${parsed.data.frequency || "monthly"},
      ${parsed.data.active ?? true}
    )
    RETURNING *
  `

  return mobileJson({ item: mapIncomeSourceRow(row[0]) }, 201)
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, incomeSourceInputSchema.extend({ id: z.number() }))
  if (!parsed.success) {
    return parsed.response
  }

  const row = await sql`
    UPDATE income_sources
    SET
      source_name = ${parsed.data.name},
      category = ${parsed.data.type},
      amount = ${parsed.data.amount},
      frequency = ${parsed.data.frequency || "monthly"},
      active = ${parsed.data.active ?? true},
      updated_at = NOW()
    WHERE id = ${parsed.data.id} AND user_id = ${auth.user.id}
    RETURNING *
  `

  if (!row[0]) {
    return mobileError(404, "income_not_found", "Income source not found.")
  }

  return mobileJson({ item: mapIncomeSourceRow(row[0]) })
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const id = readIdFromUrl(request)
  if (!id) {
    return mobileError(400, "missing_id", "Income source id is required.")
  }

  await sql`DELETE FROM income_sources WHERE id = ${id} AND user_id = ${auth.user.id}`
  return mobileJson({ success: true })
}
