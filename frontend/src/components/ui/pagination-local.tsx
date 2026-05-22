import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationLocalProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function PaginationLocal({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: PaginationLocalProps) {
    const { t } = useTranslation();
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row px-2 py-4">
            <div className="flex flex-1 items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {t('dashboard.pagination.rows_per_page')}
                </span>
                <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                        onPageSizeChange(Number(val));
                        // reset to page 1 to avoid out-of-bounds
                        onPageChange(1);
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={String(pageSize)} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 20, 50, 100].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    {t('dashboard.pagination.page_of', { current: currentPage, total: totalPages })}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <span className="sr-only">{t('dashboard.pagination.prev')}</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <span className="sr-only">{t('dashboard.pagination.next')}</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
