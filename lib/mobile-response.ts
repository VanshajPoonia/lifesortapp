import { NextResponse } from "next/server"
import type { ZodSchema } from "zod"

export function mobileJson<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

export function mobileError(status: number, code: string, message: string) {
  return mobileJson(
    {
      error: {
        code,
        message,
      },
    },
    status,
  )
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid request payload"
      return {
        success: false,
        response: mobileError(400, "invalid_payload", message),
      }
    }

    return {
      success: true,
      data: parsed.data,
    }
  } catch {
    return {
      success: false,
      response: mobileError(400, "invalid_json", "Request body must be valid JSON."),
    }
  }
}
