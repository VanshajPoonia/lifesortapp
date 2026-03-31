import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapCalendarIntegrationRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson } from "@/lib/mobile-response"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const rows = await sql`
    SELECT provider, calendar_email, created_at, updated_at
    FROM calendar_integrations
    WHERE user_id = ${auth.user.id}
    ORDER BY created_at DESC
  `

  return mobileJson({
    integrations: rows.map(mapCalendarIntegrationRow),
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
  })
}

export async function DELETE(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get("provider")

  if (!provider) {
    return mobileError(400, "missing_provider", "Provider is required.")
  }

  await sql`
    DELETE FROM calendar_integrations
    WHERE user_id = ${auth.user.id} AND provider = ${provider}
  `

  return mobileJson({ success: true })
}
