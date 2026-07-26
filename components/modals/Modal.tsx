'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-border bg-card shadow-panel">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
