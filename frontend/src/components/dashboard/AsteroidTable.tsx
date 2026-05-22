import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Asteroid } from '../../models/Asteroid';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    formatDiameterAdaptive,
    formatDistanceKm,
    formatVelocityKmh,
    getApproachDate,
    getMaxDiameterKm,
    getMinDiameterKm,
    getMissDistanceKm,
    getVelocityKmh,
} from '@/utils/asteroidMetrics';
import { ExternalLink, Radar } from 'lucide-react';
import { PaginationLocal } from '../ui/pagination-local';
import { RiskStatusBadge } from './RiskStatusBadge';

interface AsteroidTableProps {
    asteroids: Asteroid[];
    isLoading: boolean;
}

export const AsteroidTable: React.FC<AsteroidTableProps> = ({ asteroids, isLoading }) => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(1);
    }, [asteroids]);

    if (isLoading) {
        return (
            <Card className="mission-card">
                <CardHeader>
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[0, 1, 2, 3, 4].map((item) => (
                        <Skeleton key={item} className="h-12 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!asteroids || asteroids.length === 0) {
        return (
            <Card className="mission-card">
                <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                    <Radar className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="font-medium">{t('dashboard.table.empty')}</p>
                        <p className="text-sm text-muted-foreground">{t('dashboard.table.empty_desc')}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const startIndex = (page - 1) * pageSize;
    const paginatedAsteroids = asteroids.slice(startIndex, startIndex + pageSize);

    return (
        <Card className="mission-card">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>{t('dashboard.table.catalog')}</CardTitle>
                    {t('dashboard.table.catalog_desc') && <CardDescription>{t('dashboard.table.catalog_desc')}</CardDescription>}
                </div>
                <Badge variant="outline">{asteroids.length} {t('dashboard.table.results')}</Badge>
            </CardHeader>
            <CardContent>
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('dashboard.table.name')}</TableHead>
                                <TableHead>{t('dashboard.table.approach_date')}</TableHead>
                                <TableHead>{t('dashboard.table.distance')}</TableHead>
                                <TableHead>{t('dashboard.table.max_size')}</TableHead>
                                <TableHead>{t('dashboard.table.velocity')}</TableHead>
                                <TableHead>{t('dashboard.table.hazardous')}</TableHead>
                                <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                    {paginatedAsteroids.map((asteroid) => (
                        <TableRow key={asteroid.id}>
                            <TableCell className="max-w-[18rem]">
                                <div className="truncate font-medium">{asteroid.name}</div>
                                <div className="text-xs text-muted-foreground">ID {asteroid.id}</div>
                            </TableCell>
                            <TableCell>{getApproachDate(asteroid)}</TableCell>
                            <TableCell>{formatDistanceKm(getMissDistanceKm(asteroid))}</TableCell>
                            <TableCell>
                                {formatDiameterAdaptive(getMinDiameterKm(asteroid))} - {formatDiameterAdaptive(getMaxDiameterKm(asteroid))}
                            </TableCell>
                            <TableCell>{formatVelocityKmh(getVelocityKmh(asteroid))}</TableCell>
                            <TableCell>
                                <RiskStatusBadge isHazardous={asteroid.is_potentially_hazardous_asteroid} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild size="sm" variant="ghost">
                                    <Link to={`/asteroid/${asteroid.id}`}>
                                        {t('dashboard.table.details')}
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                    {paginatedAsteroids.map((asteroid) => (
                        <div key={asteroid.id} className="rounded-lg border bg-background/50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{asteroid.name}</p>
                                    <p className="text-xs text-muted-foreground">{getApproachDate(asteroid)}</p>
                                </div>
                                <RiskStatusBadge isHazardous={asteroid.is_potentially_hazardous_asteroid} />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <Metric label={t('dashboard.table.distance')} value={formatDistanceKm(getMissDistanceKm(asteroid))} />
                                <Metric label={t('dashboard.table.max_size')} value={formatDiameterAdaptive(getMaxDiameterKm(asteroid))} />
                                <Metric label={t('dashboard.table.velocity')} value={formatVelocityKmh(getVelocityKmh(asteroid))} />
                                <Metric label="ID" value={asteroid.id} />
                            </div>
                            <Button asChild className="mt-4 w-full" variant="secondary">
                                <Link to={`/asteroid/${asteroid.id}`}>
                                    {t('dashboard.table.open_detail')}
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
                
                {asteroids.length > 0 && (
                    <PaginationLocal 
                        currentPage={page}
                        pageSize={pageSize}
                        totalItems={asteroids.length}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                )}
            </CardContent>
        </Card>
    );
};

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate font-medium">{value}</p>
        </div>
    );
}
