import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { TimerReset } from "lucide-react"

import { cn } from "@/lib/utils"
import { Asteroid, AsteroidDetails } from "@/models/Asteroid"
import { getCountdownParts } from "@/utils/asteroidMetrics"

interface CountdownPanelProps {
  asteroid: Asteroid | AsteroidDetails
  className?: string
}

export function CountdownPanel({ asteroid, className }: CountdownPanelProps) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const countdown = getCountdownParts(asteroid, now)

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  return (
    <div className={cn("countdown-panel rounded-lg border px-4 py-3", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <TimerReset className="h-3.5 w-3.5 text-primary" />
          {t("dashboard.monitor.countdown")}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {countdown.isPast ? t("dashboard.monitor.past_pass") : "T-"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <CountdownCell value={countdown.days} label={t("dashboard.monitor.days")} />
        <CountdownCell value={countdown.hours} label={t("dashboard.monitor.hours")} />
        <CountdownCell value={countdown.minutes} label={t("dashboard.monitor.minutes")} />
        <CountdownCell value={countdown.seconds} label={t("dashboard.monitor.seconds")} />
      </div>
    </div>
  )
}

function CountdownCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 text-center">
      <div className="font-mono text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{value}</div>
      <div className="truncate text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
    </div>
  )
}
