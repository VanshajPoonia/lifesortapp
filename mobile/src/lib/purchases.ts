import Purchases from "react-native-purchases"

let configuredUserId: string | null = null

export async function configurePurchases(userId?: string | null) {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
  if (!apiKey) {
    return
  }

  if (!configuredUserId) {
    await Purchases.configure({
      apiKey,
      appUserID: userId || undefined,
    })
    configuredUserId = userId || "anonymous"
    return
  }

  if (userId && configuredUserId !== userId) {
    await Purchases.logIn(userId)
    configuredUserId = userId
  }
}

export async function logOutPurchases() {
  if (!configuredUserId) {
    return
  }

  await Purchases.logOut()
  configuredUserId = null
}

export async function restorePurchases() {
  return Purchases.restorePurchases()
}
