'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import type { AdminRecord, AdminValue, ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/tables/DataTable';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { Drawer } from '@/components/drawers/Drawer';
import { ConfirmationDialog, type ConfirmationState } from '@/components/dialogs/ConfirmationDialog';
import { OrderTracking, type OrderTrackingPatch } from '@/features/admin/OrderTracking';
import { RecordDetails } from '@/features/admin/RecordDetails';
import { StatusChip } from '@/components/common/StatusChip';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { changeStatus, createRecord, deleteRecords, duplicateRecord, setModuleRecords, updateRecord, upsertRecord } from '@/redux/adminSlice';
import { categoryApi, categoryPayload, subCategoryPayload } from '@/services/categoryApi';
import { readable, slugify } from '@/utils/format';

type Mode = 'list' | 'new' | 'view' | 'edit' | 'subCategory';
type FormValues = Record<string, AdminValue>;

export function ModulePage({ module, id, mode }: { module: ModuleConfig; id?: string; mode: Mode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const records = useAppSelector((state) => state.admin.records[module.key]);
  const [drawerRecord, setDrawerRecord] = useState<AdminRecord | null>(null);
  const [confirm, setConfirm] = useState<ConfirmationState>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => undefined });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRequested, setDetailRequested] = useState(false);
  const [pendingCreatedCategoryId, setPendingCreatedCategoryId] = useState<string | null>(null);
  const [pendingCreatedSubCategoryId, setPendingCreatedSubCategoryId] = useState<string | null>(null);
  const selected = useMemo(() => records.find((record) => record.id === id), [id, records]);
  const isCategory = module.key === 'categories';
  const subCategoryFormModule = useMemo((): ModuleConfig => ({
    ...module,
    singular: 'Sub Category',
    description: module.description,
    fields: [
      { name: 'subCategoryName', label: 'Sub Category Name', type: 'text' as const, section: 'Sub Category', required: true },
      { name: 'subCategoryDescription', label: 'Sub Category Description', type: 'textarea' as const, section: 'Sub Category', required: true },
      { name: 'subCategoryTags', label: 'Tags', type: 'multiselect' as const, section: 'Sub Category', options: ['fresh', 'new', 'restock', 'live'], required: true },
      { name: 'subCategoryIconUrl', label: 'Sub Category Icon', type: 'image' as const, section: 'Media', required: true },
    ],
  }), [module]);

  const goList = () => router.push(`/${module.path}`);
  const toRecord = (record: AdminRecord, nextMode: Mode) => router.push(`/${module.path}/${record.id}/${nextMode}`);

  const loadCategories = useCallback(async () => {
    if (!isCategory) return;
    setListLoading(true);
    setListError(null);
    try {
      dispatch(setModuleRecords({ module: 'categories', records: await categoryApi.list() }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load categories';
      setListError(message);
      toast.error(message);
    } finally {
      setListLoading(false);
    }
  }, [dispatch, isCategory]);

  const loadCategoryDetail = useCallback(async (categoryPublicId: string) => {
    const record = await categoryApi.get(categoryPublicId);
    dispatch(upsertRecord({ module: 'categories', record }));
    return record;
  }, [dispatch]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!isCategory || !id || (mode !== 'view' && mode !== 'edit' && mode !== 'subCategory')) return;
    setDetailRequested(false);
    setDetailLoading(true);
    loadCategoryDetail(id)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load category'))
      .finally(() => {
        setDetailRequested(true);
        setDetailLoading(false);
      });
  }, [id, isCategory, loadCategoryDetail, mode]);

  const save = async (values: FormValues) => {
    if (isCategory) {
      try {
        const categoryPublicId = mode === 'edit' ? String(selected?.categoryPublicId ?? selected?.id ?? '') : undefined;
        if (mode === 'new') {
          const parentPayload = categoryPayload({ ...values, categoryIconUrl: '' });
          const createdCategory = pendingCreatedCategoryId ? null : await categoryApi.create(parentPayload);
          const createdCategoryId = pendingCreatedCategoryId ?? String(createdCategory?.categoryPublicId ?? createdCategory?.id ?? '');

          if (!createdCategoryId) throw new Error('Category created, but no category public ID was returned.');

          setPendingCreatedCategoryId(createdCategoryId);
          await categoryApi.uploadIcon(String(values.categoryIconUrl ?? ''), createdCategoryId, false);
          toast.success(`${module.singular} created`);
          setPendingCreatedCategoryId(null);
          await loadCategories();
          return true;
        }

        if (mode === 'subCategory') {
          const parentCategoryPublicId = String(id ?? '');
          const createdSubCategory = pendingCreatedSubCategoryId ? null : await categoryApi.createSubCategory(subCategoryPayload(values, parentCategoryPublicId));
          const createdSubCategoryId = pendingCreatedSubCategoryId ?? String(createdSubCategory?.categoryPublicId ?? createdSubCategory?.id ?? '');

          if (!createdSubCategoryId) throw new Error('Sub Category created, but no category public ID was returned.');

          setPendingCreatedSubCategoryId(createdSubCategoryId);
          await categoryApi.uploadIcon(String(values.subCategoryIconUrl ?? ''), createdSubCategoryId, false);
          toast.success('Sub Category created');
          setPendingCreatedSubCategoryId(null);
          await loadCategories();
          return true;
        }

        const categoryIconUrl = await categoryApi.uploadIcon(String(values.categoryIconUrl ?? ''), categoryPublicId);
        const payload = categoryPayload({ ...values, categoryIconUrl }, categoryPublicId);
        const record = await categoryApi.update(categoryPublicId ?? '', payload);
        dispatch(updateRecord({ module: 'categories', record }));
        toast.success(`${module.singular} updated`);
        await loadCategories();
        router.push(`/${module.path}/${categoryPublicId}/view`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Unable to save ${module.singular.toLowerCase()}`);
      }
      return;
    }

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
      if (isCategory) {
        void Promise.all(ids.map((categoryId) => categoryApi.remove(categoryId)))
          .then(async () => {
            dispatch(deleteRecords({ module: module.key, ids }));
            toast.success('Deleted successfully');
            await loadCategories();
            if (id && ids.includes(id)) goList();
          })
          .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to delete category'));
        return;
      }
      dispatch(deleteRecords({ module: module.key, ids }));
      toast.success('Deleted successfully');
      if (id && ids.includes(id)) goList();
    },
  });

  const askSubCategoryDelete = (subCategoryId: string) => setConfirm({
    open: true,
    title: 'Delete this sub category?',
    message: 'Delete this sub category?',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: async () => {
      await categoryApi.remove(subCategoryId);
      toast.success('Sub Category deleted successfully');
      await loadCategories();
      if (id) await loadCategoryDetail(id);
    },
  });

  const askStatus = (ids: string[], status: string) => setConfirm({
    open: true,
    title: 'Change status?',
    message: `Selected record(s) will be changed to ${status}.`,
    confirmLabel: 'Change status',
    onConfirm: () => {
      if (isCategory) {
        void Promise.all(ids.map(async (categoryId) => {
          const current = records.find((record) => record.id === categoryId) ?? await categoryApi.get(categoryId);
          const payload = categoryPayload({ ...current, status }, categoryId);
          return categoryApi.update(categoryId, payload);
        }))
          .then(async () => {
            toast.success('Status changed');
            await loadCategories();
          })
          .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to change status'));
        return;
      }
      dispatch(changeStatus({ module: module.key, ids, status }));
      toast.success('Status changed');
    },
  });

  const askArchive = (ids: string[]) => setConfirm({
    open: true,
    title: 'Archive record?',
    message: isCategory ? 'Selected category record(s) will be changed to Inactive.' : 'Archived records remain in mock state with archived status.',
    confirmLabel: 'Archive',
    onConfirm: () => {
      if (isCategory) {
        void Promise.all(ids.map(async (categoryId) => {
          const current = records.find((record) => record.id === categoryId) ?? await categoryApi.get(categoryId);
          const payload = categoryPayload({ ...current, status: 'Inactive' }, categoryId);
          return categoryApi.update(categoryId, payload);
        }))
          .then(async () => {
            toast.success('Archived successfully');
            await loadCategories();
          })
          .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to archive category'));
        return;
      }
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

  if (mode === 'subCategory') {
    if (isCategory && !selected && (!detailRequested || detailLoading || listLoading)) {
      return <Card><CardContent className="text-center"><p className="font-semibold">Loading category...</p></CardContent></Card>;
    }
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
        <PageTitle title="Add Sub Category" description={module.description} back={goList} />
        <DynamicForm module={subCategoryFormModule} onSubmit={save} onCancel={goList} />
      </div>
    );
  }

  if (mode === 'new' || mode === 'edit') {
    if (isCategory && mode === 'edit' && !selected && (!detailRequested || detailLoading || listLoading)) {
      return <Card><CardContent className="text-center"><p className="font-semibold">Loading category...</p></CardContent></Card>;
    }
    return (
      <div className="space-y-5">
        <PageTitle title={`${mode === 'new' ? 'Add' : 'Edit'} ${module.singular}`} description={module.description} back={goList} />
        <DynamicForm module={module} record={selected} onSubmit={save} onCancel={goList} />
      </div>
    );
  }

  if (mode === 'view') {
    if (isCategory && !selected && (!detailRequested || detailLoading || listLoading)) {
      return <Card><CardContent className="text-center"><p className="font-semibold">Loading category...</p></CardContent></Card>;
    }
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
        {isCategory ? (
          <SubCategoryTable
            subCategories={subCategoriesOf(selected)}
            onView={(subCategory) => router.push(`/${module.path}/${subCategory.id}/view`)}
            onEdit={(subCategory) => router.push(`/${module.path}/${subCategory.id}/edit`)}
            onDelete={(subCategory) => askSubCategoryDelete(subCategory.id)}
          />
        ) : null}
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
        onView={(record) => isCategory ? toRecord(record, 'view') : setDrawerRecord(record)}
        onEdit={(record) => toRecord(record, 'edit')}
        onDelete={askDelete}
        onDuplicate={(record) => { dispatch(duplicateRecord({ module: module.key, id: record.id })); toast.success('Product duplicated'); }}
        onArchive={askArchive}
        onStatus={askStatus}
        onAdd={() => router.push(`/${module.path}/new`)}
        onAddSubCategory={isCategory ? (record) => router.push(`/${module.path}/${record.id}/sub-category`) : undefined}
        onRetry={isCategory ? loadCategories : undefined}
        loading={isCategory ? listLoading : false}
        error={isCategory ? listError : null}
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

function SubCategoryTable({
  subCategories,
  onView,
  onEdit,
  onDelete,
}: {
  subCategories: AdminRecord[];
  onView: (record: AdminRecord) => void;
  onEdit: (record: AdminRecord) => void;
  onDelete: (record: AdminRecord) => void;
}) {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Sub Categories</h3>
          <span className="text-sm text-muted-foreground">{subCategories.length} item{subCategories.length === 1 ? '' : 's'}</span>
        </div>
        {subCategories.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Icon</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Tags</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subCategories.map((subCategory) => (
                  <tr key={subCategory.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-3 py-3">
                      {typeof subCategory.categoryIconUrl === 'string' && subCategory.categoryIconUrl ? <img src={subCategory.categoryIconUrl} alt="" className="h-10 w-10 rounded-md object-cover" /> : '-'}
                    </td>
                    <td className="px-3 py-3 font-medium">{readable(subCategory.categoryName as never)}</td>
                    <td className="px-3 py-3"><span className="line-clamp-2">{readable(subCategory.categoryDescription as never)}</span></td>
                    <td className="px-3 py-3">{readable(subCategory.tags as never)}</td>
                    <td className="px-3 py-3"><StatusChip status={String(subCategory.status ?? 'Active')} /></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="h-8 w-8 p-0" title="View" onClick={() => onView(subCategory)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" className="h-8 w-8 p-0" title="Edit" onClick={() => onEdit(subCategory)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Delete" onClick={() => onDelete(subCategory)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">No sub categories found</p>}
      </CardContent>
    </Card>
  );
}

function subCategoriesOf(record: AdminRecord): AdminRecord[] {
  const subCategoryDtoList = record.subCategoryDtoList as unknown;
  return Array.isArray(subCategoryDtoList) ? subCategoryDtoList.filter(isAdminRecord) : [];
}

function isAdminRecord(value: unknown): value is AdminRecord {
  return Boolean(value && typeof value === 'object' && 'id' in value);
}
