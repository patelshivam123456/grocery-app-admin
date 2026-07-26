'use client';

import { CheckCircle2, Clock3, MapPin, Navigation, PackageCheck, Route, Truck, UserRound } from 'lucide-react';
import type { AdminRecord, AdminValue } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/components/common/StatusChip';
import { readable } from '@/utils/format';

export type OrderTrackingPatch = Record<string, AdminValue>;
type TrackingAction = {
  label: string;
  patch: OrderTrackingPatch;
  danger?: boolean;
};

const steps = [
  { label: 'Order Placed', status: 'Placed' },
  { label: 'Payment Confirmed', paymentStatus: 'Paid' },
  { label: 'Processing', status: 'Processing' },
  { label: 'Packed', status: 'Packed' },
  { label: 'Ready for Pickup', status: 'Ready for Pickup' },
  { label: 'Assigned Rider', delivery: 'Assigned' },
  { label: 'Out for Delivery', status: 'Out for Delivery' },
  { label: 'Delivered', status: 'Delivered' },
  { label: 'Cancelled', status: 'Cancelled' },
  { label: 'Returned', status: 'Returned' },
];

export function OrderTracking({
  order,
  onAction,
}: {
  order: AdminRecord;
  onAction: (label: string, patch: OrderTrackingPatch, danger?: boolean) => void;
}) {
  const status = readable(order.status);
  const paymentStatus = readable(order.paymentStatus);
  const delivery = readable(order.delivery);
  const terminal = ['Delivered', 'Cancelled', 'Returned'].includes(status);
  const actions = getActions(status, paymentStatus, delivery, terminal);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Order Tracking</h2>
              <p className="mt-1 text-sm text-muted-foreground">Track fulfillment, rider assignment, ETA, and live delivery state.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip status={status} />
              <StatusChip status={delivery} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {steps.map((step, index) => {
                const complete = isStepComplete(step, order);
                const current = isCurrentStep(step, order);
                const skipped = ['Cancelled', 'Returned'].includes(step.label) && status !== step.label;
                return (
                  <div key={step.label} className={`rounded-md border p-3 ${complete ? 'border-primary bg-primary/10' : current ? 'border-accent bg-accent/10' : skipped ? 'border-border bg-muted/30 opacity-70' : 'border-border bg-card'}`}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Step {index + 1}</span>
                      {complete ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock3 className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{complete ? 'Completed' : current ? 'Current' : 'Pending'}</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <TrackingMeta icon={Route} label="Tracking Number" value={readable(order.trackingNumber)} />
              <TrackingMeta icon={UserRound} label="Rider" value={readable(order.rider)} />
              <TrackingMeta icon={Truck} label="Delivery Partner" value={readable(order.deliveryPartner)} />
              <TrackingMeta icon={Navigation} label="ETA" value={readable(order.eta)} />
              <TrackingMeta icon={MapPin} label="Live Location" value={readable(order.liveLocation)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h2 className="font-semibold">Tracking Actions</h2></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button key={action.label} variant={action.danger ? 'danger' : 'outline'} onClick={() => onAction(action.label, action.patch, action.danger)}>
                {action.label === 'Mark Delivered' ? <PackageCheck className="h-4 w-4" /> : null}
                {action.label}
              </Button>
            ))}
          </div>
          {terminal ? <p className="mt-3 text-sm text-muted-foreground">This order is in a terminal state. Only refund or return workflows remain available where applicable.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function TrackingMeta({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-card text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function isStepComplete(step: (typeof steps)[number], order: AdminRecord) {
  const status = readable(order.status);
  const paymentStatus = readable(order.paymentStatus);
  const delivery = readable(order.delivery);
  const statusOrder = ['Placed', 'Processing', 'Packed', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

  if (step.paymentStatus) return paymentStatus === step.paymentStatus;
  if (step.delivery) return delivery === step.delivery || ['In Transit', 'Delivered'].includes(delivery);
  if (step.status === 'Cancelled' || step.status === 'Returned') return status === step.status;
  if (!step.status) return false;
  return statusOrder.indexOf(status) >= statusOrder.indexOf(step.status);
}

function isCurrentStep(step: (typeof steps)[number], order: AdminRecord) {
  return readable(order.status) === step.status || readable(order.delivery) === step.delivery || readable(order.paymentStatus) === step.paymentStatus;
}

function getActions(status: string, paymentStatus: string, delivery: string, terminal: boolean): TrackingAction[] {
  if (status === 'Cancelled') return [{ label: 'Refund', patch: { paymentStatus: 'Refunded' }, danger: true }];
  if (status === 'Delivered') return [{ label: 'Return Order', patch: { status: 'Returned', delivery: 'Returned' }, danger: true }];
  if (status === 'Returned') return [{ label: 'Refund', patch: { paymentStatus: 'Refunded' }, danger: true }];
  if (terminal) return [];

  const actions: TrackingAction[] = [];
  if (paymentStatus !== 'Paid') actions.push({ label: 'Confirm Payment', patch: { paymentStatus: 'Paid', status: 'Processing' } });
  if (status === 'Placed' || status === 'Processing') actions.push({ label: 'Pack Order', patch: { status: 'Packed', delivery: 'Assigned' } });
  if (status === 'Packed') actions.push({ label: 'Ready for Pickup', patch: { status: 'Ready for Pickup', delivery: 'Assigned' } });
  if (delivery !== 'Assigned') actions.push({ label: 'Assign Rider', patch: { delivery: 'Assigned', rider: 'Karan Shah', eta: '25 min', liveLocation: 'Rider assigned - location pending' } });
  if (['Ready for Pickup', 'Packed'].includes(status) || delivery === 'Assigned') actions.push({ label: 'Out for Delivery', patch: { status: 'Out for Delivery', delivery: 'In Transit', eta: '18 min', liveLocation: 'Ahmedabad service zone - live placeholder' } });
  if (status === 'Out for Delivery') actions.push({ label: 'Mark Delivered', patch: { status: 'Delivered', delivery: 'Delivered', eta: 'Delivered', liveLocation: 'Delivered at customer address' } });
  actions.push({ label: 'Cancel Order', patch: { status: 'Cancelled', delivery: 'Cancelled' }, danger: true });
  return actions;
}
