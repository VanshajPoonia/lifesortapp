import { buildGoogleCalendarAuthUrl } from "@/lib/calendar-google"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mobileError, mobileJson } from "@/lib/mobile-response"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return mobileError(400, "google_not_configured", "Google Calendar is not configured.")
  }

  const { searchParams } = new URL(request.url)
  const redirectUri = searchParams.get("redirectUri") || undefined
  const state = crypto.randomUUID()

  return mobileJson({
    authUrl: buildGoogleCalendarAuthUrl({ state, redirectUri }),
    state,
  })
}
