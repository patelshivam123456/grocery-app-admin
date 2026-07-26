'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import type { ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';

export function Filters({
  module,
  query,
  setQuery,
  filters,
  setFilters,
}: {
  module: ModuleConfig;
  query: string;
  setQuery: (value: string) => void;
  filters: Record<string, string>;
  setFilters: (value: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center">
      <label className="relative min-w-64 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${module.label.toLowerCase()}`} className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2" />
      </label>
      <div className="flex flex-wrap gap-2">
        {module.filters.map((filter) => {
          const config = module.fields.find((field) => field.name === filter);
          const options = config?.options ?? Array.from(new Set(module.statuses));
          return (
            <select key={filter} value={filters[filter] ?? ''} onChange={(event) => setFilters({ ...filters, [filter]: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{config?.label ?? filter}</option>
              {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          );
        })}
        <Button variant="outline" onClick={() => setFilters({})}><SlidersHorizontal className="h-4 w-4" /> Reset</Button>
      </div>
    </div>
  );
}
