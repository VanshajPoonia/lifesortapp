import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapAuthResponse } from "@/lib/mobile-serializers"
import { mobileError, mobileJson } from "@/lib/mobile-response"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  return mobileJson(mapAuthResponse(auth.session, auth.user))
}
