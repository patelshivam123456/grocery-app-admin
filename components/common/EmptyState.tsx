import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        {actionLabel && onAction ? <Button className="mt-4" onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </div>
  );
}
