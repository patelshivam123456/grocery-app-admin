'use client';

import { Bell, LogOut, Menu, Moon, Search, Sun, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { DummyUser } from '@/constants/auth';

export function Header({ onMenu, user, onLogout }: { onMenu: () => void; user: DummyUser; onLogout: () => void }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" className="h-10 w-10 p-0 lg:hidden" onClick={onMenu}><Menu className="h-5 w-5" /></Button>
        <label className="relative max-w-2xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2" placeholder="Search orders, products, customers" />
        </label>
        <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => setDark((value) => !value)}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
        <Button variant="ghost" className="relative h-10 w-10 p-0">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
        </Button>
        <div className="hidden min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 sm:flex">
          <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <Button variant="outline" className="h-10 w-10 p-0" onClick={onLogout} title="Logout"><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
