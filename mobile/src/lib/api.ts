import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "lifesort.sessionToken"
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1"

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setStoredToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearStoredToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY)
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const token = await getStoredToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const message = data?.error?.message || "Request failed"
    throw new ApiError(message, response.status, data?.error?.code)
  }

  return data as T
}
