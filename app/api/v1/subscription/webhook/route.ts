import { sql } from "@/lib/db"
import { mobileError, mobileJson } from "@/lib/mobile-response"

function getExpiration(event: any) {
  if (event.expiration_at_ms) {
    return new Date(Number(event.expiration_at_ms)).toISOString()
  }

  if (event.expires_at_ms) {
    return new Date(Number(event.expires_at_ms)).toISOString()
  }

  if (event.expiration_at) {
    return new Date(event.expiration_at).toISOString()
  }

  if (event.expires_at) {
    return new Date(event.expires_at).toISOString()
  }

  return null
}

function isActiveEvent(type: string) {
  return [
    "INITIAL_PURCHASE",
    "NON_RENEWING_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "PRODUCT_CHANGE",
  ].includes(type)
}

function isInactiveEvent(type: string) {
  return ["EXPIRATION", "CANCELLATION", "SUBSCRIPTION_PAUSED", "BILLING_ISSUE"].includes(type)
}

export async function POST(request: Request) {
  const configuredAuth = process.env.REVENUECAT_WEBHOOK_AUTH
  if (configuredAuth && request.headers.get("authorization") !== `Bearer ${configuredAuth}`) {
    return mobileError(401, "unauthorized", "Invalid webhook authorization.")
  }

  const body = await request.json().catch(() => null)
  const event = body?.event || body
  if (!event) {
    return mobileError(400, "invalid_payload", "Missing RevenueCat event payload.")
  }

  const identifier = event.app_user_id || event.appUserId || event.original_app_user_id
  if (!identifier) {
    return mobileJson({ received: true, updated: false })
  }

  const users = await sql`
    SELECT id
    FROM users
    WHERE CAST(id AS TEXT) = ${String(identifier)} OR email = ${String(identifier)}
    LIMIT 1
  `

  const user = users[0]
  if (!user) {
    return mobileJson({ received: true, updated: false })
  }

  const type = String(event.type || "")
  const expiration = getExpiration(event)

  if (isActiveEvent(type)) {
    await sql`
      UPDATE users
      SET
        is_subscribed = true,
        subscription_ends_at = ${expiration},
        subscription_end_date = ${expiration},
        subscription_source = 'apple',
        updated_at = NOW()
      WHERE id = ${user.id}
    `
  } else if (isInactiveEvent(type)) {
    await sql`
      UPDATE users
      SET
        is_subscribed = false,
        subscription_ends_at = ${expiration},
        subscription_end_date = ${expiration},
        subscription_source = COALESCE(subscription_source, 'apple'),
        updated_at = NOW()
      WHERE id = ${user.id}
    `
  }

  return mobileJson({ received: true, updated: true })
}
