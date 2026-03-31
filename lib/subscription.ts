export type SubscriptionRow = {
  trial_ends_at?: string | null
  is_subscribed?: boolean | null
  subscription_ends_at?: string | null
  subscription_source?: string | null
}

export function deriveSubscription(row: SubscriptionRow) {
  const now = Date.now()
  const trialEndsAt = row.trial_ends_at ?? null
  const subscriptionEndsAt = row.subscription_ends_at ?? null
  const hasActiveSubscription = Boolean(
    row.is_subscribed &&
      (subscriptionEndsAt === null || new Date(subscriptionEndsAt).getTime() > now),
  )
  const inTrial = Boolean(trialEndsAt && new Date(trialEndsAt).getTime() > now)

  let status: "trial" | "active" | "expired" = "expired"
  if (hasActiveSubscription) {
    status = "active"
  } else if (inTrial) {
    status = "trial"
  }

  const source =
    row.subscription_source === "apple" || row.subscription_source === "manual"
      ? row.subscription_source
      : hasActiveSubscription
        ? "manual"
        : "unknown"

  return {
    status,
    endsAt: subscriptionEndsAt,
    source,
    isSubscribed: hasActiveSubscription,
    trialEndsAt,
  }
}

export function getSubscriptionBannerMessage(subscription: ReturnType<typeof deriveSubscription>) {
  if (subscription.status === "active") {
    return "Your premium access is active."
  }

  if (subscription.status === "trial") {
    return "Your free trial is active."
  }

  return "Upgrade to keep all LifeSort features unlocked."
}
