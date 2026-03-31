import React from "react"

import { router } from "expo-router"

import { ListItem, Screen, SectionCard, SectionTitle } from "../../../src/components/ui"

export default function MoreScreen() {
  return (
    <Screen scroll>
      <SectionTitle title="More" subtitle="Secondary modules and account settings." />
      <SectionCard>
        <ListItem title="Notes" subtitle="Capture quick thoughts" onPress={() => router.push("/(app)/notes")} />
        <ListItem
          title="Budget"
          subtitle="Categories, transactions, and goals"
          onPress={() => router.push("/(app)/budget")}
        />
        <ListItem
          title="Income"
          subtitle="Track active income sources"
          onPress={() => router.push("/(app)/income")}
        />
        <ListItem
          title="Settings"
          subtitle="Profile, subscription, Google Calendar"
          onPress={() => router.push("/(app)/settings")}
        />
      </SectionCard>
    </Screen>
  )
}
