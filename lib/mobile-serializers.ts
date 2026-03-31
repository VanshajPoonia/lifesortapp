import { deriveSubscription } from "@/lib/subscription"

function nullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? null : numericValue
}

function bool(value: unknown) {
  return Boolean(value)
}

export function mapUserRow(row: any) {
  return {
    id: Number(row.id),
    email: String(row.email),
    name: nullableString(row.name),
    createdAt: nullableString(row.created_at),
    isAdmin: bool(row.is_admin),
    onboardingCompleted: bool(row.onboarding_completed),
  }
}

export function mapSubscriptionRow(row: any) {
  return deriveSubscription(row)
}

export function mapAuthResponse(session: { token: string; expiresAt: string }, row: any) {
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: mapUserRow(row),
    subscription: mapSubscriptionRow(row),
  }
}

export function mapTaskRow(row: any) {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: nullableString(row.description),
    priority: nullableString(row.priority),
    dueDate: nullableString(row.due_date),
    completed: bool(row.completed),
    category: nullableString(row.category),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapGoalRow(row: any) {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: nullableString(row.description),
    category: nullableString(row.category),
    targetDate: nullableString(row.target_date),
    status: nullableString(row.status),
    progress: Number(row.progress ?? 0),
    targetValue: nullableNumber(row.target_value),
    currentValue: nullableNumber(row.current_value),
    valueUnit: nullableString(row.value_unit),
    reminderEnabled: bool(row.email_reminder),
    reminderDays: nullableNumber(row.reminder_days),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapNoteRow(row: any) {
  return {
    id: Number(row.id),
    title: String(row.title ?? "Untitled"),
    content: String(row.content ?? ""),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapCalendarEventRow(row: any) {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: nullableString(row.description),
    eventDate: nullableString(row.event_date),
    startTime: nullableString(row.start_time),
    endTime: nullableString(row.end_time),
    location: nullableString(row.location),
    category: nullableString(row.category),
    attendees: nullableString(row.attendees),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapCalendarIntegrationRow(row: any) {
  return {
    provider: String(row.provider),
    email: nullableString(row.calendar_email ?? row.email),
    connectedAt: nullableString(row.created_at),
    lastSyncedAt: nullableString(row.updated_at),
  }
}

export function mapBudgetCategoryRow(row: any) {
  return {
    id: Number(row.id),
    name: String(row.name),
    color: nullableString(row.color),
    icon: nullableString(row.icon),
    budgetLimit: Number(row.budget_limit ?? 0),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapBudgetTransactionRow(row: any) {
  return {
    id: Number(row.id),
    categoryId: nullableNumber(row.category_id),
    categoryName: nullableString(row.category_name),
    categoryColor: nullableString(row.category_color),
    categoryIcon: nullableString(row.category_icon),
    type: row.type === "income" ? "income" : "expense",
    amount: Number(row.amount ?? 0),
    description: nullableString(row.description),
    date: nullableString(row.date),
    isRecurring: bool(row.is_recurring),
    recurringFrequency: nullableString(row.recurring_frequency),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapBudgetGoalRow(row: any) {
  return {
    id: Number(row.id),
    categoryId: nullableNumber(row.category_id),
    categoryName: nullableString(row.category_name),
    name: String(row.name),
    targetAmount: Number(row.target_amount ?? 0),
    currentAmount: Number(row.current_amount ?? 0),
    deadline: nullableString(row.deadline),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapIncomeSourceRow(row: any) {
  return {
    id: Number(row.id),
    name: String(row.source_name),
    type: nullableString(row.category),
    amount: Number(row.amount ?? 0),
    frequency: nullableString(row.frequency),
    active: bool(row.active),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  }
}

export function mapProfileRow(row: any) {
  return {
    id: Number(row.id),
    name: nullableString(row.name),
    email: String(row.email),
    bio: nullableString(row.bio),
    phone: nullableString(row.phone),
    location: nullableString(row.location),
    dateOfBirth: nullableString(row.date_of_birth),
    createdAt: nullableString(row.created_at),
    subscriptionTier: nullableString(row.subscription_tier),
    subscriptionEndDate: nullableString(row.subscription_end_date),
  }
}
