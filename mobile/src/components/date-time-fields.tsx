import React, { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker"

import { colors } from "./ui"

function formatDisplayDate(value?: string | null) {
  if (!value) {
    return "Select a date"
  }

  return new Date(value).toLocaleDateString()
}

function formatDisplayTime(value?: string | null) {
  if (!value) {
    return "Select a time"
  }

  return value
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string | null
  onChange: (value: string | null) => void
}) {
  const [show, setShow] = useState(false)
  const pickerValue = useMemo(() => (value ? new Date(value) : new Date()), [value])

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(false)
    if (!selectedDate) {
      return
    }

    onChange(selectedDate.toISOString().split("T")[0])
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.control} onPress={() => setShow(true)}>
        <Text style={styles.value}>{formatDisplayDate(value)}</Text>
      </Pressable>
      {show ? <DateTimePicker value={pickerValue} mode="date" onChange={handleChange} /> : null}
    </View>
  )
}

export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string | null
  onChange: (value: string | null) => void
}) {
  const [show, setShow] = useState(false)
  const pickerValue = useMemo(() => {
    const date = new Date()
    if (value) {
      const [hours, minutes] = value.split(":").map(part => Number(part))
      date.setHours(hours || 0, minutes || 0, 0, 0)
    }
    return date
  }, [value])

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(false)
    if (!selectedDate) {
      return
    }

    const hours = selectedDate.getHours().toString().padStart(2, "0")
    const minutes = selectedDate.getMinutes().toString().padStart(2, "0")
    onChange(`${hours}:${minutes}`)
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.control} onPress={() => setShow(true)}>
        <Text style={styles.value}>{formatDisplayTime(value)}</Text>
      </Pressable>
      {show ? <DateTimePicker value={pickerValue} mode="time" onChange={handleChange} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontWeight: "600",
  },
  control: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FDFEFD",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
  },
  value: {
    color: colors.text,
    fontSize: 16,
  },
})
