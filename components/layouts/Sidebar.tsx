'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { dashboardNav, modules, brandIcon } from '@/constants/modules';
import { canAccess, type DummyUser } from '@/constants/auth';
import { cn } from '@/utils/cn';

export function Sidebar({ collapsed, onToggle, user }: { collapsed: boolean; onToggle: () => void; user: DummyUser }) {
  const pathname = usePathname();
  const items = [dashboardNav, ...modules].filter((item) => canAccess(user.role, item.path));
  const BrandIcon = brandIcon;
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-card transition-all lg:block', collapsed ? 'w-20' : 'w-72')}>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <BrandIcon className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">FreshDrop</p>
              <p className="truncate text-xs text-muted-foreground">Ecommerce Admin</p>
            </div>
          ) : null}
        </Link>
        <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" onClick={onToggle}>
          <ChevronLeft className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
        </button>
      </div>
      <nav className="grid gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const href = `/${item.path}`;
          const active = pathname === href || pathname.startsWith(`${href}/`) || (pathname === '/' && item.path === 'dashboard');
          return (
            <Link key={item.path} href={href} className={cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground', active && 'bg-primary/10 text-primary')}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
