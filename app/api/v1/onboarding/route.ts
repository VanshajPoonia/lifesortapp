import { sql } from "@/lib/db"
import { requireMobileAuth } from "@/lib/mobile-auth"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { onboardingInputSchema } from "@/shared/contracts/mobile"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const [userRows, integrationRows] = await Promise.all([
    sql`
      SELECT onboarding_completed, app_preferences
      FROM users
      WHERE id = ${auth.user.id}
      LIMIT 1
    `,
    sql`
      SELECT id
      FROM calendar_integrations
      WHERE user_id = ${auth.user.id}
      LIMIT 1
    `,
  ])

  const user = userRows[0]
  return mobileJson({
    onboardingCompleted: Boolean(user?.onboarding_completed),
    appPreferences: user?.app_preferences || {},
    notificationPermission: user?.app_preferences?.notificationPermission || "unknown",
    calendarConnected: integrationRows.length > 0,
  })
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const parsed = await parseBody(request, onboardingInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const appPreferences = {
    ...(parsed.data.appPreferences || {}),
    notificationPermission: parsed.data.notificationPermission,
  }

  await sql`
    UPDATE users
    SET
      onboarding_completed = true,
      app_preferences = ${JSON.stringify(appPreferences)},
      updated_at = NOW()
    WHERE id = ${auth.user.id}
  `

  return mobileJson({
    onboardingCompleted: true,
    appPreferences,
    notificationPermission: parsed.data.notificationPermission,
    calendarConnected: false,
  })
}
