'use client';

import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { DummyUser } from '@/constants/auth';

export function AccessDenied({ user, page }: { user: DummyUser; page: string }) {
  return (
    <Card>
      <CardContent className="grid min-h-96 place-items-center text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-destructive/10 text-destructive">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.role} does not have access to the {page || 'requested'} page.
          </p>
          <Button className="mt-5" onClick={() => { window.location.href = '/dashboard'; }}>Go to Dashboard</Button>
        </div>
      </CardContent>
    </Card>
  );
}
