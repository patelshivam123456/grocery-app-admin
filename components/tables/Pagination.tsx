'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3 text-sm text-muted-foreground">
      <span>Page {page + 1} of {Math.max(pageCount, 1)}</span>
      <div className="flex gap-2">
        <Button variant="outline" className="h-9 w-9 p-0" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" className="h-9 w-9 p-0" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
