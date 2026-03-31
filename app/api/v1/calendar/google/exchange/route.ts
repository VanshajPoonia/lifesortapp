import {
  exchangeGoogleCalendarCode,
  fetchGoogleCalendarProfile,
  upsertGoogleCalendarIntegration,
} from "@/lib/calendar-google"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapCalendarIntegrationRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { googleCalendarExchangeInputSchema } from "@/shared/contracts/mobile"

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return mobileError(400, "google_not_configured", "Google Calendar is not configured.")
  }

  const parsed = await parseBody(request, googleCalendarExchangeInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  try {
    const tokens = await exchangeGoogleCalendarCode({
      code: parsed.data.code,
      redirectUri: parsed.data.redirectUri,
    })
    const profile = await fetchGoogleCalendarProfile(tokens.access_token)

    await upsertGoogleCalendarIntegration({
      userId: Number(auth.user.id),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      email: profile.email,
    })

    return mobileJson({
      success: true,
      integration: mapCalendarIntegrationRow({
        provider: "google",
        calendar_email: profile.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })
  } catch (error) {
    return mobileError(
      400,
      "google_exchange_failed",
      error instanceof Error ? error.message : "Could not connect Google Calendar.",
    )
  }
}
