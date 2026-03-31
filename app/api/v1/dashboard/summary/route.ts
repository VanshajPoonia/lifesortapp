import { requireMobileAuth } from "@/lib/mobile-auth"
import { mobileError, mobileJson } from "@/lib/mobile-response"
import { getSubscriptionBannerMessage } from "@/lib/subscription"
import { mapSubscriptionRow } from "@/lib/mobile-serializers"
import { sql } from "@/lib/db"

type UpcomingItem = {
  id: string
  type: "task" | "goal" | "calendar"
  title: string
  subtitle: string | null
  date: string | null
}

function sortUpcoming(items: UpcomingItem[]) {
  return items.sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : Number.MAX_SAFE_INTEGER
    const rightTime = right.date ? new Date(right.date).getTime() : Number.MAX_SAFE_INTEGER
    return leftTime - rightTime
  })
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request)
  if (!auth) {
    return mobileError(401, "unauthorized", "Authentication is required.")
  }

  const userId = auth.user.id
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [taskStatsRows, goalStatsRows, budgetRows, taskRows, goalRows, calendarRows] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE completed = true)::int AS completed_tasks
      FROM tasks
      WHERE user_id = ${userId}
    `,
    sql`
      SELECT
        COUNT(*)::int AS total_goals,
        COUNT(*) FILTER (WHERE status IN ('completed', 'complete'))::int AS completed_goals
      FROM goals
      WHERE user_id = ${userId}
    `,
    sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthly_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthly_expenses
      FROM budget_transactions
      WHERE user_id = ${userId}
        AND EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}
    `,
    sql`
      SELECT id, title, due_date
      FROM tasks
      WHERE user_id = ${userId} AND completed = false AND due_date IS NOT NULL AND due_date >= CURRENT_DATE
      ORDER BY due_date ASC
      LIMIT 4
    `,
    sql`
      SELECT id, title, target_date
      FROM goals
      WHERE user_id = ${userId} AND target_date IS NOT NULL AND target_date >= CURRENT_DATE
      ORDER BY target_date ASC
      LIMIT 4
    `,
    sql`
      SELECT id, title, event_date, start_time
      FROM calendar_events
      WHERE user_id = ${userId} AND event_date IS NOT NULL AND event_date >= CURRENT_DATE
      ORDER BY event_date ASC, start_time ASC
      LIMIT 4
    `,
  ])

  const taskStats = taskStatsRows[0] || {}
  const goalStats = goalStatsRows[0] || {}
  const budgetStats = budgetRows[0] || {}

  const upcoming = sortUpcoming([
    ...taskRows.map((row: any) => ({
      id: `task-${row.id}`,
      type: "task" as const,
      title: row.title,
      subtitle: "Task due",
      date: row.due_date,
    })),
    ...goalRows.map((row: any) => ({
      id: `goal-${row.id}`,
      type: "goal" as const,
      title: row.title,
      subtitle: "Goal target",
      date: row.target_date,
    })),
    ...calendarRows.map((row: any) => ({
      id: `calendar-${row.id}`,
      type: "calendar" as const,
      title: row.title,
      subtitle: row.start_time ? `Starts at ${row.start_time}` : "Calendar event",
      date: row.event_date,
    })),
  ]).slice(0, 6)

  const subscription = mapSubscriptionRow(auth.user)
  return mobileJson({
    stats: {
      totalTasks: Number(taskStats.total_tasks || 0),
      completedTasks: Number(taskStats.completed_tasks || 0),
      totalGoals: Number(goalStats.total_goals || 0),
      completedGoals: Number(goalStats.completed_goals || 0),
      upcomingEvents: calendarRows.length,
      monthlyIncome: Number(budgetStats.monthly_income || 0),
      monthlyExpenses: Number(budgetStats.monthly_expenses || 0),
    },
    upcoming,
    subscriptionBanner: {
      status: subscription.status,
      message: getSubscriptionBannerMessage(subscription),
      endsAt: subscription.endsAt ?? subscription.trialEndsAt,
    },
  })
}
