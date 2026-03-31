import React from "react"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { configureNotificationHandler } from "../lib/notifications"
import { AuthProvider } from "./AuthProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

configureNotificationHandler()

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <AuthProvider>{children}</AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  )
}
