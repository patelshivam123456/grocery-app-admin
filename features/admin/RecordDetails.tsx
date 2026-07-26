'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { StatusChip } from '@/components/common/StatusChip';
import type { AdminRecord, ModuleConfig } from '@/types/admin';
import { readable } from '@/utils/format';

export function RecordDetails({ module, record }: { module: ModuleConfig; record: AdminRecord }) {
  const sections = module.fields.reduce<Record<string, typeof module.fields>>((groups, field) => {
    const section = field.section ?? 'Details';
    return { ...groups, [section]: [...(groups[section] ?? []), field] };
  }, {});

  return (
    <div className="space-y-4">
      {module.imageField && typeof record[module.imageField] === 'string' ? (
        <img src={String(record[module.imageField])} alt="" className="max-h-64 w-full rounded-lg border border-border object-cover" />
      ) : null}
      {Object.entries(sections).map(([section, fields]) => (
        <Card key={section}>
          <CardContent>
            <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">{section}</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {(fields ?? []).map((field) => {
                const value = record[field.name];
                return (
                  <div key={field.name}>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">{field.label}</dt>
                    <dd className="mt-1 text-sm">{field.name === 'status' && typeof value === 'string' ? <StatusChip status={value} /> : readable(value)}</dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
