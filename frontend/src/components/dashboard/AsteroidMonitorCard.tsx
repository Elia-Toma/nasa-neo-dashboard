import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"
import { ArrowUpRight, Gauge, Orbit, Ruler, SatelliteDish } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Asteroid } from "@/models/Asteroid"
import { cn } from "@/lib/utils"
import {
  formatCompactDistance,
  formatCompactDiameter,
  formatDiameterRange,
  formatVelocityKms,
  getApproach,
  getApproachDate,
  getMaxDiameterKm,
  getMissDistanceKm,
  getRiskTone,
  getVelocityKms,
} from "@/utils/asteroidMetrics"
import { AsteroidVisual } from "./AsteroidVisual"
import { CountdownPanel } from "./CountdownPanel"
import { RiskStatusBadge } from "./RiskStatusBadge"

interface AsteroidMonitorCardProps {
  asteroid: Asteroid
}

export function AsteroidMonitorCard({ asteroid }: AsteroidMonitorCardProps) {
  const { t } = useTranslation()
  const tone = getRiskTone(asteroid)
  const approach = getApproach(asteroid)

  return (
    <Card
      className={cn(
        "mission-card overflow-hidden py-0",
        tone === "hazard" ? "mission-card-hazard" : "mission-card-nominal",
      )}
    >
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(14rem,0.55fr)_minmax(17rem,0.85fr)]">
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("dashboard.monitor.tracking_id")} {asteroid.id}
                </p>
                <h3 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{asteroid.name}</h3>
              </div>
              <RiskStatusBadge isHazardous={asteroid.is_potentially_hazardous_asteroid} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricBlock
                icon={<SatelliteDish className="h-4 w-4" />}
                label={t("dashboard.monitor.approach")}
                value={approach?.close_approach_date_full ?? getApproachDate(asteroid)}
              />
              <MetricBlock
                icon={<Gauge className="h-4 w-4" />}
                label={t("dashboard.table.velocity")}
                value={formatVelocityKms(getVelocityKms(asteroid))}
              />
              <MetricBlock
                icon={<Orbit className="h-4 w-4" />}
                label={t("dashboard.table.distance")}
                value={formatCompactDistance(getMissDistanceKm(asteroid))}
              />
              <MetricBlock
                icon={<Ruler className="h-4 w-4" />}
                label={t("dashboard.monitor.absolute_magnitude")}
                value={asteroid.absolute_magnitude_h !== undefined ? `+${asteroid.absolute_magnitude_h}` : "n/a"}
              />
            </div>
          </div>

          <div className="flex items-center justify-center border-y border-border/70 bg-background/35 p-5 lg:border-x lg:border-y-0">
            <AsteroidVisual tone={tone} sizeLabel={formatCompactDiameter(getMaxDiameterKm(asteroid))} />
          </div>

          <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
            <CountdownPanel asteroid={asteroid} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetricBlock label={t("dashboard.monitor.estimated_range")} value={formatDiameterRange(asteroid)} compact />
              <MetricBlock label={t("dashboard.monitor.orbiting_body")} value={approach?.orbiting_body ?? "n/a"} compact />
            </div>
            <Button asChild className="w-full text-white dark:text-black">
              <Link to={`/asteroid/${asteroid.id}`}>
                {t("dashboard.table.details")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricBlock({
  icon,
  label,
  value,
  compact = false,
}: {
  icon?: ReactNode
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("truncate font-semibold text-foreground", compact ? "text-sm" : "text-base sm:text-lg")}>
        {value}
      </div>
    </div>
  )
}
