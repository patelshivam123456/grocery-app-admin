'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { dashboardNav, modules, brandIcon } from '@/constants/modules';
import { canAccess, type DummyUser } from '@/constants/auth';
import { cn } from '@/utils/cn';

export function AppShell({ children, user, onLogout }: { children: React.ReactNode; user: DummyUser; onLogout: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const items = [dashboardNav, ...modules].filter((item) => canAccess(user.role, item.path));
  const BrandIcon = brandIcon;
  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} user={user} />
      {mobile ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden">
          <aside className="h-full w-80 border-r border-border bg-card">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground"><BrandIcon className="h-5 w-5" /></div>
                <span className="font-bold">FreshDrop Admin</span>
              </div>
              <button onClick={() => setMobile(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="grid gap-1 p-3">
              {items.map((item) => {
                const Icon = item.icon;
                return <a key={item.path} href={`/${item.path}`} onClick={() => setMobile(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold hover:bg-muted"><Icon className="h-4 w-4" />{item.label}</a>;
              })}
            </nav>
          </aside>
        </div>
      ) : null}
      <div className={cn('transition-all lg:pl-72', collapsed && 'lg:pl-20')}>
        <Header onMenu={() => setMobile(true)} user={user} onLogout={onLogout} />
        <main className="px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
