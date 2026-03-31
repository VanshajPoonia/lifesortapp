import React, { useState } from "react"

import { Link, router } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { Text, View } from "react-native"

import { ApiError } from "../../src/lib/api"
import { useAuth } from "../../src/providers/AuthProvider"
import { PrimaryButton, Screen, SectionCard, SectionTitle, TextField } from "../../src/components/ui"

type FormValues = {
  email: string
  password: string
}

export default function SignInScreen() {
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = handleSubmit(async values => {
    try {
      setError(null)
      await signIn(values)
      router.replace("/")
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Could not sign in.")
    }
  })

  return (
    <Screen scroll>
      <SectionTitle title="Welcome back" subtitle="Sign in to your LifeSort iPhone app." />
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
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Password"
              secureTextEntry
            />
          )}
        />
        {error ? <Text style={{ color: "#B42318" }}>{error}</Text> : null}
        <PrimaryButton title="Sign in" onPress={onSubmit} />
        <View style={{ gap: 8 }}>
          <Link href="/(auth)/forgot-password">Forgot your password?</Link>
          <Link href="/(auth)/sign-up">Create an account</Link>
        </View>
      </SectionCard>
    </Screen>
  )
}
