import { Asteroid, AsteroidDetails, ChartDataPoint, CloseApproachData } from "@/models/Asteroid"

export type HazardFilter = "all" | "hazardous" | "safe"
export type SortBy = "date" | "size" | "distance"
export type RiskTone = "hazard" | "nominal"

export interface CountdownParts {
  days: string
  hours: string
  minutes: string
  seconds: string
  isPast: boolean
}

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

const compactFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
})

const decimalFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 3,
})

const meterFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

const compactMeterFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function toNumber(value: string | number | undefined | null, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export function getApproach(asteroid: Asteroid | AsteroidDetails): CloseApproachData | undefined {
  return asteroid.close_approach_data?.[0]
}

export function getMissDistanceKm(asteroid: Asteroid | AsteroidDetails) {
  return asteroid._processed?.miss_distance_km ?? toNumber(getApproach(asteroid)?.miss_distance?.kilometers)
}

export function getMaxDiameterKm(asteroid: Asteroid | AsteroidDetails) {
  return (
    asteroid._processed?.max_diameter_km ??
    toNumber(asteroid.estimated_diameter?.kilometers?.estimated_diameter_max)
  )
}

export function getMinDiameterKm(asteroid: Asteroid | AsteroidDetails) {
  return toNumber(asteroid.estimated_diameter?.kilometers?.estimated_diameter_min)
}

export function getVelocityKmh(asteroid: Asteroid | AsteroidDetails) {
  return toNumber(getApproach(asteroid)?.relative_velocity?.kilometers_per_hour)
}

export function getVelocityKms(asteroid: Asteroid | AsteroidDetails) {
  return toNumber(getApproach(asteroid)?.relative_velocity?.kilometers_per_second)
}

export function getApproachDate(asteroid: Asteroid | AsteroidDetails) {
  return asteroid._processed?.close_approach_date ?? getApproach(asteroid)?.close_approach_date ?? "n/a"
}

export function getApproachTimestamp(asteroid: Asteroid | AsteroidDetails) {
  const approach = getApproach(asteroid)
  const epoch = toNumber(approach?.epoch_date_close_approach, Number.NaN)

  if (Number.isFinite(epoch)) {
    return epoch < 10_000_000_000 ? epoch * 1000 : epoch
  }

  const parsedFullDate = parseApproachDate(approach?.close_approach_date_full)
  if (parsedFullDate !== null) {
    return parsedFullDate
  }

  return parseApproachDate(approach?.close_approach_date)
}

export function formatDistanceKm(value: number | string | undefined | null) {
  return `${numberFormat.format(toNumber(value))} km`
}

export function formatCompactDistance(value: number | string | undefined | null) {
  return `${compactFormat.format(toNumber(value))} km`
}

export function formatDiameterKm(value: number | string | undefined | null) {
  return `${decimalFormat.format(toNumber(value))} km`
}

export function formatDiameterAdaptive(value: number | string | undefined | null) {
  const valueKm = toNumber(value)
  const valueMeters = valueKm * 1000

  if (!Number.isFinite(valueMeters) || valueMeters <= 0) {
    return "n/a"
  }

  if (valueMeters >= 1000) {
    return `${decimalFormat.format(valueKm)} km`
  }

  return `${meterFormat.format(valueMeters)} m`
}

export function formatDiameterRange(asteroid: Asteroid | AsteroidDetails) {
  return `${formatDiameterAdaptive(getMinDiameterKm(asteroid))} - ${formatDiameterAdaptive(getMaxDiameterKm(asteroid))}`
}

export function formatCompactDiameter(value: number | string | undefined | null) {
  const valueMeters = toNumber(value) * 1000

  if (!Number.isFinite(valueMeters) || valueMeters <= 0) {
    return "n/a"
  }

  return valueMeters >= 1000
    ? `${decimalFormat.format(valueMeters / 1000)} km`
    : `${compactMeterFormat.format(valueMeters)} m`
}

export function formatVelocityKmh(value: number | string | undefined | null) {
  return `${numberFormat.format(toNumber(value))} km/h`
}

export function formatVelocityKms(value: number | string | undefined | null) {
  return `${decimalFormat.format(toNumber(value))} km/s`
}

export function getRiskTone(asteroid: Asteroid | AsteroidDetails): RiskTone {
  return asteroid.is_potentially_hazardous_asteroid ? "hazard" : "nominal"
}

export function getCountdownParts(asteroid: Asteroid | AsteroidDetails, now = Date.now()): CountdownParts {
  const timestamp = getApproachTimestamp(asteroid)
  const delta = timestamp === null ? 0 : timestamp - now
  const isPast = timestamp === null || delta <= 0
  const remaining = Math.max(0, delta)
  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days: padTime(days),
    hours: padTime(hours),
    minutes: padTime(minutes),
    seconds: padTime(seconds),
    isPast,
  }
}

export function filterAsteroidsByHazard<T extends Asteroid | ChartDataPoint>(
  items: T[],
  filter: HazardFilter,
) {
  if (filter === "all") {
    return items
  }

  return items.filter((item) => {
    const isHazardous =
      "is_hazardous" in item
        ? item.is_hazardous
        : item.is_potentially_hazardous_asteroid

    return filter === "hazardous" ? isHazardous : !isHazardous
  })
}

export function sortAsteroidsLocally(asteroids: Asteroid[], sortBy: SortBy | string) {
  return [...asteroids].sort((left, right) => {
    if (sortBy === "distance") {
      return getMissDistanceKm(left) - getMissDistanceKm(right)
    }

    if (sortBy === "size") {
      return getMaxDiameterKm(right) - getMaxDiameterKm(left)
    }

    return getSortableTimestamp(left) - getSortableTimestamp(right)
  })
}

export function getDashboardStats(asteroids: Asteroid[]) {
  const hazardousCount = asteroids.filter((asteroid) => asteroid.is_potentially_hazardous_asteroid).length
  const closest = asteroids.reduce<Asteroid | undefined>((current, asteroid) => {
    if (!current) {
      return asteroid
    }

    return getMissDistanceKm(asteroid) < getMissDistanceKm(current) ? asteroid : current
  }, undefined)

  const largest = asteroids.reduce<Asteroid | undefined>((current, asteroid) => {
    if (!current) {
      return asteroid
    }

    return getMaxDiameterKm(asteroid) > getMaxDiameterKm(current) ? asteroid : current
  }, undefined)

  return {
    total: asteroids.length,
    hazardousCount,
    closest,
    largest,
  }
}

function getSortableTimestamp(asteroid: Asteroid | AsteroidDetails) {
  return getApproachTimestamp(asteroid) ?? Number.MAX_SAFE_INTEGER
}

function padTime(value: number) {
  return String(value).padStart(2, "0")
}

function parseApproachDate(value: string | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.replace(/^(\d{4})-([A-Za-z]{3})-(\d{2})/, "$2 $3, $1")
  const timestamp = Date.parse(normalized)
  return Number.isFinite(timestamp) ? timestamp : null
}
