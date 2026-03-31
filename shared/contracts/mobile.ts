import { z } from "zod"

export const subscriptionStatusSchema = z.enum(["trial", "active", "expired"])
export const subscriptionSourceSchema = z.enum(["apple", "manual", "unknown"])

export const subscriptionSchema = z.object({
  status: subscriptionStatusSchema,
  endsAt: z.string().nullable(),
  source: subscriptionSourceSchema,
  isSubscribed: z.boolean(),
  trialEndsAt: z.string().nullable(),
})

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().nullable(),
  isAdmin: z.boolean(),
  onboardingCompleted: z.boolean(),
})

export const authResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: userSchema,
  subscription: subscriptionSchema,
})

export const mobileErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.string().nullable(),
  dueDate: z.string().nullable(),
  completed: z.boolean(),
  category: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const taskInputSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  category: z.string().nullable().optional(),
})

export const goalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  targetDate: z.string().nullable(),
  status: z.string().nullable(),
  progress: z.number(),
  targetValue: z.number().nullable(),
  currentValue: z.number().nullable(),
  valueUnit: z.string().nullable(),
  reminderEnabled: z.boolean(),
  reminderDays: z.number().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const goalInputSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  progress: z.number().optional(),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  valueUnit: z.string().nullable().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDays: z.number().nullable().optional(),
})

export const noteSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const noteInputSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
})

export const calendarEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  eventDate: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  location: z.string().nullable(),
  category: z.string().nullable(),
  attendees: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const calendarEventInputSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  attendees: z.string().nullable().optional(),
})

export const calendarIntegrationSchema = z.object({
  provider: z.string(),
  email: z.string().nullable(),
  connectedAt: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
})

export const budgetCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  budgetLimit: z.number(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const budgetTransactionSchema = z.object({
  id: z.number(),
  categoryId: z.number().nullable(),
  categoryName: z.string().nullable(),
  categoryColor: z.string().nullable(),
  categoryIcon: z.string().nullable(),
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  description: z.string().nullable(),
  date: z.string().nullable(),
  isRecurring: z.boolean(),
  recurringFrequency: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const budgetGoalSchema = z.object({
  id: z.number(),
  categoryId: z.number().nullable(),
  categoryName: z.string().nullable(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const budgetCategoryInputSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  budgetLimit: z.number().optional(),
})

export const budgetTransactionInputSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number().nullable().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().nullable().optional(),
})

export const budgetGoalInputSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number().nullable().optional(),
  name: z.string().min(1),
  targetAmount: z.number(),
  currentAmount: z.number().optional(),
  deadline: z.string().nullable().optional(),
})

export const incomeSourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string().nullable(),
  amount: z.number(),
  frequency: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const incomeSourceInputSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  type: z.string().min(1),
  amount: z.number(),
  frequency: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

export const profileSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  email: z.string().email(),
  bio: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  createdAt: z.string().nullable(),
  subscriptionTier: z.string().nullable(),
  subscriptionEndDate: z.string().nullable(),
})

export const profileInputSchema = z.object({
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
})

export const onboardingStatusSchema = z.object({
  onboardingCompleted: z.boolean(),
  appPreferences: z.record(z.string(), z.unknown()).default({}),
  notificationPermission: z.enum(["unknown", "granted", "denied"]).default("unknown"),
  calendarConnected: z.boolean().default(false),
})

export const onboardingInputSchema = z.object({
  appPreferences: z.record(z.string(), z.unknown()).default({}),
  notificationPermission: z.enum(["unknown", "granted", "denied"]).default("unknown"),
})

export const dashboardStatsSchema = z.object({
  totalTasks: z.number(),
  completedTasks: z.number(),
  totalGoals: z.number(),
  completedGoals: z.number(),
  upcomingEvents: z.number(),
  monthlyIncome: z.number(),
  monthlyExpenses: z.number(),
})

export const dashboardUpcomingItemSchema = z.object({
  id: z.string(),
  type: z.enum(["task", "goal", "calendar"]),
  title: z.string(),
  subtitle: z.string().nullable(),
  date: z.string().nullable(),
})

export const dashboardSummarySchema = z.object({
  stats: dashboardStatsSchema,
  upcoming: z.array(dashboardUpcomingItemSchema),
  subscriptionBanner: z.object({
    status: subscriptionStatusSchema,
    message: z.string(),
    endsAt: z.string().nullable(),
  }),
})

export const googleCalendarStartSchema = z.object({
  authUrl: z.string().url(),
  state: z.string(),
})

export const googleCalendarExchangeInputSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  redirectUri: z.string().url().optional(),
})

export type AuthResponse = z.infer<typeof authResponseSchema>
export type BudgetCategory = z.infer<typeof budgetCategorySchema>
export type BudgetGoal = z.infer<typeof budgetGoalSchema>
export type BudgetTransaction = z.infer<typeof budgetTransactionSchema>
export type CalendarEvent = z.infer<typeof calendarEventSchema>
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
export type Goal = z.infer<typeof goalSchema>
export type IncomeSource = z.infer<typeof incomeSourceSchema>
export type Note = z.infer<typeof noteSchema>
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>
export type Profile = z.infer<typeof profileSchema>
export type Subscription = z.infer<typeof subscriptionSchema>
export type Task = z.infer<typeof taskSchema>
export type User = z.infer<typeof userSchema>
