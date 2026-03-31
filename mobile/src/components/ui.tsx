import React from "react"
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export function Screen({
  children,
  scroll = false,
}: {
  children: React.ReactNode
  scroll?: boolean
}) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  )
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryButton, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  )
}

export function SecondaryButton({
  title,
  onPress,
}: {
  title: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  )
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  multiline?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline ? styles.multiline : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
      />
    </View>
  )
}

export function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.body}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  )
}

export function StatGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string }>
}) {
  return (
    <View style={styles.grid}>
      {stats.map(stat => (
        <View key={stat.label} style={styles.statCard}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  )
}

export function ListItem({
  title,
  subtitle,
  meta,
  onPress,
}: {
  title: string
  subtitle?: string | null
  meta?: string | null
  onPress?: () => void
}) {
  const content = (
    <View style={styles.listItem}>
      <View style={styles.listText}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
    </View>
  )

  if (!onPress) {
    return content
  }

  return <Pressable onPress={onPress}>{content}</Pressable>
}

export function EmptyState({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#0F766E" />
    </View>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <SectionCard>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorBody}>{message}</Text>
      {onRetry ? <PrimaryButton title="Try again" onPress={onRetry} /> : null}
    </SectionCard>
  )
}

export function SheetModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <Screen scroll>
        <View style={styles.modalHeader}>
          <Text style={styles.title}>{title}</Text>
          <SecondaryButton title="Close" onPress={onClose} />
        </View>
        {children}
      </Screen>
    </Modal>
  )
}

export const colors = {
  bg: "#F4F7F5",
  card: "#FFFFFF",
  border: "#D8E0DA",
  text: "#10231A",
  muted: "#5C6E64",
  brand: "#0F766E",
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sectionTitle: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FDFEFD",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 16,
    color: colors.text,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  body: {
    fontSize: 15,
    color: colors.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  listItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5ECE7",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  listText: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  listSubtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  listMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 28,
    gap: 8,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  emptyBody: {
    color: colors.muted,
    textAlign: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  errorBody: {
    color: colors.muted,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
})
