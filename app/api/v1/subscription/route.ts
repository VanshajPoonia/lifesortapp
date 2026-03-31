import { requireMobileAuth } from "@/lib/mobile-auth"
import { mapSubscriptionRow } from "@/lib/mobile-serializers"
import { mobileError, mobileJson } from "@/lib/mobile-response"
import { getSubscriptionBannerMessage } from "@/lib/subscription"

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const subscription = mapSubscriptionRow(auth.user)
  return mobileJson({
    subscription,
    banner: {
      status: subscription.status,
      message: getSubscriptionBannerMessage(subscription),
      endsAt: subscription.endsAt ?? subscription.trialEndsAt,
    },
    canRestorePurchases: true,
  })
}
