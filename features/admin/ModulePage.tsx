'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import type { AdminRecord, AdminValue, ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/tables/DataTable';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { Drawer } from '@/components/drawers/Drawer';
import { ConfirmationDialog, type ConfirmationState } from '@/components/dialogs/ConfirmationDialog';
import { OrderTracking, type OrderTrackingPatch } from '@/features/admin/OrderTracking';
import { RecordDetails } from '@/features/admin/RecordDetails';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { changeStatus, createRecord, deleteRecords, duplicateRecord, updateRecord } from '@/redux/adminSlice';
import { slugify } from '@/utils/format';

type Mode = 'list' | 'new' | 'view' | 'edit';
type FormValues = Record<string, AdminValue>;

export function ModulePage({ module, id, mode }: { module: ModuleConfig; id?: string; mode: Mode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const records = useAppSelector((state) => state.admin.records[module.key]);
  const [drawerRecord, setDrawerRecord] = useState<AdminRecord | null>(null);
  const [confirm, setConfirm] = useState<ConfirmationState>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => undefined });
  const selected = useMemo(() => records.find((record) => record.id === id), [id, records]);

  const goList = () => router.push(`/${module.path}`);
  const toRecord = (record: AdminRecord, nextMode: Mode) => router.push(`/${module.path}/${record.id}/${nextMode}`);

  const save = (values: FormValues) => {
    const date = new Date().toISOString().slice(0, 10);
    if (mode === 'new') {
      const record: AdminRecord = {
        id: `${module.key}-${Date.now()}`,
        createdAt: date,
        updatedAt: date,
        ...values,
      };
      if ('slug' in record && typeof record.slug === 'string' && !record.slug && typeof record.productName === 'string') record.slug = slugify(record.productName);
      dispatch(createRecord({ module: module.key, record }));
      toast.success(`${module.singular} created`);
      router.push(`/${module.path}/${record.id}/view`);
      return;
    }
    if (!selected) return;
    dispatch(updateRecord({ module: module.key, record: { ...selected, ...values, updatedAt: date } }));
    toast.success(`${module.singular} updated`);
    router.push(`/${module.path}/${selected.id}/view`);
  };

  const askDelete = (ids: string[]) => setConfirm({
    open: true,
    title: ids.length > 1 ? 'Delete selected records?' : `Delete this ${module.singular.toLowerCase()}?`,
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      dispatch(deleteRecords({ module: module.key, ids }));
      toast.success('Deleted successfully');
      if (id && ids.includes(id)) goList();
    },
  });

  const askStatus = (ids: string[], status: string) => setConfirm({
    open: true,
    title: 'Change status?',
    message: `Selected record(s) will be changed to ${status}.`,
    confirmLabel: 'Change status',
    onConfirm: () => {
      dispatch(changeStatus({ module: module.key, ids, status }));
      toast.success('Status changed');
    },
  });

  const askArchive = (ids: string[]) => setConfirm({
    open: true,
    title: 'Archive record?',
    message: 'Archived records remain in mock state with archived status.',
    confirmLabel: 'Archive',
    onConfirm: () => {
      dispatch(changeStatus({ module: module.key, ids, status: module.statuses.includes('Archived') ? 'Archived' : 'Inactive' }));
      toast.success('Archived successfully');
    },
  });

  const askWorkflow = (label: string, status: string) => selected && setConfirm({
    open: true,
    title: `${label} ${module.singular.toLowerCase()}?`,
    message: 'This workflow action will update frontend state only.',
    confirmLabel: label,
    danger: ['Cancel', 'Refund', 'Reject'].includes(label),
    onConfirm: () => {
      dispatch(changeStatus({ module: module.key, ids: [selected.id], status }));
      toast.success(`${label} completed`);
    },
  });

  const askOrderTracking = (label: string, patch: OrderTrackingPatch, danger?: boolean) => selected && setConfirm({
    open: true,
    title: `${label}?`,
    message: 'This order tracking action will update frontend state and mock data only.',
    confirmLabel: label,
    danger,
    onConfirm: () => {
      dispatch(updateRecord({ module: 'orders', record: { ...selected, ...patch } }));
      toast.success(`${label} completed`);
    },
  });

  if (mode === 'new' || mode === 'edit') {
    return (
      <div className="space-y-5">
        <PageTitle title={`${mode === 'new' ? 'Add' : 'Edit'} ${module.singular}`} description={module.description} back={goList} />
        <DynamicForm module={module} record={selected} onSubmit={save} onCancel={goList} />
      </div>
    );
  }

  if (mode === 'view') {
    if (!selected) {
      return (
        <Card>
          <CardContent className="text-center">
            <p className="font-semibold">Record not found</p>
            <Button className="mt-4" onClick={goList}>Back to {module.label}</Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-5">
        <PageTitle title={`View ${module.singular}`} description={module.description} back={goList}>
          <Button variant="outline" onClick={() => router.push(`/${module.path}/${selected.id}/edit`)}><Edit className="h-4 w-4" /> Edit</Button>
          {module.key === 'orders' ? (
            <>
              <Button variant="outline" onClick={() => askWorkflow('Cancel', 'Cancelled')}>Cancel</Button>
              <Button variant="outline" onClick={() => askWorkflow('Refund', 'Refunded')}>Refund</Button>
              <Button onClick={() => askWorkflow('Pack', 'Packed')}>Pack</Button>
            </>
          ) : null}
          {module.key === 'inventory' ? <Button onClick={() => askWorkflow('Transfer', 'Healthy')}>Transfer Stock</Button> : null}
        </PageTitle>
        <RecordDetails module={module} record={selected} />
        {module.key === 'orders' ? <OrderTracking order={selected} onAction={askOrderTracking} /> : null}
        <ConfirmationDialog state={confirm} onClose={() => setConfirm((current) => ({ ...current, open: false }))} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle title={module.label} description={module.description}>
        <Button onClick={() => router.push(`/${module.path}/new`)}><Plus className="h-4 w-4" /> Add {module.singular}</Button>
      </PageTitle>
      <DataTable
        module={module}
        data={records}
        onView={(record) => setDrawerRecord(record)}
        onEdit={(record) => toRecord(record, 'edit')}
        onDelete={askDelete}
        onDuplicate={(record) => { dispatch(duplicateRecord({ module: module.key, id: record.id })); toast.success('Product duplicated'); }}
        onArchive={askArchive}
        onStatus={askStatus}
        onAdd={() => router.push(`/${module.path}/new`)}
      />
      <Drawer open={Boolean(drawerRecord)} title={drawerRecord ? `${module.singular} Details` : ''} onClose={() => setDrawerRecord(null)}>
        {drawerRecord ? (
          <div className="space-y-4">
            <RecordDetails module={module} record={drawerRecord} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => toRecord(drawerRecord, 'view')}>Full View</Button>
              <Button onClick={() => toRecord(drawerRecord, 'edit')}>Edit</Button>
            </div>
          </div>
        ) : null}
      </Drawer>
      <ConfirmationDialog state={confirm} onClose={() => setConfirm((current) => ({ ...current, open: false }))} />
    </div>
  );
}

function PageTitle({ title, description, back, children }: { title: string; description: string; back?: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          {back ? <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</button> : <span>Admin</span>}
          <span>/</span>
          <span>{title}</span>
        </div>
        <h1 className="truncate text-2xl font-bold tracking-normal">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
