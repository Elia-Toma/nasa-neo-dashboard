import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertTriangle, ArrowLeft, ExternalLink, Gauge, Orbit, Radar, Ruler } from "lucide-react"

import { AsteroidVisual } from "@/components/dashboard/AsteroidVisual"
import { RiskStatusBadge } from "@/components/dashboard/RiskStatusBadge"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationLocal } from "@/components/ui/pagination-local"
import { AsteroidDetails } from "@/models/Asteroid"
import { nasaService } from "@/services/nasaService"
import {
  formatDiameterRange,
  formatDistanceKm,
  formatVelocityKmh,
  getApproachDate,
  getMaxDiameterKm,
  getMissDistanceKm,
  getRiskTone,
  getVelocityKmh,
  toNumber,
  formatCompactDiameter,
} from "@/utils/asteroidMetrics"

const AsteroidDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [asteroid, setAsteroid] = useState<AsteroidDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) {
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await nasaService.getAsteroidDetails(id)
        setAsteroid(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("dashboard.errors.fetch_failed"))
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id, t])

  if (loading) {
    return <DetailSkeleton onBack={() => navigate(-1)} t={t} />
  }

  if (error) {
    return (
      <div className="mission-shell space-y-6">
        <TopBar onBack={() => navigate(-1)} />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.details.not_avail")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!asteroid) {
    return (
      <div className="mission-shell space-y-6">
        <TopBar onBack={() => navigate(-1)} />
        <Card className="mission-card">
          <CardContent className="flex min-h-48 items-center justify-center text-muted-foreground">
            {t("dashboard.details.not_found_card")}
          </CardContent>
        </Card>
      </div>
    )
  }

  const approachRows = asteroid.close_approach_data ?? []
  const orbitalRows = Object.entries(asteroid.orbital_data ?? {}).filter(([key]) => key !== "orbit_class")
  const orbitClass = asteroid.orbital_data?.orbit_class
  const startIndex = (page - 1) * pageSize
  const paginatedApproachRows = approachRows.slice(startIndex, startIndex + pageSize)
  const tone = getRiskTone(asteroid)

  return (
    <div className="mission-shell space-y-8">
      <TopBar onBack={() => navigate(-1)} />

      <section className="mission-panel rounded-2xl border p-5 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.42fr)_minmax(17rem,0.55fr)] lg:items-center">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <RiskStatusBadge isHazardous={asteroid.is_potentially_hazardous_asteroid} />
              {asteroid.is_sentry_object && <Badge variant="hazard">{t("dashboard.details.sentry_object")}</Badge>}
              <Badge variant="outline">ID {asteroid.id}</Badge>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("dashboard.details.hero_eyebrow")}
              </p>
              <h1 className="max-w-4xl break-words text-4xl font-semibold tracking-tight sm:text-5xl">
                {asteroid.name}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.details.designation")} {asteroid.designation ?? "n/a"} / {t("dashboard.details.abs_mag")}{" "}
                {asteroid.absolute_magnitude_h ?? "n/a"}
              </p>
            </div>
          </div>

          <AsteroidVisual tone={tone} sizeLabel={formatCompactDiameter(getMaxDiameterKm(asteroid))} />

          <div className="space-y-4">
            {asteroid.nasa_jpl_url && (
              <Button asChild className="w-full">
                <a href={asteroid.nasa_jpl_url} target="_blank" rel="noreferrer">
                  {t("dashboard.details.jpl_link")}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("dashboard.details.first_approach")} value={getApproachDate(asteroid)} icon={<Radar className="h-4 w-4" />} />
        <MetricCard label={t("dashboard.table.distance")} value={formatDistanceKm(getMissDistanceKm(asteroid))} icon={<Orbit className="h-4 w-4" />} />
        <MetricCard label={t("dashboard.table.max_size")} value={formatDiameterRange(asteroid)} icon={<Ruler className="h-4 w-4" />} />
        <MetricCard label={t("dashboard.details.rel_velocity")} value={formatVelocityKmh(getVelocityKmh(asteroid))} icon={<Gauge className="h-4 w-4" />} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Card className="mission-card">
          <CardHeader>
            <CardTitle>{t("dashboard.details.historical")}</CardTitle>
            {t("dashboard.details.historical_desc") && <CardDescription>{t("dashboard.details.historical_desc")}</CardDescription>}
          </CardHeader>
          <CardContent>
            {approachRows.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center rounded-lg border text-sm text-muted-foreground">
                {t("dashboard.details.no_historical")}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dashboard.table.approach_date")}</TableHead>
                      <TableHead>{t("dashboard.table.distance")}</TableHead>
                      <TableHead>{t("dashboard.table.velocity")}</TableHead>
                      <TableHead>{t("dashboard.details.orbiting_body")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApproachRows.map((approach, index) => (
                      <TableRow key={`${approach.epoch_date_close_approach ?? approach.close_approach_date}-${index}`}>
                        <TableCell>{approach.close_approach_date_full ?? approach.close_approach_date}</TableCell>
                        <TableCell>{formatDistanceKm(approach.miss_distance?.kilometers)}</TableCell>
                        <TableCell>{formatVelocityKmh(approach.relative_velocity?.kilometers_per_hour)}</TableCell>
                        <TableCell>{approach.orbiting_body ?? "n/a"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationLocal
                  currentPage={page}
                  pageSize={pageSize}
                  totalItems={approachRows.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mission-card">
          <CardHeader>
            <CardTitle>{t("dashboard.details.orbit_data")}</CardTitle>
            <CardDescription>{t("dashboard.details.orbit_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orbitClass && (
              <div className="rounded-lg border bg-background/50 p-4">
                <p className="text-sm font-medium">{orbitClass.orbit_class_type ?? t("dashboard.details.orbit_class")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orbitClass.orbit_class_description ?? t("dashboard.details.orbit_class_desc")}
                </p>
              </div>
            )}
            <div className="space-y-3">
              {orbitalRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashboard.details.no_orbit")}</p>
              ) : (
                orbitalRows.map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{formatKey(key)}</span>
                      <span className="max-w-[12rem] truncate text-right font-medium">{formatValue(value)}</span>
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TopBar({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="h-4 w-4" />
        {t("dashboard.details.back")}
      </Button>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </div>
  )
}

function DetailSkeleton({ onBack, t }: { onBack: () => void; t: (key: string) => string }) {
  return (
    <div className="mission-shell space-y-6">
      <TopBar onBack={onBack} />
      <section className="mission-panel rounded-2xl border p-5 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_14rem_18rem]">
          <div className="space-y-4">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-12 w-full max-w-2xl" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-44 w-44 rounded-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="mission-card">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
      <span className="sr-only">{t("dashboard.details.loading")}</span>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="mission-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardDescription>{label}</CardDescription>
        <div className="rounded-md border border-[color:var(--nasa-cyan)]/30 bg-[color:var(--nasa-cyan)]/10 p-2 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="truncate text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function formatKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "n/a"
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : "n/a"
  }

  if (typeof value === "string") {
    const numeric = toNumber(value, Number.NaN)
    return Number.isFinite(numeric) && value.length > 4 ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : value
  }

  return JSON.stringify(value)
}

export default AsteroidDetail
