import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"

const STORAGE_KEY = "lifesort.localReminders"

type ReminderRecord = {
  notificationId: string
}

type ReminderMap = Record<string, ReminderRecord>

function keyFor(resourceType: string, resourceId: number) {
  return `${resourceType}:${resourceId}`
}

async function getReminderMap() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as ReminderMap) : {}
}

async function setReminderMap(map: ReminderMap) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export async function requestNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync()
  if (existing.granted) {
    return "granted" as const
  }

  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted ? ("granted" as const) : ("denied" as const)
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

export async function clearReminder(resourceType: string, resourceId: number) {
  const map = await getReminderMap()
  const key = keyFor(resourceType, resourceId)
  const existing = map[key]

  if (existing?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(existing.notificationId)
  }

  delete map[key]
  await setReminderMap(map)
}

export async function upsertReminder(options: {
  resourceType: "task" | "goal" | "calendar"
  resourceId: number
  title: string
  body: string
  scheduledFor: Date | null
}) {
  await clearReminder(options.resourceType, options.resourceId)

  if (!options.scheduledFor || options.scheduledFor.getTime() <= Date.now()) {
    return
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: options.title,
      body: options.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: options.scheduledFor,
    },
  })

  const map = await getReminderMap()
  map[keyFor(options.resourceType, options.resourceId)] = { notificationId }
  await setReminderMap(map)
}

export function buildTaskReminderDate(dueDate?: string | null) {
  if (!dueDate) {
    return null
  }

  const date = new Date(dueDate)
  date.setHours(9, 0, 0, 0)
  return date
}

export function buildGoalReminderDate(targetDate?: string | null) {
  if (!targetDate) {
    return null
  }

  const date = new Date(targetDate)
  date.setHours(9, 0, 0, 0)
  return date
}

export function buildCalendarReminderDate(eventDate?: string | null, startTime?: string | null) {
  if (!eventDate) {
    return null
  }

  const date = new Date(eventDate)
  if (startTime) {
    const [hours, minutes] = startTime.split(":").map(part => Number(part))
    date.setHours(hours || 0, minutes || 0, 0, 0)
  } else {
    date.setHours(9, 0, 0, 0)
  }

  date.setMinutes(date.getMinutes() - 60)
  return date
}
