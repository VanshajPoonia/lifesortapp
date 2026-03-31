import { hashPassword } from "@/lib/auth"
import { sql } from "@/lib/db"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { resetPasswordInputSchema } from "@/shared/contracts/mobile"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return mobileJson({ valid: false })
  }

  const tokens = await sql`
    SELECT id
    FROM password_reset_tokens
    WHERE token = ${token} AND used = false AND expires_at > NOW()
    LIMIT 1
  `

  return mobileJson({ valid: tokens.length > 0 })
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, resetPasswordInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const tokens = await sql`
    SELECT id, user_id
    FROM password_reset_tokens
    WHERE token = ${parsed.data.token} AND used = false AND expires_at > NOW()
    LIMIT 1
  `

  const resetToken = tokens[0]
  if (!resetToken) {
    return mobileError(400, "invalid_token", "This reset link is invalid or has expired.")
  }

  const passwordHash = await hashPassword(parsed.data.password)
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE id = ${resetToken.user_id}
  `
  await sql`UPDATE password_reset_tokens SET used = true WHERE id = ${resetToken.id}`
  await sql`DELETE FROM sessions WHERE user_id = ${resetToken.user_id}`

  return mobileJson({
    message: "Password reset successful. Please sign in with your new password.",
  })
}
