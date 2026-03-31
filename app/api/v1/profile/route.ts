import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapProfileRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { profileInputSchema } from "@/shared/contracts/mobile"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const rows = await sql`
    SELECT
      id,
      name,
      email,
      bio,
      phone,
      location,
      date_of_birth,
      created_at,
      subscription_tier,
      subscription_end_date
    FROM users
    WHERE id = ${auth.user.id}
    LIMIT 1
  `

  const row = rows[0]
  if (!row) {
    return mobileError(404, "profile_not_found", "Profile not found.")
  }

  return mobileJson({ profile: mapProfileRow(row) })
}

export async function PUT(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, profileInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const rows = await sql`
    UPDATE users
    SET
      name = COALESCE(${parsed.data.name}, name),
      bio = COALESCE(${parsed.data.bio}, bio),
      phone = COALESCE(${parsed.data.phone}, phone),
      location = COALESCE(${parsed.data.location}, location),
      date_of_birth = COALESCE(${parsed.data.dateOfBirth}, date_of_birth),
      updated_at = NOW()
    WHERE id = ${auth.user.id}
    RETURNING
      id,
      name,
      email,
      bio,
      phone,
      location,
      date_of_birth,
      created_at,
      subscription_tier,
      subscription_end_date
  `

  return mobileJson({ profile: mapProfileRow(rows[0]) })
}
