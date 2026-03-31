import { createUser, getUserByEmail } from "@/lib/auth"
import { createMobileSession, getMobileUserById, setMobileSessionCookie } from "@/lib/mobile-auth"
import { mapAuthResponse } from "@/lib/mobile-serializers"
import { mobileError, mobileJson, parseBody } from "@/lib/mobile-response"
import { registerInputSchema } from "@/shared/contracts/mobile"

export async function POST(request: Request) {
  const parsed = await parseBody(request, registerInputSchema)
  if (!parsed.success) {
    return parsed.response
  }

  const existingUser = await getUserByEmail(parsed.data.email.toLowerCase())
  if (existingUser) {
    return mobileError(400, "user_exists", "An account with this email already exists.")
  }

  const user = await createUser(parsed.data.email.toLowerCase(), parsed.data.password, parsed.data.name)
  const session = await createMobileSession(user.id)
  await setMobileSessionCookie(session.token)

  const freshUser = await getMobileUserById(user.id)
  if (!freshUser) {
    return mobileError(500, "user_not_found", "User could not be loaded after signup.")
  }

  return mobileJson(mapAuthResponse(session, freshUser), 201)
}
