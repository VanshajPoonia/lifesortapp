import { sql } from "@/lib/db"

const DEFAULT_GOOGLE_REDIRECT_URI = "lifesort://oauth/google"

export function getGoogleRedirectUri(providedRedirectUri?: string) {
  return providedRedirectUri || process.env.GOOGLE_MOBILE_REDIRECT_URI || DEFAULT_GOOGLE_REDIRECT_URI
}

export function buildGoogleCalendarAuthUrl(options: { state: string; redirectUri?: string }) {
  const redirectUri = getGoogleRedirectUri(options.redirectUri)
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ].join(" ")

  return (
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    `&scope=${encodeURIComponent(scopes)}` +
    "&access_type=offline" +
    "&prompt=consent" +
    `&state=${encodeURIComponent(options.state)}`
  )
}

export async function exchangeGoogleCalendarCode(options: { code: string; redirectUri?: string }) {
  const redirectUri = getGoogleRedirectUri(options.redirectUri)

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code: options.code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })

  const tokens = await tokenResponse.json()
  if (!tokenResponse.ok) {
    throw new Error(tokens.error_description || tokens.error || "Google token exchange failed")
  }

  return tokens
}

export async function fetchGoogleCalendarProfile(accessToken: string) {
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const userInfo = await userInfoResponse.json()
  if (!userInfoResponse.ok) {
    throw new Error(userInfo.error?.message || "Failed to load Google profile")
  }

  return userInfo
}

export async function upsertGoogleCalendarIntegration(options: {
  userId: number
  accessToken: string
  refreshToken?: string | null
  expiresIn: number
  email?: string | null
}) {
  const expiresAt = new Date(Date.now() + options.expiresIn * 1000).toISOString()

  await sql`
    INSERT INTO calendar_integrations (
      user_id,
      provider,
      access_token,
      refresh_token,
      expires_at,
      calendar_email
    )
    VALUES (
      ${options.userId},
      'google',
      ${options.accessToken},
      ${options.refreshToken || null},
      ${expiresAt},
      ${options.email || null}
    )
    ON CONFLICT (user_id, provider)
    DO UPDATE SET
      access_token = ${options.accessToken},
      refresh_token = COALESCE(${options.refreshToken || null}, calendar_integrations.refresh_token),
      expires_at = ${expiresAt},
      calendar_email = ${options.email || null},
      updated_at = NOW()
  `
}

export async function refreshGoogleAccessToken(integration: any) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refresh_token,
      grant_type: "refresh_token",
    }),
  })

  const tokens = await response.json()
  if (!response.ok) {
    return null
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await sql`
    UPDATE calendar_integrations
    SET access_token = ${tokens.access_token}, expires_at = ${expiresAt}, updated_at = NOW()
    WHERE id = ${integration.id}
  `

  return tokens.access_token as string
}

export async function fetchGoogleCalendarEvents(accessToken: string, timeMin: string, timeMax: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin,
    )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return (data.items || []).map((event: any) => ({
    id: `google_${event.id}`,
    title: event.summary || "Untitled event",
    description: event.description || null,
    start: event.start?.dateTime || event.start?.date || null,
    end: event.end?.dateTime || event.end?.date || null,
    allDay: !event.start?.dateTime,
    provider: "google",
    color: "#4285F4",
    location: event.location || null,
  }))
}
