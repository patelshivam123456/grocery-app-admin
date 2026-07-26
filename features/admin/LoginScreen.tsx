'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { authenticate, dummyUsers, type DummyUser } from '@/constants/auth';

export function LoginScreen({ onLogin }: { onLogin: (user: DummyUser) => void }) {
  const [email, setEmail] = useState(dummyUsers[0].email);
  const [password, setPassword] = useState(dummyUsers[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      const user = authenticate(email, password);
      if (!user) {
        toast.error('Invalid email or password');
        setLoading(false);
        return;
      }
      toast.success(`Welcome, ${user.name}`);
      onLogin(user);
      setLoading(false);
    }, 350);
  };

  return (
    <main className="grid min-h-screen bg-background p-4 lg:grid-cols-[0.95fr_1.05fr] lg:p-0">
      <section className="hidden border-r border-border bg-card p-8 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold">FreshDrop</p>
            <p className="text-xs text-muted-foreground">Ecommerce Admin Panel</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase text-primary">Frontend mock access</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal">Manage catalog, orders, inventory and delivery from one clean workspace.</h1>
          <p className="mt-4 text-muted-foreground">This login is frontend-only and uses dummy credentials stored in the app constants.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {['Secure UI Gate', 'Mock State CRUD', 'Responsive Admin'].map((item) => (
            <div key={item} className="rounded-md border border-border bg-background p-3 font-semibold">{item}</div>
          ))}
        </div>
      </section>
      <section className="grid place-items-center">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center lg:hidden">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">FreshDrop Admin</h1>
          </div>
          <Card>
            <CardContent>
              <div className="mb-6">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Login</h2>
                <p className="mt-1 text-sm text-muted-foreground">Use any dummy credential below to access the admin panel.</p>
              </div>
              <form className="space-y-4" onSubmit={submit}>
                <label>
                  <span className="mb-1.5 block text-sm font-medium">Email</span>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" required />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium">Password</span>
                  <div className="relative">
                    <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none ring-ring focus:ring-2" required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <Button className="w-full" loading={loading}>Login</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3">
              <h3 className="text-sm font-semibold">Dummy Login Credentials</h3>
              {dummyUsers.map((user) => (
                <button
                  key={user.email}
                  className="w-full rounded-md border border-border p-3 text-left text-sm transition hover:bg-muted"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword(user.password);
                  }}
                >
                  <span className="block font-semibold">{user.role}</span>
                  <span className="block text-muted-foreground">{user.email} / {user.password}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
