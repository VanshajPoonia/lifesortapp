import crypto from "crypto"

import { Resend } from "resend"

import { sql } from "@/lib/db"
import { mobileJson, parseBody } from "@/lib/mobile-response"
import { forgotPasswordInputSchema } from "@/shared/contracts/mobile"

const resend = new Resend(process.env.RESEND_API_KEY)

function getResetBaseUrl() {
  if (process.env.MOBILE_PASSWORD_RESET_URL) {
    return process.env.MOBILE_PASSWORD_RESET_URL
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/reset-password`
  }

  return "http://localhost:3000/reset-password"
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, forgotPasswordInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const users = await sql`
    SELECT id, email, name
    FROM users
    WHERE email = ${parsed.data.email.toLowerCase()}
    LIMIT 1
  `

  const message = "If an account with that email exists, we've sent a password reset link."
  const user = users[0]
  if (!user) {
    return mobileJson({ message })
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`
  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, ${expiresAt})
  `

  const resetUrl = `${getResetBaseUrl()}?token=${token}`

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "LifeSort <noreply@resend.dev>",
      to: user.email,
      subject: "Reset your LifeSort password",
      html: `
        <p>Hi ${user.name || "there"},</p>
        <p>Tap the link below to reset your LifeSort password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    })
  }

  return mobileJson({ message })
}
