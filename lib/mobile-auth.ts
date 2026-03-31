import { cookies } from "next/headers"

import { createSession, deleteSession, getUserByEmail } from "@/lib/auth"
import { sql } from "@/lib/db"

type SessionRow = {
  id: number
  user_id: number
  session_token: string
  expires_at: string
}

type UserRow = {
  id: number
  email: string
  name: string | null
  created_at: string | null
  trial_ends_at: string | null
  is_subscribed: boolean | null
  subscription_ends_at: string | null
  subscription_source: string | null
  is_admin: boolean | null
  onboarding_completed: boolean | null
}

function readSessionFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null
  }

  const sessionCookie = cookieHeader
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith("session="))

  return sessionCookie ? sessionCookie.split("=")[1] : null
}

export async function getRequestSessionToken(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim()
  }

  const headerToken = readSessionFromCookieHeader(request.headers.get("cookie"))
  if (headerToken) {
    return headerToken
  }

  const cookieStore = await cookies()
  return cookieStore.get("session")?.value ?? null
}

export async function getMobileAuthSession(request: Request) {
  const sessionToken = await getRequestSessionToken(request)
  if (!sessionToken) {
    return null
  }

  const sessions = await sql`
    SELECT id, user_id, session_token, expires_at
    FROM sessions
    WHERE session_token = ${sessionToken} AND expires_at > NOW()
    LIMIT 1
  `

  const session = sessions[0]
  if (!session) {
    return null
  }

  const users = await sql`
    SELECT
      id,
      email,
      name,
      created_at,
      trial_ends_at,
      is_subscribed,
      subscription_ends_at,
      subscription_source,
      is_admin,
      onboarding_completed
    FROM users
    WHERE id = ${session.user_id}
    LIMIT 1
  `

  const user = users[0]
  if (!user) {
    return null
  }

  return {
    session: {
      id: session.id,
      userId: session.user_id,
      token: session.session_token,
      expiresAt: session.expires_at,
    },
    user,
  }
}

export async function getMobileUserById(userId: number | string) {
  const users = await sql`
    SELECT
      id,
      email,
      name,
      created_at,
      trial_ends_at,
      is_subscribed,
      subscription_ends_at,
      subscription_source,
      is_admin,
      onboarding_completed
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  return (users[0] as UserRow | undefined) ?? null
}

export async function requireMobileAuth(request: Request) {
  return getMobileAuthSession(request)
}

export async function createMobileSession(userId: number | string) {
  const token = await createSession(String(userId))
  const sessions = await sql`
    SELECT id, user_id, session_token, expires_at
    FROM sessions
    WHERE session_token = ${token}
    LIMIT 1
  `

  const session = sessions[0]
  return {
    id: session.id,
    userId: session.user_id,
    token: session.session_token,
    expiresAt: session.expires_at,
  }
}

export async function setMobileSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  })
}

export async function clearMobileSession(request?: Request) {
  const cookieStore = await cookies()
  const token = request ? await getRequestSessionToken(request) : cookieStore.get("session")?.value

  if (token) {
    await deleteSession(token)
  }

  cookieStore.delete("session")
}

export async function findUserForLogin(email: string) {
  return getUserByEmail(email.toLowerCase())
}
