import { useTranslation } from "react-i18next"
import { RadioTower, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RiskStatusBadgeProps {
  isHazardous: boolean
  className?: string
}

export function RiskStatusBadge({ isHazardous, className }: RiskStatusBadgeProps) {
  const { t } = useTranslation()
  const Icon = isHazardous ? ShieldAlert : RadioTower

  return (
    <Badge
      variant={isHazardous ? "hazard" : "nominal"}
      className={cn("uppercase tracking-[0.16em]", className)}
    >
      <Icon className="h-3 w-3" />
      {isHazardous ? t("dashboard.monitor.hazardous") : t("dashboard.monitor.nominal")}
    </Badge>
  )
}
