'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

export function Button({
  className,
  variant = 'primary',
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; children: ReactNode }) {
  const variants: Record<Variant, string> = {
    primary: 'bg-primary text-primary-foreground hover:brightness-95',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-muted text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:brightness-95',
    outline: 'border border-border bg-card hover:bg-muted',
  };
  return (
    <button
      className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-55', variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
