import React, { useState } from "react"

import { Link, router } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { Text, View } from "react-native"

import { ApiError } from "../../src/lib/api"
import { useAuth } from "../../src/providers/AuthProvider"
import { PrimaryButton, Screen, SectionCard, SectionTitle, TextField } from "../../src/components/ui"

type FormValues = {
  name: string
  email: string
  password: string
}

export default function SignUpScreen() {
  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = handleSubmit(async values => {
    try {
      setError(null)
      await signUp(values)
      router.replace("/")
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Could not create your account.")
    }
  })

  return (
    <Screen scroll>
      <SectionTitle title="Create your account" subtitle="Start with the iOS MVP experience." />
      <SectionCard>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField label="Name" value={field.value} onChangeText={field.onChange} placeholder="Your name" />
          )}
        />
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
              placeholder="At least 6 characters"
              secureTextEntry
            />
          )}
        />
        {error ? <Text style={{ color: "#B42318" }}>{error}</Text> : null}
        <PrimaryButton title="Create account" onPress={onSubmit} />
        <View style={{ gap: 8 }}>
          <Link href="/(auth)/sign-in">Already have an account?</Link>
        </View>
      </SectionCard>
    </Screen>
  )
}
