import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface AsteroidVisualProps {
  tone?: "hazard" | "nominal"
  sizeLabel: string
  className?: string
}

export function AsteroidVisual({ tone = "nominal", sizeLabel, className }: AsteroidVisualProps) {
  const { t } = useTranslation()

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "asteroid-visual relative flex h-36 w-36 items-center justify-center rounded-full sm:h-44 sm:w-44",
          tone === "hazard" ? "asteroid-visual-hazard" : "asteroid-visual-nominal",
        )}
      >
        <svg viewBox="0 0 160 160" className="h-full w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" role="img">
          <title>{t("dashboard.monitor.asteroid_visual")}</title>
          <polygon points="79,13 119,24 144,62 134,115 93,146 43,134 17,93 27,44" fill="#8f969b" />
          <polygon points="79,13 119,24 99,52 61,48" fill="#c4c8c7" opacity="0.85" />
          <polygon points="119,24 144,62 118,73 99,52" fill="#a3aaab" opacity="0.85" />
          <polygon points="27,44 61,48 50,88 17,93" fill="#727a7b" opacity="0.9" />
          <polygon points="61,48 99,52 88,91 50,88" fill="#989f9f" opacity="0.94" />
          <polygon points="99,52 118,73 105,112 88,91" fill="#697274" opacity="0.9" />
          <polygon points="50,88 88,91 93,146 43,134" fill="#b7b8b4" opacity="0.82" />
          <polygon points="88,91 105,112 134,115 93,146" fill="#8a8780" opacity="0.88" />
          <circle cx="63" cy="67" r="8" fill="#5b6265" opacity="0.5" />
          <circle cx="103" cy="88" r="12" fill="#545b60" opacity="0.38" />
          <circle cx="70" cy="111" r="6" fill="#656b6d" opacity="0.45" />
        </svg>
      </div>
      <div className="w-full max-w-44">
        <div className="ruler-line" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index} className={index % 3 === 0 ? "h-4" : "h-2"} />
          ))}
        </div>
        <p className="mt-2 truncate text-center text-sm font-semibold text-foreground">{sizeLabel}</p>
        <p className="text-center text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
          {t("dashboard.monitor.approximate")}
        </p>
      </div>
    </div>
  )
}
