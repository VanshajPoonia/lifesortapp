import React, { useState } from "react"

import { Controller, useForm } from "react-hook-form"
import { Text } from "react-native"

import { apiRequest, ApiError } from "../../src/lib/api"
import { PrimaryButton, Screen, SectionCard, SectionTitle, TextField } from "../../src/components/ui"

type FormValues = {
  email: string
}

export default function ForgotPasswordScreen() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: "" },
  })

  const onSubmit = handleSubmit(async values => {
    try {
      setError(null)
      const response = await apiRequest<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: values,
      })
      setMessage(response.message)
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Could not send reset email.")
    }
  })

  return (
    <Screen scroll>
      <SectionTitle title="Reset password" subtitle="We’ll email you a reset link." />
      <SectionCard>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="you@example.com"
            />
          )}
        />
        {message ? <Text style={{ color: "#0F766E" }}>{message}</Text> : null}
        {error ? <Text style={{ color: "#B42318" }}>{error}</Text> : null}
        <PrimaryButton title="Send reset link" onPress={onSubmit} />
      </SectionCard>
    </Screen>
  )
}
