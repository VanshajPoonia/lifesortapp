"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { CalendarDays, CheckSquare, Home, MoreHorizontal, Target } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "More", icon: MoreHorizontal },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const tap = () => {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={tap}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="mb-0.5 h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
