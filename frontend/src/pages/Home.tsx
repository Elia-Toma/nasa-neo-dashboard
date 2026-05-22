import React, { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { format, parse } from "date-fns"
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Database,
  Filter,
  Maximize2,
  Orbit,
  Radar,
  RadioTower,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react"

import { AsteroidCharts } from "@/components/dashboard/AsteroidCharts"
import { AsteroidMonitorCard } from "@/components/dashboard/AsteroidMonitorCard"
import { AsteroidTable } from "@/components/dashboard/AsteroidTable"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Asteroid, ChartDataPoint } from "@/models/Asteroid"
import { nasaService } from "@/services/nasaService"
import {
  HazardFilter,
  SortBy,
  filterAsteroidsByHazard,
  formatCompactDiameter,
  formatCompactDistance,
  getDashboardStats,
  getMaxDiameterKm,
  getMissDistanceKm,
  sortAsteroidsLocally,
} from "@/utils/asteroidMetrics"

const MONITOR_PREVIEW_COUNT = 6

const Home: React.FC = () => {
  const { t } = useTranslation()

  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  const formatDateStr = (date: Date) => format(date, "yyyy-MM-dd")

  const getSessionState = useCallback(() => {
    try {
      const saved = sessionStorage.getItem("nasa_dashboard_state")
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error("Failed to load sessionStorage state", e)
    }
    return null
  }, [])

  const sessionState = useMemo(() => getSessionState(), [getSessionState])

  const [startDateInput, setStartDateInput] = useState(sessionState?.startDateInput ?? formatDateStr(sevenDaysAgo))
  const [endDateInput, setEndDateInput] = useState(sessionState?.endDateInput ?? formatDateStr(today))
  const [fetchStartDate, setFetchStartDate] = useState(sessionState?.fetchStartDate ?? formatDateStr(sevenDaysAgo))
  const [fetchEndDate, setFetchEndDate] = useState(sessionState?.fetchEndDate ?? formatDateStr(today))
  const [hazardFilter, setHazardFilter] = useState<HazardFilter>(sessionState?.hazardFilter ?? "all")
  const [sortBy, setSortBy] = useState<SortBy>(sessionState?.sortBy ?? "date")
  const [asteroids, setAsteroids] = useState<Asteroid[]>(sessionState?.asteroids ?? [])
  const [chartData, setChartData] = useState<ChartDataPoint[]>(sessionState?.chartData ?? [])
  const [loading, setLoading] = useState(sessionState ? false : true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [listResponse, chartResponse] = await Promise.all([
        nasaService.getAsteroids(fetchStartDate, fetchEndDate, false),
        nasaService.getAsteroidsChartData(fetchStartDate, fetchEndDate),
      ])
      setAsteroids(listResponse.results)
      setChartData(chartResponse.chart_data)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "";
      if (errMsg.includes("429")) {
        setError(t("dashboard.errors.rate_limit_exceeded"))
      } else if (errMsg.includes("range too long") || errMsg.includes("400")) {
        setError(t("dashboard.errors.range_too_long"))
      } else {
        setError(err instanceof Error ? err.message : t("dashboard.errors.fetch_failed"))
      }
    } finally {
      setLoading(false)
    }
  }, [fetchEndDate, fetchStartDate, t])

  const isRestored = useRef(!!sessionState)

  useEffect(() => {
    if (isRestored.current) {
      isRestored.current = false
      return
    }
    fetchData()
  }, [fetchData])

  useEffect(() => {
    try {
      const stateToSave = {
        startDateInput,
        endDateInput,
        fetchStartDate,
        fetchEndDate,
        hazardFilter,
        sortBy,
        asteroids,
        chartData,
      }
      sessionStorage.setItem("nasa_dashboard_state", JSON.stringify(stateToSave))
    } catch (e) {
      console.error("Failed to save state to sessionStorage", e)
    }
  }, [
    startDateInput,
    endDateInput,
    fetchStartDate,
    fetchEndDate,
    hazardFilter,
    sortBy,
    asteroids,
    chartData,
  ])

  const filteredAsteroids = useMemo(
    () => filterAsteroidsByHazard(asteroids, hazardFilter),
    [asteroids, hazardFilter],
  )

  const sortedAsteroids = useMemo(
    () => sortAsteroidsLocally(filteredAsteroids, sortBy),
    [filteredAsteroids, sortBy],
  )

  const filteredChartData = useMemo(
    () => filterAsteroidsByHazard(chartData, hazardFilter),
    [chartData, hazardFilter],
  )

  const stats = useMemo(() => getDashboardStats(sortedAsteroids), [sortedAsteroids])
  const monitorAsteroids = sortedAsteroids.slice(0, MONITOR_PREVIEW_COUNT)
  const invalidInputRange = startDateInput > endDateInput
  
  const isRangeTooLong = useMemo(() => {
    if (invalidInputRange) return false;
    try {
      const start = parse(startDateInput, "yyyy-MM-dd", new Date());
      const end = parse(endDateInput, "yyyy-MM-dd", new Date());
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 90;
    } catch {
      return false;
    }
  }, [startDateInput, endDateInput, invalidInputRange]);

  const parseDateStr = (dateStr: string) => parse(dateStr, "yyyy-MM-dd", new Date())

  const submitSearch = () => {
    if (!invalidInputRange && !isRangeTooLong) {
      setFetchStartDate(startDateInput)
      setFetchEndDate(endDateInput)
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDateInput(formatDateStr(date))
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setEndDateInput(formatDateStr(date))
    }
  }

  return (
    <div className="mission-shell space-y-8">
      <header className="mission-panel rounded-2xl border p-5 sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="nominal" className="uppercase tracking-[0.16em]">
                <Database className="h-3 w-3" />
                {t("dashboard.badges.nasa_api")}
              </Badge>
              <Badge variant={error ? "destructive" : loading ? "secondary" : "nominal"}>
                {error
                  ? t("dashboard.badges.api_error")
                  : loading
                    ? t("dashboard.badges.updating_data")
                    : t("dashboard.badges.data_synced")}
              </Badge>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--nasa-cyan)]/30 bg-[color:var(--nasa-cyan)]/10 text-primary">
                <Orbit className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("dashboard.hero.eyebrow")}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  {t("dashboard.title")}
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("dashboard.hero.copy")}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <Card className="mission-card">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              {t("dashboard.filters.title")}
            </CardTitle>
            {t("dashboard.filters.desc") && <CardDescription>{t("dashboard.filters.desc")}</CardDescription>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{fetchStartDate} / {fetchEndDate}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">{t("dashboard.filters.start_date")}</Label>
                <DatePicker date={parseDateStr(startDateInput)} onSelect={handleStartDateChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">{t("dashboard.filters.end_date")}</Label>
                <DatePicker date={parseDateStr(endDateInput)} onSelect={handleEndDateChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("dashboard.filters.sort_by")}</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t("dashboard.filters.sort_options.date")}</SelectItem>
                    <SelectItem value="size">{t("dashboard.filters.sort_options.size")}</SelectItem>
                    <SelectItem value="distance">{t("dashboard.filters.sort_options.distance")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.filters.risk")}</Label>
                <Select value={hazardFilter} onValueChange={(value) => setHazardFilter(value as HazardFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.filters.all")}</SelectItem>
                    <SelectItem value="hazardous">{t("dashboard.filters.only_hazardous")}</SelectItem>
                    <SelectItem value="safe">{t("dashboard.filters.only_safe")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={submitSearch} disabled={loading || invalidInputRange || isRangeTooLong} className="w-full lg:w-auto">
                <Search className="h-4 w-4" />
                {t("dashboard.pagination.search")}
              </Button>
            </div>
          </div>

          {invalidInputRange && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("dashboard.errors.invalid_date_range")}</AlertTitle>
              <AlertDescription>{t("dashboard.errors.invalid_date_desc")}</AlertDescription>
            </Alert>
          )}

          {isRangeTooLong && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("dashboard.errors.invalid_date_range")}</AlertTitle>
              <AlertDescription>{t("dashboard.errors.range_too_long")}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.errors.cannot_load")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Radar className="h-4 w-4" />}
          label={t("dashboard.stats.asteroids")}
          value={String(stats.total)}
          description={t("dashboard.stats.filtered_results")}
        />
        <KpiCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label={t("dashboard.stats.potentially_hazardous")}
          value={String(stats.hazardousCount)}
          description={`${stats.total ? Math.round((stats.hazardousCount / stats.total) * 100) : 0}% ${t("dashboard.stats.of_range")}`}
          tone="hazard"
        />
        <KpiCard
          icon={<RadioTower className="h-4 w-4" />}
          label={t("dashboard.stats.closest_pass")}
          value={stats.closest ? formatCompactDistance(getMissDistanceKm(stats.closest)) : "n/a"}
          description={stats.closest?.name ?? t("dashboard.stats.none")}
        />
        <KpiCard
          icon={<Maximize2 className="h-4 w-4" />}
          label={t("dashboard.stats.max_diameter")}
          value={stats.largest ? formatCompactDiameter(getMaxDiameterKm(stats.largest)) : "n/a"}
          description={stats.largest?.name ?? t("dashboard.stats.none")}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {t("dashboard.monitor.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t("dashboard.monitor.title")}</h2>
          </div>
          <Badge variant="outline">
            <Activity className="h-3 w-3" />
            {sortedAsteroids.length} {t("dashboard.table.results")}
          </Badge>
        </div>

        {loading ? (
          <MonitorSkeleton />
        ) : sortedAsteroids.length === 0 ? (
          <Card className="mission-card">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
              <Filter className="h-9 w-9 text-muted-foreground" />
              <div>
                <p className="font-medium">{t("dashboard.table.empty")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.table.empty_desc")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {monitorAsteroids.map((asteroid) => (
              <AsteroidMonitorCard key={asteroid.id} asteroid={asteroid} />
            ))}
          </div>
        )}

        {!loading && sortedAsteroids.length > monitorAsteroids.length && (
          <p className="text-sm text-muted-foreground">{t("dashboard.monitor.catalog_hint")}</p>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow={t("dashboard.analytics.eyebrow")} title={t("dashboard.analytics.title")} />
        <AsteroidCharts data={filteredChartData} isLoading={loading} />
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow={t("dashboard.catalog.eyebrow")} title={t("dashboard.catalog.title")} />
        <AsteroidTable asteroids={sortedAsteroids} isLoading={loading} />
      </section>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  description,
  tone = "nominal",
}: {
  icon: React.ReactNode
  label: string
  value: string
  description: string
  tone?: "nominal" | "hazard"
}) {
  return (
    <Card className="mission-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardDescription>{label}</CardDescription>
        <div
          className={`rounded-md border p-2 ${
            tone === "hazard"
              ? "border-[color:var(--nasa-red)]/30 bg-[color:var(--nasa-red)]/10 text-[color:var(--nasa-red)]"
              : "border-[color:var(--nasa-cyan)]/30 bg-[color:var(--nasa-cyan)]/10 text-primary"
          }`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="truncate text-2xl font-semibold">{value}</div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  )
}

function MonitorSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((item) => (
        <Card key={item} className="mission-card">
          <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_14rem_18rem]">
            <div className="space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 w-80 max-w-full" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            <Skeleton className="h-44 w-full rounded-full" />
            <Skeleton className="h-44 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default Home
