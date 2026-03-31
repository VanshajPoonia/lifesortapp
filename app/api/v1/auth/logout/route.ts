import { clearMobileSession } from "@/lib/mobile-auth"
import { mobileJson } from "@/lib/mobile-response"

export async function POST(request: Request) {
  await clearMobileSession(request)
  return mobileJson({ success: true })
}
