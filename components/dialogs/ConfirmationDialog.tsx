'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type ConfirmationState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

export function ConfirmationDialog({ state, onClose }: { state: ConfirmationState; onClose: () => void }) {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-panel">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{state.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => { state.onConfirm(); onClose(); }}>
            {state.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
