'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/45">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-panel">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
