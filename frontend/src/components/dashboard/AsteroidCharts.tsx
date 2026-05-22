import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, ZAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChartDataPoint } from '../../models/Asteroid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BarChart3, RadioTower } from 'lucide-react';
import { formatCompactDistance, formatDiameterKm } from '@/utils/asteroidMetrics';

interface AsteroidChartsProps {
    data: ChartDataPoint[];
    isLoading: boolean;
}

export const AsteroidCharts: React.FC<AsteroidChartsProps> = ({ data, isLoading }) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[0, 1].map((item) => (
                    <Card key={item} className="mission-card">
                        <CardHeader>
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-72 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="mission-card">
                <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="font-medium">{t('dashboard.charts.empty')}</p>
                        <p className="text-sm text-muted-foreground">{t('dashboard.charts.empty_desc')}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Split raw data into safe and hazardous datasets
    const safeData = data.filter((d) => !d.is_hazardous);
    const hazardousData = data.filter((d) => d.is_hazardous);

    // Aggregate size values into histogram bins
    const sizeBins = {
        small: 0,
        medium: 0,
        large: 0,
        giant: 0
    };

    data.forEach((item) => {
        if (item.size_km < 0.1) {
            sizeBins.small += 1;
        } else if (item.size_km < 0.5) {
            sizeBins.medium += 1;
        } else if (item.size_km <= 1.0) {
            sizeBins.large += 1;
        } else {
            sizeBins.giant += 1;
        }
    });

    const sizeDistributionData = [
        { name: t('dashboard.charts.size_bin_small'), count: sizeBins.small },
        { name: t('dashboard.charts.size_bin_medium'), count: sizeBins.medium },
        { name: t('dashboard.charts.size_bin_large'), count: sizeBins.large },
        { name: t('dashboard.charts.size_bin_giant'), count: sizeBins.giant }
    ];

    // Custom component to format hover state metadata
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload as ChartDataPoint;
            return (
                <div className="rounded-lg border border-border bg-card p-3 shadow-md text-card-foreground">
                    <p className="font-semibold text-sm mb-1">{item.name}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                            <span className="font-medium text-foreground">{t('dashboard.table.approach_date')}:</span> {item.date}
                        </p>
                        <p>
                            <span className="font-medium text-foreground">{t('dashboard.table.distance')}:</span> {formatCompactDistance(item.distance_km)}
                        </p>
                        <p>
                            <span className="font-medium text-foreground">{t('dashboard.table.max_size')}:</span> {formatDiameterKm(item.size_km)}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-border flex items-center gap-1.5">
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.is_hazardous ? 'bg-[color:var(--nasa-red)]' : 'bg-primary'}`} />
                            <span className={`font-semibold uppercase tracking-wider text-[10px] ${item.is_hazardous ? 'text-[color:var(--nasa-red)] dark:text-[#ffb3a7]' : 'text-primary'}`}>
                                {item.is_hazardous ? t('dashboard.details.hazardous') : t('dashboard.table.safe')}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Close approach distance scatter plot */}
            <Card className="mission-card">
                <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <RadioTower className="h-4 w-4 text-primary" />
                                {t('dashboard.charts.distance_title')}
                            </CardTitle>
                            <CardDescription>{t('dashboard.charts.distance_desc')}</CardDescription>
                        </div>
                        <Badge variant="outline">{data.length} {t('dashboard.charts.points')}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-72 min-w-0">
                        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 288 }}>
                            <ScatterChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    type="category"
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickMargin={10}
                                    allowDuplicatedCategory={false}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="distance_km"
                                    tickFormatter={(value) => formatCompactDistance(value).replace(' km', '')}
                                    tick={{ fontSize: 12 }}
                                />
                                <ZAxis type="number" range={[60, 60]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={36} />
                                <Scatter
                                    name={t('dashboard.table.safe')}
                                    data={safeData}
                                    fill="var(--primary)"
                                    shape="circle"
                                />
                                <Scatter
                                    name={t('dashboard.details.hazardous')}
                                    data={hazardousData}
                                    fill="var(--destructive)"
                                    shape="circle"
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Size distribution histogram */}
            <Card className="mission-card">
                <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                {t('dashboard.charts.size_title')}
                            </CardTitle>
                            <CardDescription>{t('dashboard.charts.size_desc')}</CardDescription>
                        </div>
                        <Badge variant="secondary">{data.length} {t('dashboard.table.results')}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-72 min-w-0">
                        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 288 }}>
                            <BarChart data={sizeDistributionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    height={40}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    formatter={(value) => [value, t('dashboard.charts.size_series')]}
                                    cursor={{ fill: 'var(--muted)', opacity: 0.15 }}
                                />
                                <Bar
                                    dataKey="count"
                                    name={t('dashboard.charts.size_series')}
                                    fill="var(--chart-2)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
