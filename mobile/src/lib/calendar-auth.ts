import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"

import { apiRequest } from "./api"

WebBrowser.maybeCompleteAuthSession()

export async function connectGoogleCalendar() {
  const redirectUri = Linking.createURL("oauth/google", { scheme: "lifesort" })
  const start = await apiRequest<{ authUrl: string; state: string }>(
    `/calendar/google/start?redirectUri=${encodeURIComponent(redirectUri)}`,
  )

  const result = await WebBrowser.openAuthSessionAsync(start.authUrl, redirectUri)
  if (result.type !== "success" || !result.url) {
    return false
  }

  const parsed = Linking.parse(result.url)
  const code = parsed.queryParams?.code
  if (typeof code !== "string") {
    return false
  }

  await apiRequest("/calendar/google/exchange", {
    method: "POST",
    body: {
      code,
      state: start.state,
      redirectUri,
    },
  })

  return true
}
