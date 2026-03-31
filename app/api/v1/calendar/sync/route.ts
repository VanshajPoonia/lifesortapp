import { fetchGoogleCalendarEvents, refreshGoogleAccessToken } from "@/lib/calendar-google"
import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mobileError, mobileJson } from "@/lib/mobile-response"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const timeMin =
    searchParams.get("timeMin") || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const timeMax =
    searchParams.get("timeMax") || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()

  const integrations = await sql`
    SELECT *
    FROM calendar_integrations
    WHERE user_id = ${auth.user.id}
  `

  const events: any[] = []
  for (const integration of integrations) {
    let accessToken = integration.access_token
    if (integration.expires_at && new Date(integration.expires_at).getTime() <= Date.now()) {
      accessToken = await refreshGoogleAccessToken(integration)
    }

    if (!accessToken) {
      continue
    }

    if (integration.provider === "google") {
      const googleEvents = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax)
      events.push(...googleEvents)
    }
  }

  events.sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())
  return mobileJson({ items: events })
}
