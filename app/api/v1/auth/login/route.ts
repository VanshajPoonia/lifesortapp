import { verifyPassword } from "@/lib/auth"
import { createMobileSession, findUserForLogin, getMobileUserById, setMobileSessionCookie } from "@/lib/mobile-auth"
import { mapAuthResponse } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { loginInputSchema } from "@/shared/contracts/mobile"

export async function POST(request: Request) {
  const parsed = await parseBody(request, loginInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const user = await findUserForLogin(parsed.data.email)
  if (!user) {
    return mobileError(401, "invalid_credentials", "Email or password is incorrect.")
  }

  const isValid = await verifyPassword(parsed.data.password, user.password_hash)
  if (!isValid) {
    return mobileError(401, "invalid_credentials", "Email or password is incorrect.")
  }

  const session = await createMobileSession(user.id)
  await setMobileSessionCookie(session.token)

  const freshUser = await getMobileUserById(user.id)
  if (!freshUser) {
    return mobileError(500, "user_not_found", "User could not be loaded after login.")
  }

  return mobileJson(mapAuthResponse(session, freshUser))
}
