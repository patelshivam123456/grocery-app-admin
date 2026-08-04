'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layouts/AppShell';
import { ReduxProvider } from '@/redux/Provider';
import { Dashboard } from '@/features/admin/Dashboard';
import { AccessDenied } from '@/features/admin/AccessDenied';
import { LoginScreen } from '@/features/admin/LoginScreen';
import { ModulePage } from '@/features/admin/ModulePage';
import { ProductModulePage } from '@/features/products/ProductModulePage';
import { moduleByPath } from '@/constants/modules';
import { authStorageKey, canAccess, type DummyUser } from '@/constants/auth';

export function AdminApp() {
  return (
    <ReduxProvider>
      <AdminRouter />
    </ReduxProvider>
  );
}

function AdminRouter() {
  const pathname = usePathname();
  const [user, setUser] = useState<DummyUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(authStorageKey);
    if (stored) setUser(JSON.parse(stored) as DummyUser);
    setReady(true);
  }, []);

  const login = (nextUser: DummyUser) => {
    window.localStorage.setItem(authStorageKey, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    window.localStorage.removeItem(authStorageKey);
    setUser(null);
  };

  if (!ready) return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading admin...</div>;
  if (!user) return <LoginScreen onLogin={login} />;

  const parts = pathname.split('/').filter(Boolean);
  const section = parts[0] ?? 'dashboard';
  const module = moduleByPath[section];
  const id = parts[1];
  const intent = parts[2];
  const mode = section === 'dashboard'
    ? 'dashboard'
    : module?.key === 'categories' && intent === 'sub-category'
      ? 'subCategory'
      : parts[1] === 'new'
        ? 'new'
        : intent === 'edit'
          ? 'edit'
          : intent === 'view' || id
            ? 'view'
            : 'list';
  const pageKey = module?.path ?? 'dashboard';
  const allowed = canAccess(user.role, pageKey);

  return (
    <AppShell user={user} onLogout={logout}>
      {!allowed ? <AccessDenied user={user} page={pageKey} /> : module?.key === 'products' ? <ProductModulePage parts={parts} /> : mode === 'dashboard' || !module ? <Dashboard /> : <ModulePage module={module} id={id} mode={mode} />}
    </AppShell>
  );
}
