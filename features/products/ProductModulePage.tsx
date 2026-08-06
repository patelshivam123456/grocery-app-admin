'use client';

import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, ChevronDown, ChevronRight, Edit, Eye, Plus, Save, Trash2 } from 'lucide-react';
import type { AdminRecord, ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/tables/DataTable';
import { ConfirmationDialog, type ConfirmationState } from '@/components/dialogs/ConfirmationDialog';
import { ImageUpload } from '@/components/forms/ImageUpload';
import { StatusChip } from '@/components/common/StatusChip';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { deleteRecords, setModuleRecords } from '@/redux/adminSlice';
import { productApi, extractVariantPublicIds, type CategoryNode, type ProductBatchPayload, type ProductPayload, type ProductVariantPayload } from '@/services/productApi';
import { moduleByKey } from '@/constants/modules';
import { readable, slugify } from '@/utils/format';

type ProductRouteMode = 'list' | 'add' | 'edit' | 'view' | 'variants' | 'addVariant' | 'editVariant' | 'viewVariant' | 'batches' | 'addBatch' | 'editBatch' | 'viewBatch';

type ProductFormState = Omit<ProductPayload, 'additionalDetails' | 'categoryPublicIdList' | 'productVariantList'> & {
  additionalDetailsRows: KeyValueRow[];
  categoryPublicIdList: string[];
  productVariantList: VariantFormState[];
};

type VariantFormState = Omit<ProductVariantPayload, 'batchList'> & {
  images: File[];
  imagePreviews: string[];
  batchList: BatchFormState[];
};

type BatchFormState = ProductBatchPayload & { open: boolean; temporaryUuid: string };
type KeyValueRow = { id: string; keyName: string; value: string };
type ProductListFilter = 'all' | 'active' | 'deleted';
type ProductHeaderContext = { productName: string; variantName?: string };

const textInput = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-55';
const areaInput = `${textInput} min-h-28 py-2`;
const measuringUnits = ['kg', 'gm', 'litre', 'ml'];

const variantModule: ModuleConfig = {
  key: 'products',
  label: 'Product Variants',
  singular: 'Variant',
  path: 'products',
  icon: moduleByKey.products.icon,
  description: 'Manage product variants, inventory, imagery, and batches.',
  fields: [
    { name: 'variantName', label: 'Variant Name', type: 'text' },
    { name: 'mrp', label: 'MRP', type: 'number' },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number' },
    { name: 'stockQuantity', label: 'Stock', type: 'number' },
    { name: 'measuringUnit', label: 'Unit', type: 'text' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'status', label: 'Status', type: 'text' },
  ],
  table: ['variantName', 'mrp', 'sellingPrice', 'stockQuantity', 'measuringUnit', 'amount', 'status'],
  statuses: ['Active', 'Inactive', 'Archived'],
  filters: ['status'],
};

const batchModule: ModuleConfig = {
  key: 'products',
  label: 'Product Batches',
  singular: 'Batch',
  path: 'products',
  icon: moduleByKey.products.icon,
  description: 'Manage batch inventory, pricing, supplier, and expiry details.',
  fields: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'batchNumber', label: 'Batch Number', type: 'text' },
    { name: 'lotNumber', label: 'Lot Number', type: 'text' },
    { name: 'supplierName', label: 'Supplier', type: 'text' },
    { name: 'manufacturingDate', label: 'MFG Date', type: 'date' },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { name: 'availableQuantity', label: 'Available Qty', type: 'number' },
    { name: 'mrp', label: 'MRP', type: 'number' },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number' },
    { name: 'status', label: 'Status', type: 'text' },
  ],
  table: ['name', 'batchNumber', 'lotNumber', 'supplierName', 'manufacturingDate', 'expiryDate', 'availableQuantity', 'mrp', 'sellingPrice', 'status'],
  statuses: ['Active', 'Inactive', 'Archived'],
  filters: ['status'],
};

export function ProductModulePage({ parts }: { parts: string[] }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const records = useAppSelector((state) => state.admin.records.products);
  const route = parseProductRoute(parts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [productFilter, setProductFilter] = useState<ProductListFilter>('all');
  const [categoryPublicId, setCategoryPublicId] = useState('');
  const [confirm, setConfirm] = useState<ConfirmationState>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => undefined });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      dispatch(setModuleRecords({ module: 'products', records: await productApi.list({ filter: productFilter, categoryPublicId }) }));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load products';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [categoryPublicId, dispatch, productFilter]);

  useEffect(() => {
    if (route.mode === 'list') void loadProducts();
  }, [loadProducts, route.mode]);

  useEffect(() => {
    if (route.mode !== 'list') return;
    productApi.categories()
      .then(setCategories)
      .catch((categoryError) => toast.error(categoryError instanceof Error ? categoryError.message : 'Unable to load categories'));
  }, [route.mode]);

  const askDelete = (ids: string[]) => setConfirm({
    open: true,
    title: ids.length > 1 ? 'Delete selected products?' : 'Delete this product?',
    message: ids.length > 1 ? 'Delete selected products?' : 'Delete this product?',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      return Promise.all(ids.map((productId) => productApi.remove(productId)))
        .then(async () => {
          dispatch(deleteRecords({ module: 'products', ids }));
          toast.success('Deleted successfully');
          await loadProducts();
        });
    },
  });

  if (route.mode === 'add' || route.mode === 'edit') {
    return <ProductFormPage productPublicId={route.productPublicId} mode={route.mode} />;
  }

  if (route.mode === 'view' && route.productPublicId) {
    return <ProductViewPage productPublicId={route.productPublicId} />;
  }

  if (route.mode === 'variants' && route.productPublicId) {
    return <VariantListPage productPublicId={route.productPublicId} />;
  }

  if ((route.mode === 'addVariant' || route.mode === 'editVariant') && route.productPublicId) {
    return <VariantFormPage productPublicId={route.productPublicId} variantPublicId={route.variantPublicId} mode={route.mode} />;
  }

  if (route.mode === 'viewVariant' && route.productPublicId && route.variantPublicId) {
    return <VariantViewPage productPublicId={route.productPublicId} variantPublicId={route.variantPublicId} />;
  }

  if (route.mode === 'batches' && route.productPublicId && route.variantPublicId) {
    return <BatchListPage productPublicId={route.productPublicId} variantPublicId={route.variantPublicId} />;
  }

  if ((route.mode === 'addBatch' || route.mode === 'editBatch') && route.productPublicId && route.variantPublicId) {
    return <BatchFormPage productPublicId={route.productPublicId} variantPublicId={route.variantPublicId} batchPublicId={route.batchPublicId} mode={route.mode} />;
  }

  if (route.mode === 'viewBatch' && route.productPublicId && route.variantPublicId && route.batchPublicId) {
    return <BatchViewPage productPublicId={route.productPublicId} variantPublicId={route.variantPublicId} batchPublicId={route.batchPublicId} />;
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Products" description={moduleByKey.products.description}>
        <Button onClick={() => router.push('/products/add')}><Plus className="h-4 w-4" /> Add Product</Button>
      </PageTitle>
      <ProductListFilters
        categories={categories}
        filter={productFilter}
        categoryPublicId={categoryPublicId}
        onFilterChange={setProductFilter}
        onCategoryChange={setCategoryPublicId}
      />
      <DataTable
        module={moduleByKey.products}
        data={records}
        onView={(record) => router.push(`/products/view/${record.id}`)}
        onEdit={(record) => router.push(`/products/edit/${record.id}`)}
        onDelete={askDelete}
        onDuplicate={() => undefined}
        onArchive={askDelete}
        onStatus={() => undefined}
        onAdd={() => router.push('/products/add')}
        onVariants={(record) => router.push(`/products/${record.id}/variants`)}
        onRetry={loadProducts}
        loading={loading}
        error={error}
      />
      <ConfirmationDialog state={confirm} onClose={() => setConfirm((current) => ({ ...current, open: false }))} />
    </div>
  );
}

function ProductFormPage({ productPublicId, mode }: { productPublicId?: string; mode: 'add' | 'edit' }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [form, setForm] = useState<ProductFormState>(() => emptyProduct());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    productApi.categories()
      .then(setCategories)
      .catch((categoryError) => toast.error(categoryError instanceof Error ? categoryError.message : 'Unable to load categories'));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !productPublicId) return;
    setLoading(true);
    productApi.get(productPublicId)
      .then((record) => setForm(productFromApi(record)))
      .catch((loadError) => toast.error(loadError instanceof Error ? loadError.message : 'Unable to load product'))
      .finally(() => setLoading(false));
  }, [mode, productPublicId]);

  const setField = (name: keyof ProductFormState, value: string | boolean | string[] | VariantFormState[]) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async () => {
    const validation = validateProduct(form);
    if (validation) {
      toast.error(validation);
      return;
    }

    setSaving(true);
    try {
      const payload = productPayload(form, productPublicId);
      const response = mode === 'edit' && productPublicId ? await productApi.update(productPublicId, payload) : await productApi.create(payload);
      const variantIds = extractVariantPublicIds(response);
      const uploads = form.productVariantList
        .map((variant, index) => ({ variant, productVariantPublicId: variant.productVariantPublicId?.startsWith('local-') ? variantIds[index] : variant.productVariantPublicId || variantIds[index] }))
        .filter((item) => item.productVariantPublicId && item.variant.images.length)
        .map((item) => productApi.uploadVariantImages(String(item.productVariantPublicId), item.variant.images));
      let uploadFailed = false;
      try {
        await Promise.all(uploads);
      } catch (uploadError) {
        uploadFailed = true;
        toast.error(uploadError instanceof Error ? uploadError.message : `${mode === 'edit' ? 'Product updated' : 'Product created'}, but image upload failed`);
      }
      const nextProducts = await productApi.list();
      dispatch(setModuleRecords({ module: 'products', records: nextProducts }));
      if (!uploadFailed) toast.success(mode === 'edit' ? 'Product Updated Successfully' : 'Product Created Successfully');
      router.push('/products');
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingCard label="Loading product..." />;

  return (
    <div className="space-y-5">
      <PageTitle title={mode === 'edit' ? 'Edit Product' : 'Add Product'} description={moduleByKey.products.description} back={() => router.push('/products')} />
      <ProductFields form={form} categories={categories} onChange={setField} onFormChange={setForm} />
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={() => router.push('/products')}>Cancel</Button>
        <Button type="button" loading={saving} onClick={save}><Save className="h-4 w-4" /> Save Product</Button>
      </div>
    </div>
  );
}

function ProductFields({
  form,
  categories,
  onChange,
  onFormChange,
}: {
  form: ProductFormState;
  categories: CategoryNode[];
  onChange: (name: keyof ProductFormState, value: string | boolean | string[] | VariantFormState[]) => void;
  onFormChange: Dispatch<SetStateAction<ProductFormState>>;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <SectionTitle title="General Information" />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Product Name" required value={form.name} onChange={(value) => onFormChange((current) => ({ ...current, name: value, slug: current.slug || slugify(value) }))} />
            <TextField label="Slug" required value={form.slug} onChange={(value) => onChange('slug', value)} />
            <TextField label="Brand" value={form.brand} onChange={(value) => onChange('brand', value)} />
            <TextField label="SKU" value={form.sku} onChange={(value) => onChange('sku', value)} />
            <TextField label="HSN Code" value={form.hsnCode} onChange={(value) => onChange('hsnCode', value)} />
            <TextField label="Barcode" value={form.barcode} onChange={(value) => onChange('barcode', value)} />
            <TextField label="Tags" value={form.tags} onChange={(value) => onChange('tags', value)} />
            <TextField label="Shop Branch Code" value={form.shopBranchCode} onChange={(value) => onChange('shopBranchCode', value)} />
            <TextField label="Meta Title" value={form.metaTitle} onChange={(value) => onChange('metaTitle', value)} />
            <TextField label="Meta Description" value={form.metaDescription} onChange={(value) => onChange('metaDescription', value)} />
            <TextField label="Short Description" textarea value={form.shortDescription} onChange={(value) => onChange('shortDescription', value)} />
            <TextField label="Description" textarea value={form.description} onChange={(value) => onChange('description', value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <SectionTitle title="Categories" />
          <CategoryCascade categories={categories} value={form.categoryPublicIdList} onChange={(value) => onChange('categoryPublicIdList', value)} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <SectionTitle title="Additional Details" action={<Button type="button" variant="outline" onClick={() => onFormChange((current) => ({ ...current, additionalDetailsRows: [...current.additionalDetailsRows, emptyKeyValue()] }))}><Plus className="h-4 w-4" /> Add Row</Button>} />
          <div className="space-y-3">
            {form.additionalDetailsRows.map((row) => (
              <div key={row.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input className={textInput} placeholder="Key" value={row.keyName} onChange={(event) => updateAdditional(onFormChange, row.id, 'keyName', event.target.value)} />
                <input className={textInput} placeholder="Value" value={row.value} onChange={(event) => updateAdditional(onFormChange, row.id, 'value', event.target.value)} />
                <Button type="button" variant="ghost" className="h-10 w-10 p-0 text-destructive" onClick={() => onFormChange((current) => ({ ...current, additionalDetailsRows: current.additionalDetailsRows.filter((item) => item.id !== row.id) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <SectionTitle title="Variant Settings" />
          <div className="flex flex-wrap gap-4">
            <SwitchField label="Has Variant" checked={form.hasVariant} onChange={(value) => onChange('hasVariant', value)} />
            <SwitchField label="Has Batch" checked={form.hasBatch} onChange={(value) => onChange('hasBatch', value)} />
          </div>
        </CardContent>
      </Card>
      {form.hasVariant ? <VariantsEditor hasBatch={form.hasBatch} variants={form.productVariantList} onChange={(value) => onChange('productVariantList', value)} /> : null}
    </div>
  );
}

function ProductListFilters({
  categories,
  filter,
  categoryPublicId,
  onFilterChange,
  onCategoryChange,
}: {
  categories: CategoryNode[];
  filter: ProductListFilter;
  categoryPublicId: string;
  onFilterChange: (value: ProductListFilter) => void;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
        <select className={textInput} value={filter} onChange={(event) => onFilterChange(event.target.value as ProductListFilter)}>
          <option value="all">All Products</option>
          <option value="active">Active Products</option>
          <option value="deleted">Deleted Products</option>
        </select>
        <select className={textInput} value={categoryPublicId} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.categoryPublicId} value={category.categoryPublicId}>{category.categoryName}</option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={() => {
          onFilterChange('all');
          onCategoryChange('');
        }}>
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}

function VariantsEditor({ variants, hasBatch, onChange }: { variants: VariantFormState[]; hasBatch: boolean; onChange: (value: VariantFormState[]) => void }) {
  const update = (id: string, patch: Partial<VariantFormState>) => onChange(variants.map((variant) => (variant.productVariantPublicId === id ? { ...variant, ...patch } : variant)));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Variants</h2>
        <Button type="button" variant="outline" onClick={() => onChange([...variants, emptyVariant()])}><Plus className="h-4 w-4" /> Add Variant</Button>
      </div>
      {variants.map((variant, index) => (
        <Card key={variant.productVariantPublicId}>
          <CardContent className="space-y-4">
            <SectionTitle title={`Variant ${index + 1}`} action={<Button type="button" variant="ghost" className="text-destructive" onClick={() => onChange(variants.filter((item) => item.productVariantPublicId !== variant.productVariantPublicId))}><Trash2 className="h-4 w-4" /> Delete</Button>} />
            <VariantFields variant={variant} onChange={(patch) => update(String(variant.productVariantPublicId), patch)} />
            <VariantImages variant={variant} onChange={(patch) => update(String(variant.productVariantPublicId), patch)} />
            {hasBatch ? <BatchesEditor batches={variant.batchList} onChange={(batchList) => update(String(variant.productVariantPublicId), { batchList })} /> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VariantFormPage({ productPublicId, variantPublicId, mode }: { productPublicId: string; variantPublicId?: string; mode: 'addVariant' | 'editVariant' }) {
  const router = useRouter();
  const [variant, setVariant] = useState<VariantFormState>(() => emptyVariant());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'editVariant');
  const headerContext = useProductHeaderContext(productPublicId);

  useEffect(() => {
    if (mode !== 'editVariant' || !variantPublicId) return;
    setLoading(true);
    productApi.getVariant(productPublicId, variantPublicId)
      .then((record) => setVariant(variantFromApi(record)))
      .catch((loadError) => toast.error(loadError instanceof Error ? loadError.message : 'Unable to load variant'))
      .finally(() => setLoading(false));
  }, [mode, productPublicId, variantPublicId]);

  const save = async () => {
    const validation = validateVariant(variant);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const payload = variantPayload(variant);
      const response = mode === 'editVariant' && variantPublicId
        ? await productApi.updateVariant(productPublicId, variantPublicId, payload)
        : await productApi.createVariant(productPublicId, payload);
      const [createdId] = extractVariantPublicIds(response);
      const uploadId = variantPublicId || createdId || String((response as Record<string, unknown>)?.productVariantPublicId ?? '');
      if (uploadId && variant.images.length) {
        try {
          await productApi.uploadVariantImages(uploadId, variant.images);
        } catch (uploadError) {
          if (mode === 'editVariant') {
            toast.error(uploadError instanceof Error ? uploadError.message : 'Variant updated, but image upload failed');
            router.push(`/products/${productPublicId}/variants`);
            return;
          }
          throw uploadError;
        }
      }
      toast.success(mode === 'editVariant' ? 'Variant Updated Successfully' : 'Variant Created Successfully');
      router.push(`/products/${productPublicId}/variants`);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Unable to save variant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingCard label="Loading variant..." />;

  return (
    <div className="space-y-5">
      <PageTitle
        title={mode === 'editVariant' ? 'Edit Variant' : 'Add Variant'}
        description="Manage variant pricing, stock, images, and batches."
        back={() => router.push(`/products/${productPublicId}/variants`)}
        context={<ProductContextBar context={headerContext} />}
      />
      <Card>
        <CardContent className="space-y-4">
          <VariantFields variant={variant} onChange={(patch) => setVariant((current) => ({ ...current, ...patch }))} />
          <VariantImages variant={variant} onChange={(patch) => setVariant((current) => ({ ...current, ...patch }))} />
          <BatchesEditor batches={variant.batchList} onChange={(batchList) => setVariant((current) => ({ ...current, batchList }))} />
        </CardContent>
      </Card>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={() => router.push(`/products/${productPublicId}/variants`)}>Cancel</Button>
        <Button type="button" loading={saving} onClick={save}><Save className="h-4 w-4" /> Save Variant</Button>
      </div>
    </div>
  );
}

function VariantListPage({ productPublicId }: { productPublicId: string }) {
  const router = useRouter();
  const [variants, setVariants] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmationState>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => undefined });
  const headerContext = useProductHeaderContext(productPublicId);

  const loadVariants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVariants(await productApi.variants(productPublicId));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load variants';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [productPublicId]);

  useEffect(() => {
    void loadVariants();
  }, [loadVariants]);

  const askDelete = (ids: string[]) => setConfirm({
    open: true,
    title: ids.length > 1 ? 'Delete selected variants?' : 'Delete this variant?',
    message: ids.length > 1 ? 'Delete selected variants?' : 'Delete this variant?',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      return Promise.all(ids.map((variantId) => productApi.removeVariant(productPublicId, variantId)))
        .then(async () => {
          toast.success('Deleted successfully');
          await loadVariants();
        });
    },
  });

  return (
    <div className="space-y-5">
      <PageTitle title="Product Variants" description="Manage product variants, pricing, stock, and batches." back={() => router.push('/products')} context={<ProductContextBar context={headerContext} />}>
        <Button onClick={() => router.push(`/products/${productPublicId}/add-variant`)}><Plus className="h-4 w-4" /> Add Variant</Button>
      </PageTitle>
      <DataTable
        module={variantModule}
        data={variants}
        onView={(record) => router.push(`/products/${productPublicId}/view-variant/${record.id}`)}
        onEdit={(record) => router.push(`/products/${productPublicId}/edit-variant/${record.id}`)}
        onDelete={askDelete}
        onDuplicate={() => undefined}
        onArchive={askDelete}
        onStatus={() => undefined}
        onAdd={() => router.push(`/products/${productPublicId}/add-variant`)}
        onBatches={(record) => router.push(`/products/${productPublicId}/variants/${record.id}/batches`)}
        onRetry={loadVariants}
        loading={loading}
        error={error}
      />
      <ConfirmationDialog state={confirm} onClose={() => setConfirm((current) => ({ ...current, open: false }))} />
    </div>
  );
}

function BatchListPage({ productPublicId, variantPublicId }: { productPublicId: string; variantPublicId: string }) {
  const router = useRouter();
  const [batches, setBatches] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmationState>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => undefined });
  const headerContext = useProductHeaderContext(productPublicId, variantPublicId);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBatches(await productApi.batches(variantPublicId));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load batches';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [variantPublicId]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const askDelete = (ids: string[]) => setConfirm({
    open: true,
    title: ids.length > 1 ? 'Delete selected batches?' : 'Delete this batch?',
    message: ids.length > 1 ? 'Delete selected batches?' : 'Delete this batch?',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      return Promise.all(ids.map((batchId) => productApi.removeBatch(batchId)))
        .then(async () => {
          toast.success('Deleted successfully');
          await loadBatches();
        });
    },
  });

  return (
    <div className="space-y-5">
      <PageTitle title="Product Batches" description="Manage batches for this product variant." back={() => router.push(`/products/${productPublicId}/variants`)} context={<ProductContextBar context={headerContext} />}>
        <Button onClick={() => router.push(`/products/${productPublicId}/variants/${variantPublicId}/add-batch`)}><Plus className="h-4 w-4" /> Add Batch</Button>
      </PageTitle>
      <DataTable
        module={batchModule}
        data={batches}
        onView={(record) => router.push(`/products/${productPublicId}/variants/${variantPublicId}/view-batch/${record.id}`)}
        onEdit={(record) => router.push(`/products/${productPublicId}/variants/${variantPublicId}/edit-batch/${record.id}`)}
        onDelete={askDelete}
        onDuplicate={() => undefined}
        onArchive={askDelete}
        onStatus={() => undefined}
        onAdd={() => router.push(`/products/${productPublicId}/variants/${variantPublicId}/add-batch`)}
        onRetry={loadBatches}
        loading={loading}
        error={error}
      />
      <ConfirmationDialog state={confirm} onClose={() => setConfirm((current) => ({ ...current, open: false }))} />
    </div>
  );
}

function BatchFormPage({ productPublicId, variantPublicId, batchPublicId, mode }: { productPublicId: string; variantPublicId: string; batchPublicId?: string; mode: 'addBatch' | 'editBatch' }) {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchFormState>(() => emptyBatch());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'editBatch');
  const backToBatches = () => router.push(`/products/${productPublicId}/variants/${variantPublicId}/batches`);
  const headerContext = useProductHeaderContext(productPublicId, variantPublicId);

  useEffect(() => {
    if (mode !== 'editBatch' || !batchPublicId) return;
    setLoading(true);
    productApi.getBatch(batchPublicId)
      .then((value) => setBatch(batchFromApi(value)))
      .catch((loadError) => toast.error(loadError instanceof Error ? loadError.message : 'Unable to load batch'))
      .finally(() => setLoading(false));
  }, [batchPublicId, mode]);

  const save = async () => {
    const validation = validateBatch(batch);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const { open, temporaryUuid, ...payload } = batch;
      await productApi.createBatch(variantPublicId, {
        ...payload,
        productBatchPublicId: mode === 'editBatch' ? batchPublicId || payload.productBatchPublicId : payload.productBatchPublicId,
      });
      toast.success(mode === 'editBatch' ? 'Batch Updated Successfully' : 'Batch Created Successfully');
      backToBatches();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Unable to save batch');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingCard label="Loading batch..." />;

  return (
    <div className="space-y-5">
      <PageTitle
        title={mode === 'editBatch' ? 'Edit Batch' : 'Add Batch'}
        description="Manage batch stock, supplier, pricing, and dates."
        back={backToBatches}
        context={<ProductContextBar context={headerContext} />}
      />
      <Card>
        <CardContent>
          <BatchFields batch={batch} onChange={(patch) => setBatch((current) => ({ ...current, ...patch }))} />
        </CardContent>
      </Card>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={backToBatches}>Cancel</Button>
        <Button type="button" loading={saving} onClick={save}><Save className="h-4 w-4" /> Save Batch</Button>
      </div>
    </div>
  );
}

function BatchViewPage({ productPublicId, variantPublicId, batchPublicId }: { productPublicId: string; variantPublicId: string; batchPublicId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<BatchFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const backToBatches = () => router.push(`/products/${productPublicId}/variants/${variantPublicId}/batches`);
  const headerContext = useProductHeaderContext(productPublicId, variantPublicId);

  useEffect(() => {
    productApi.getBatch(batchPublicId)
      .then((value) => setRecord(batchFromApi(value)))
      .catch((loadError) => toast.error(loadError instanceof Error ? loadError.message : 'Unable to load batch'))
      .finally(() => setLoading(false));
  }, [batchPublicId]);

  if (loading) return <LoadingCard label="Loading batch..." />;
  return (
    <div className="space-y-5">
      <PageTitle title="View Batch" description="Read-only batch information." back={backToBatches} context={<ProductContextBar context={headerContext} />}>
        <Button variant="outline" onClick={() => router.push(`/products/${productPublicId}/variants/${variantPublicId}/edit-batch/${batchPublicId}`)}><Edit className="h-4 w-4" /> Edit</Button>
      </PageTitle>
      {record ? <BatchDetails batch={record} /> : <LoadingCard label="Batch not found" />}
    </div>
  );
}

function ProductViewPage({ productPublicId }: { productPublicId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<ProductFormState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.get(productPublicId)
      .then((value) => setRecord(productFromApi(value)))
      .catch((loadError) => toast.error(loadError instanceof Error ? loadError.message : 'Unable to load product'))
      .finally(() => setLoading(false));
  }, [productPublicId]);

  if (loading) return <LoadingCard label="Loading product..." />;
  return (
    <div className="space-y-5">
      <PageTitle title="View Product" description="Read-only product information." back={() => router.push('/products')}>
        <Button variant="outline" onClick={() => router.push(`/products/edit/${productPublicId}`)}><Edit className="h-4 w-4" /> Edit</Button>
        <Button onClick={() => router.push(`/products/${productPublicId}/variants`)}>Variants</Button>
      </PageTitle>
      {record ? <ProductDetails product={record} /> : <LoadingCard label="Product not found" />}
    </div>
  );
}

function VariantViewPage({ productPublicId, variantPublicId }: { productPublicId: string; variantPublicId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<VariantFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const headerContext = useProductHeaderContext(productPublicId);

  useEffect(() => {
    productApi.getVariant(productPublicId, variantPublicId)
      .then((value) => setRecord(variantFromApi(value)))
      .catch((loadError) => toast.error(loadError instanceof Error ? loadError.message : 'Unable to load variant'))
      .finally(() => setLoading(false));
  }, [productPublicId, variantPublicId]);

  if (loading) return <LoadingCard label="Loading variant..." />;
  return (
    <div className="space-y-5">
      <PageTitle title="View Variant" description="Read-only variant information with batches." back={() => router.push(`/products/${productPublicId}/variants`)} context={<ProductContextBar context={headerContext} />}>
        <Button variant="outline" onClick={() => router.push(`/products/${productPublicId}/edit-variant/${variantPublicId}`)}><Edit className="h-4 w-4" /> Edit</Button>
      </PageTitle>
      {record ? <VariantDetails variant={record} /> : <LoadingCard label="Variant not found" />}
    </div>
  );
}

function VariantFields({ variant, onChange }: { variant: VariantFormState; onChange: (patch: Partial<VariantFormState>) => void }) {
  return (
    <div className="space-y-4">
      <SectionTitle title="General Information" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextField label="Variant Name" required value={variant.variantName} onChange={(value) => onChange({ variantName: value })} />
        <TextField label="Product Name" value={variant.productName} onChange={(value) => onChange({ productName: value })} />
        <NumberField label="MRP" required value={variant.mrp} onChange={(value) => onChange({ mrp: value })} />
        <NumberField label="Selling Price" required value={variant.sellingPrice} onChange={(value) => onChange({ sellingPrice: value })} />
        <NumberField label="Cost Price" value={variant.costPrice} onChange={(value) => onChange({ costPrice: value })} />
        <NumberField label="Tax Percentage" value={variant.taxPercentage} onChange={(value) => onChange({ taxPercentage: value })} />
        <NumberField label="Discount Percentage" value={variant.discountPercentage} onChange={(value) => onChange({ discountPercentage: value })} />
        <NumberField label="Rating" value={variant.rating} onChange={(value) => onChange({ rating: value })} />
        <NumberField label="Stock Quantity" required value={variant.stockQuantity} onChange={(value) => onChange({ stockQuantity: value })} />
        <NumberField label="Low Stock Threshold" value={variant.lowStockThreshold} onChange={(value) => onChange({ lowStockThreshold: value })} />
        <NumberField label="Min Order Quantity" value={variant.minOrderQuantity} onChange={(value) => onChange({ minOrderQuantity: value })} />
        <NumberField label="Max Order Quantity" value={variant.maxOrderQuantity} onChange={(value) => onChange({ maxOrderQuantity: value })} />
        <SelectField label="Measuring Unit" required value={variant.measuringUnit} options={measuringUnits} onChange={(value) => onChange({ measuringUnit: value })} />
        <NumberField label="Amount" required value={variant.amount} onChange={(value) => onChange({ amount: value })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <SwitchField label="Active" checked={variant.active} onChange={(value) => onChange({ active: value })} />
        <SwitchField label="Featured" checked={variant.featured} onChange={(value) => onChange({ featured: value })} />
        <SwitchField label="Favoured" checked={variant.favoured} onChange={(value) => onChange({ favoured: value })} />
        <SwitchField label="In Demand" checked={variant.inDemand} onChange={(value) => onChange({ inDemand: value })} />
        <SwitchField label="Returnable" checked={variant.returnable} onChange={(value) => onChange({ returnable: value })} />
        <SwitchField label="COD Available" checked={variant.codAvailable} onChange={(value) => onChange({ codAvailable: value })} />
      </div>
    </div>
  );
}

function VariantImages({ variant, onChange }: { variant: VariantFormState; onChange: (patch: Partial<VariantFormState>) => void }) {
  return (
    <div>
      <SectionTitle title="Images" />
      <ImageUpload
        value={variant.imagePreviews}
        multiple
        maxFiles={5}
        fileMode
        onChange={(value) => {
          if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
            const imagePreviews = value;
            onChange({
              imagePreviews,
              images: variant.images.filter((_, index) => imagePreviews.includes(variant.imagePreviews[index])),
            });
            return;
          }
          const files = Array.isArray(value) ? value.filter((item): item is File => item instanceof File) : [];
          onChange({ images: [...variant.images, ...files].slice(0, 5), imagePreviews: [...variant.imagePreviews, ...files.map((file) => URL.createObjectURL(file))].slice(0, 5) });
        }}
      />
    </div>
  );
}

function BatchesEditor({ batches, onChange }: { batches: BatchFormState[]; onChange: (value: BatchFormState[]) => void }) {
  const update = (id: string, patch: Partial<BatchFormState>) => onChange(batches.map((batch) => (batchKey(batch) === id ? { ...batch, ...patch } : batch)));
  return (
    <div className="space-y-3">
      <SectionTitle title="Batches" action={<Button type="button" variant="outline" onClick={() => onChange([...batches, emptyBatch()])}><Plus className="h-4 w-4" /> Add Batch</Button>} />
      {batches.map((batch, index) => {
        const key = batchKey(batch);
        return (
        <div key={key} className="rounded-md border border-border">
          <button type="button" className="flex w-full items-center justify-between p-3 text-left text-sm font-semibold" onClick={() => update(key, { open: !batch.open })}>
            <span>Batch {index + 1}</span>
            {batch.open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {batch.open ? (
            <div className="border-t border-border p-3">
              <BatchFields batch={batch} onChange={(patch) => update(key, patch)} />
              <Button type="button" variant="ghost" className="text-destructive md:self-end" onClick={() => onChange(batches.filter((_, batchIndex) => batchIndex !== index))}><Trash2 className="h-4 w-4" /> Delete Batch</Button>
            </div>
          ) : null}
        </div>
      );
      })}
    </div>
  );
}

function BatchFields({ batch, onChange }: { batch: BatchFormState; onChange: (patch: Partial<BatchFormState>) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TextField label="Name" value={batch.name} onChange={(value) => onChange({ name: value })} />
      <TextField label="Batch Number" value={batch.batchNumber} onChange={(value) => onChange({ batchNumber: value })} />
      <TextField label="Lot Number" value={batch.lotNumber} onChange={(value) => onChange({ lotNumber: value })} />
      <TextField label="Barcode" value={batch.barcode} onChange={(value) => onChange({ barcode: value })} />
      <TextField label="Supplier Name" value={batch.supplierName} onChange={(value) => onChange({ supplierName: value })} />
      <DateField label="Manufacturing Date" value={batch.manufacturingDate} onChange={(value) => onChange({ manufacturingDate: value })} />
      <DateField label="Expiry Date" value={batch.expiryDate} onChange={(value) => onChange({ expiryDate: value })} />
      <DateField label="Received Date" value={batch.receivedDate} onChange={(value) => onChange({ receivedDate: value })} />
      <NumberField label="Received Quantity" value={batch.receivedQuantity} onChange={(value) => onChange({ receivedQuantity: value })} />
      <NumberField label="Available Quantity" value={batch.availableQuantity} onChange={(value) => onChange({ availableQuantity: value })} />
      <NumberField label="Reserved Quantity" value={batch.reservedQuantity} onChange={(value) => onChange({ reservedQuantity: value })} />
      <NumberField label="Minimum Quantity" value={batch.minimumQuantity} onChange={(value) => onChange({ minimumQuantity: value })} />
      <NumberField label="Cost Price" value={batch.costPrice} onChange={(value) => onChange({ costPrice: value })} />
      <NumberField label="MRP" value={batch.mrp} onChange={(value) => onChange({ mrp: value })} />
      <NumberField label="Selling Price" value={batch.sellingPrice} onChange={(value) => onChange({ sellingPrice: value })} />
      <TextField label="Status" value={batch.status} onChange={(value) => onChange({ status: value })} />
      <SwitchField label="Active" checked={batch.active} onChange={(value) => onChange({ active: value })} />
      <SwitchField label="Archived" checked={batch.archived} onChange={(value) => onChange({ archived: value })} />
    </div>
  );
}

function CategoryCascade({ categories, value, onChange }: { categories: CategoryNode[]; value: string[]; onChange: (value: string[]) => void }) {
  const levels = useMemo(() => {
    const next: CategoryNode[][] = [categories];
    let current = categories.find((category) => category.categoryPublicId === value[0]);
    let index = 1;
    while (current?.subCategoryDtoList?.length) {
      next.push(current.subCategoryDtoList);
      current = current.subCategoryDtoList.find((category) => category.categoryPublicId === value[index]);
      index += 1;
    }
    return next;
  }, [categories, value]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {levels.map((options, index) => (
        <label key={index}>
          <span className="mb-1.5 block text-sm font-medium">{index === 0 ? 'Category *' : index === 1 ? 'Sub Category' : 'Child Category'}</span>
          <select className={textInput} value={value[index] ?? ''} onChange={(event) => onChange([...value.slice(0, index), event.target.value].filter(Boolean))}>
            <option value="">Select</option>
            {options.map((category) => <option key={category.categoryPublicId} value={category.categoryPublicId}>{category.categoryName}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function TextField({ label, value, onChange, required, textarea }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; textarea?: boolean }) {
  const Component = textarea ? 'textarea' : 'input';
  return (
    <label className={textarea ? 'md:col-span-2' : ''}>
      <span className="mb-1.5 block text-sm font-medium">{label}{required ? ' *' : ''}</span>
      <Component className={textarea ? areaInput : textInput} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange, required }: { label: string; value: number; onChange: (value: number) => void; required?: boolean }) {
  const [draft, setDraft] = useState(Number.isFinite(value) ? String(value) : '');

  useEffect(() => {
    const next = Number.isFinite(value) ? String(value) : '';
    if (Number(draft) !== value && draft !== '' && draft !== '.') setDraft(next);
  }, [draft, value]);

  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium">{label}{required ? ' *' : ''}</span>
      <input
        className={textInput}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.]?[0-9]*"
        value={draft}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (!/^\d*\.?\d*$/.test(nextValue)) return;
          setDraft(nextValue);
          onChange(nextValue === '' ? 0 : Number(nextValue));
        }}
      />
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input className={textInput} type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange, required }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium">{label}{required ? ' *' : ''}</span>
      <select className={textInput} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ProductDetails({ product }: { product: ProductFormState }) {
  return (
    <div className="space-y-4">
      <DetailCard title="Product Information" rows={[
        ['Product Name', product.name],
        ['Slug', product.slug],
        ['Brand', product.brand],
        ['SKU', product.sku],
        ['HSN Code', product.hsnCode],
        ['Barcode', product.barcode],
        ['Tags', product.tags],
        ['Shop Branch Code', product.shopBranchCode],
        ['Has Variant', product.hasVariant],
        ['Has Batch', product.hasBatch],
      ]} />
      <DetailCard title="Category" rows={product.categoryPublicIdList.map((categoryId, index) => [`Level ${index + 1}`, categoryId])} />
      <DetailCard title="Description" rows={[
        ['Short Description', product.shortDescription],
        ['Description', product.description],
      ]} />
      <DetailCard title="Additional Details" rows={product.additionalDetailsRows.filter((row) => row.keyName || row.value).map((row) => [row.keyName || '-', row.value])} />
      <DetailCard title="SEO Information" rows={[
        ['Meta Title', product.metaTitle],
        ['Meta Description', product.metaDescription],
      ]} />
      <DetailCard title="Variant Summary" rows={[
        ['Total Variants', product.productVariantList.length],
        ['Active Variants', product.productVariantList.filter((variant) => variant.active).length],
      ]} />
      {product.hasBatch ? <BatchTable batches={product.productVariantList.flatMap((variant) => variant.batchList)} title="Batch Information" /> : null}
    </div>
  );
}

function VariantDetails({ variant }: { variant: VariantFormState }) {
  return (
    <div className="space-y-4">
      <DetailCard title="General Information" rows={[
        ['Variant Name', variant.variantName],
        ['Product Name', variant.productName],
        ['Active', variant.active],
        ['Featured', variant.featured],
        ['Favoured', variant.favoured],
        ['In Demand', variant.inDemand],
        ['Returnable', variant.returnable],
        ['COD Available', variant.codAvailable],
      ]} />
      <DetailCard title="Pricing" rows={[
        ['MRP', variant.mrp],
        ['Selling Price', variant.sellingPrice],
        ['Cost Price', variant.costPrice],
        ['Tax Percentage', variant.taxPercentage],
        ['Discount Percentage', variant.discountPercentage],
        ['Rating', variant.rating],
      ]} />
      <DetailCard title="Inventory" rows={[
        ['Stock Quantity', variant.stockQuantity],
        ['Low Stock Threshold', variant.lowStockThreshold],
        ['Min Order Quantity', variant.minOrderQuantity],
        ['Max Order Quantity', variant.maxOrderQuantity],
        ['Measuring Unit', variant.measuringUnit],
        ['Amount', variant.amount],
      ]} />
      <Card>
        <CardContent>
          <SectionTitle title="Images" />
          {variant.imagePreviews.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {variant.imagePreviews.map((image) => <img key={image} src={image} alt="" className="aspect-square rounded-md border border-border object-cover" />)}
            </div>
          ) : <p className="text-sm text-muted-foreground">No images</p>}
        </CardContent>
      </Card>
      <BatchTable batches={variant.batchList} title="Batch List" />
    </div>
  );
}

function BatchDetails({ batch }: { batch: BatchFormState }) {
  return (
    <div className="space-y-4">
      <DetailCard title="Batch Information" rows={[
        ['Name', batch.name],
        ['Batch Number', batch.batchNumber],
        ['Lot Number', batch.lotNumber],
        ['Barcode', batch.barcode],
        ['Supplier Name', batch.supplierName],
        ['Status', batch.status],
        ['Active', batch.active],
        ['Archived', batch.archived],
      ]} />
      <DetailCard title="Dates" rows={[
        ['Manufacturing Date', batch.manufacturingDate],
        ['Expiry Date', batch.expiryDate],
        ['Received Date', batch.receivedDate],
      ]} />
      <DetailCard title="Inventory And Pricing" rows={[
        ['Received Quantity', batch.receivedQuantity],
        ['Available Quantity', batch.availableQuantity],
        ['Reserved Quantity', batch.reservedQuantity],
        ['Minimum Quantity', batch.minimumQuantity],
        ['Cost Price', batch.costPrice],
        ['MRP', batch.mrp],
        ['Selling Price', batch.sellingPrice],
      ]} />
    </div>
  );
}

function DetailCard({ title, rows }: { title: string; rows: Array<[string, string | number | boolean | undefined]> }) {
  return (
    <Card>
      <CardContent>
        <SectionTitle title={title} />
        {rows.length ? (
          <dl className="grid gap-4 md:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">{readable(value as never)}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="text-sm text-muted-foreground">No data</p>}
      </CardContent>
    </Card>
  );
}

function BatchTable({ batches, title }: { batches: BatchFormState[]; title: string }) {
  return (
    <Card>
      <CardContent>
        <SectionTitle title={title} />
        {batches.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {['Batch', 'Name', 'Batch Number', 'Lot Number', 'Supplier', 'MFG Date', 'Expiry Date', 'Available Qty', 'MRP', 'Selling Price', 'Status'].map((header) => <th key={header} className="px-3 py-3">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch, index) => (
                  <tr key={batchKey(batch)} className="border-t border-border">
                    <td className="px-3 py-3">Batch {index + 1}</td>
                    <td className="px-3 py-3">{readable(batch.name)}</td>
                    <td className="px-3 py-3">{readable(batch.batchNumber)}</td>
                    <td className="px-3 py-3">{readable(batch.lotNumber)}</td>
                    <td className="px-3 py-3">{readable(batch.supplierName)}</td>
                    <td className="px-3 py-3">{readable(batch.manufacturingDate)}</td>
                    <td className="px-3 py-3">{readable(batch.expiryDate)}</td>
                    <td className="px-3 py-3">{readable(batch.availableQuantity)}</td>
                    <td className="px-3 py-3">{readable(batch.mrp)}</td>
                    <td className="px-3 py-3">{readable(batch.sellingPrice)}</td>
                    <td className="px-3 py-3"><StatusChip status={batch.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">No batches</p>}
      </CardContent>
    </Card>
  );
}

function PageTitle({ title, description, back, context, children }: { title: string; description: string; back?: () => void; context?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          {back ? <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</button> : <span>Admin</span>}
          <span>/</span>
          <span>{title}</span>
        </div>
        <h1 className="truncate text-2xl font-bold tracking-normal">{title}</h1>
        {context}
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function ProductContextBar({ context }: { context: ProductHeaderContext | null }) {
  if (!context?.productName) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-foreground">
      <span>Product: {context.productName}</span>
      {context.variantName ? <span>Variant: {context.variantName}</span> : null}
    </div>
  );
}

function useProductHeaderContext(productPublicId: string, variantPublicId?: string) {
  const [context, setContext] = useState<ProductHeaderContext | null>(null);

  useEffect(() => {
    let mounted = true;
    setContext(null);
    productApi.get(productPublicId)
      .then(async (value) => {
        const product = productFromApi(value);
        let variantName = product.productVariantList.find((variant) => variant.productVariantPublicId === variantPublicId)?.variantName;
        if (variantPublicId && !variantName) {
          const variant = variantFromApi(await productApi.getVariant(productPublicId, variantPublicId));
          variantName = variant.variantName;
        }
        if (mounted) setContext({ productName: product.name, variantName });
      })
      .catch(() => {
        if (mounted) setContext(null);
      });
    return () => {
      mounted = false;
    };
  }, [productPublicId, variantPublicId]);

  return context;
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold uppercase text-muted-foreground">{title}</h3>
      {action}
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return <Card><CardContent className="text-center"><p className="font-semibold">{label}</p></CardContent></Card>;
}

function parseProductRoute(parts: string[]): { mode: ProductRouteMode; productPublicId?: string; variantPublicId?: string; batchPublicId?: string } {
  if (parts[1] === 'add' || parts[1] === 'new') return { mode: 'add' };
  if (parts[1] === 'edit') return { mode: 'edit', productPublicId: parts[2] };
  if (parts[1] === 'view') return { mode: 'view', productPublicId: parts[2] };
  if (parts[2] === 'variants' && parts[4] === 'batches') return { mode: 'batches', productPublicId: parts[1], variantPublicId: parts[3] };
  if (parts[2] === 'variants' && parts[4] === 'add-batch') return { mode: 'addBatch', productPublicId: parts[1], variantPublicId: parts[3] };
  if (parts[2] === 'variants' && parts[4] === 'edit-batch') return { mode: 'editBatch', productPublicId: parts[1], variantPublicId: parts[3], batchPublicId: parts[5] };
  if (parts[2] === 'variants' && parts[4] === 'view-batch') return { mode: 'viewBatch', productPublicId: parts[1], variantPublicId: parts[3], batchPublicId: parts[5] };
  if (parts[2] === 'variants') return { mode: 'variants', productPublicId: parts[1] };
  if (parts[2] === 'add-variant') return { mode: 'addVariant', productPublicId: parts[1] };
  if (parts[2] === 'edit-variant') return { mode: 'editVariant', productPublicId: parts[1], variantPublicId: parts[3] };
  if (parts[2] === 'view-variant') return { mode: 'viewVariant', productPublicId: parts[1], variantPublicId: parts[3] };
  return { mode: 'list' };
}

function emptyProduct(): ProductFormState {
  return {
    productPublicId: '',
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    brand: '',
    sku: '',
    hsnCode: '',
    barcode: '',
    additionalDetailsRows: [emptyKeyValue()],
    tags: '',
    metaTitle: '',
    metaDescription: '',
    shopBranchCode: '',
    hasVariant: true,
    hasBatch: true,
    categoryPublicIdList: [],
    productVariantList: [emptyVariant()],
  };
}

function emptyKeyValue(): KeyValueRow {
  return { id: crypto.randomUUID(), keyName: '', value: '' };
}

function emptyVariant(): VariantFormState {
  return {
    productVariantPublicId: `local-${crypto.randomUUID()}`,
    variantName: '',
    productName: '',
    mrp: 0,
    sellingPrice: 0,
    costPrice: 0,
    taxPercentage: 0,
    discountPercentage: 0,
    rating: 0,
    stockQuantity: 0,
    lowStockThreshold: 0,
    minOrderQuantity: 1,
    maxOrderQuantity: 0,
    active: true,
    featured: false,
    favoured: false,
    inDemand: false,
    returnable: true,
    codAvailable: true,
    measuringUnit: '',
    amount: 0,
    productImage1: '',
    productImage2: '',
    productImage3: '',
    productImage4: '',
    productImage5: '',
    images: [],
    imagePreviews: [],
    batchList: [emptyBatch()],
  };
}

function emptyBatch(): BatchFormState {
  return {
    open: true,
    temporaryUuid: crypto.randomUUID(),
    productBatchPublicId: undefined,
    name: '',
    batchNumber: '',
    lotNumber: '',
    barcode: '',
    supplierName: '',
    manufacturingDate: '',
    expiryDate: '',
    receivedDate: '',
    receivedQuantity: 0,
    availableQuantity: 0,
    reservedQuantity: 0,
    minimumQuantity: 0,
    costPrice: 0,
    mrp: 0,
    sellingPrice: 0,
    active: true,
    status: 'Active',
    archived: false,
  };
}

function productPayload(form: ProductFormState, productPublicId = ''): ProductPayload {
  return {
    productPublicId: productPublicId || form.productPublicId || '',
    name: form.name,
    slug: form.slug,
    shortDescription: form.shortDescription,
    description: form.description,
    brand: form.brand,
    sku: form.sku,
    hsnCode: form.hsnCode,
    barcode: form.barcode,
    additionalDetails: Object.fromEntries(form.additionalDetailsRows.filter((row) => row.keyName.trim()).map((row) => [row.keyName.trim(), row.value.trim()])),
    tags: form.tags,
    metaTitle: form.metaTitle,
    metaDescription: form.metaDescription,
    shopBranchCode: form.shopBranchCode,
    hasVariant: form.hasVariant,
    hasBatch: form.hasBatch,
    categoryPublicIdList: form.categoryPublicIdList,
    productVariantList: form.hasVariant ? form.productVariantList.map(variantPayload) : [],
  };
}

function variantPayload(variant: VariantFormState): ProductVariantPayload {
  const { images, imagePreviews, batchList, ...rest } = variant;
  return {
    ...rest,
    productVariantPublicId: rest.productVariantPublicId?.startsWith('local-') ? undefined : rest.productVariantPublicId,
    productImage1: '',
    productImage2: '',
    productImage3: '',
    productImage4: '',
    productImage5: '',
    batchList: batchList.map(({ open, temporaryUuid, ...batch }) => batch),
  };
}

function batchKey(batch: BatchFormState) {
  return batch.productBatchPublicId || batch.temporaryUuid;
}

function validateProduct(form: ProductFormState): string | null {
  if (!form.name.trim()) return 'Product Name is required';
  if (!form.slug.trim()) return 'Slug is required';
  if (!form.categoryPublicIdList.length) return 'Category is required';
  if (form.hasVariant) {
    for (const variant of form.productVariantList) {
      const message = validateVariant(variant);
      if (message) return message;
    }
  }
  return null;
}

function validateVariant(variant: VariantFormState): string | null {
  if (!variant.variantName.trim()) return 'Variant Name is required';
  if (variant.mrp <= 0) return 'MRP is required';
  if (variant.sellingPrice <= 0) return 'Selling Price is required';
  if (variant.sellingPrice > variant.mrp) return 'Selling Price must be less than or equal to MRP';
  if (variant.stockQuantity < 0) return 'Stock Quantity must be zero or more';
  if (!variant.measuringUnit.trim()) return 'Measuring Unit is required';
  if (variant.amount <= 0) return 'Amount is required';
  for (const batch of variant.batchList) {
    const message = validateBatch(batch);
    if (message) return message;
  }
  return null;
}

function validateBatch(batch: BatchFormState): string | null {
  if (batch.expiryDate && batch.manufacturingDate && batch.expiryDate < batch.manufacturingDate) return 'Expiry Date must be after Manufacturing Date';
  if (batch.receivedDate && batch.manufacturingDate && batch.receivedDate < batch.manufacturingDate) return 'Received Date must be after Manufacturing Date';
  if (batch.receivedQuantity < 0) return 'Received Quantity must be zero or more';
  if (batch.availableQuantity < 0) return 'Available Quantity must be zero or more';
  if (batch.reservedQuantity < 0) return 'Reserved Quantity must be zero or more';
  if (batch.minimumQuantity < 0) return 'Minimum Quantity must be zero or more';
  if (batch.sellingPrice > batch.mrp && batch.mrp > 0) return 'Batch Selling Price must be less than or equal to MRP';
  return null;
}

function updateAdditional(dispatch: Dispatch<SetStateAction<ProductFormState>>, id: string, key: keyof KeyValueRow, value: string) {
  dispatch((current) => ({ ...current, additionalDetailsRows: current.additionalDetailsRows.map((row) => (row.id === id ? { ...row, [key]: value } : row)) }));
}

function productFromApi(value: unknown): ProductFormState {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const additionalDetails = source.additionalDetails && typeof source.additionalDetails === 'object' ? source.additionalDetails as Record<string, unknown> : {};
  const variants = Array.isArray(source.productVariantList) ? source.productVariantList.map(variantFromApi) : [emptyVariant()];
  return {
    ...emptyProduct(),
    productPublicId: String(source.productPublicId ?? ''),
    name: String(source.name ?? source.productName ?? ''),
    slug: String(source.slug ?? ''),
    shortDescription: String(source.shortDescription ?? ''),
    description: String(source.description ?? ''),
    brand: String(source.brand ?? ''),
    sku: String(source.sku ?? ''),
    hsnCode: String(source.hsnCode ?? ''),
    barcode: String(source.barcode ?? ''),
    additionalDetailsRows: Object.entries(additionalDetails).map(([keyName, rowValue]) => ({ id: crypto.randomUUID(), keyName, value: String(rowValue ?? '') })),
    tags: String(source.tags ?? ''),
    metaTitle: String(source.metaTitle ?? ''),
    metaDescription: String(source.metaDescription ?? ''),
    shopBranchCode: String(source.shopBranchCode ?? ''),
    hasVariant: Boolean(source.hasVariant ?? true),
    hasBatch: Boolean(source.hasBatch ?? true),
    categoryPublicIdList: Array.isArray(source.categoryPublicIdList) ? source.categoryPublicIdList.map(String) : [],
    productVariantList: variants.length ? variants : [emptyVariant()],
  };
}

function variantFromApi(value: unknown): VariantFormState {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const batches = Array.isArray(source.batchList) ? source.batchList.map(batchFromApi) : [emptyBatch()];
  return {
    ...emptyVariant(),
    productVariantPublicId: String(source.productVariantPublicId ?? source.id ?? crypto.randomUUID()),
    variantName: String(source.variantName ?? source.name ?? ''),
    productName: String(source.productName ?? ''),
    mrp: Number(source.mrp ?? 0),
    sellingPrice: Number(source.sellingPrice ?? 0),
    costPrice: Number(source.costPrice ?? 0),
    taxPercentage: Number(source.taxPercentage ?? 0),
    discountPercentage: Number(source.discountPercentage ?? 0),
    rating: Number(source.rating ?? 0),
    stockQuantity: Number(source.stockQuantity ?? source.stock ?? 0),
    lowStockThreshold: Number(source.lowStockThreshold ?? 0),
    minOrderQuantity: Number(source.minOrderQuantity ?? 1),
    maxOrderQuantity: Number(source.maxOrderQuantity ?? 0),
    active: Boolean(source.active ?? true),
    featured: Boolean(source.featured ?? false),
    favoured: Boolean(source.favoured ?? false),
    inDemand: Boolean(source.inDemand ?? false),
    returnable: Boolean(source.returnable ?? true),
    codAvailable: Boolean(source.codAvailable ?? true),
    measuringUnit: String(source.measuringUnit ?? source.unit ?? ''),
    amount: Number(source.amount ?? 0),
    imagePreviews: [source.productImage1, source.productImage2, source.productImage3, source.productImage4, source.productImage5].map((item) => String(item ?? '')).filter(Boolean),
    batchList: batches.length ? batches : [emptyBatch()],
  };
}

function batchFromApi(value: unknown): BatchFormState {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const apiBoolean = (nextValue: unknown, fallback: boolean) => {
    if (typeof nextValue === 'boolean') return nextValue;
    if (typeof nextValue === 'string') return ['true', 'active', 'yes'].includes(nextValue.toLowerCase());
    return fallback;
  };
  return {
    ...emptyBatch(),
    temporaryUuid: crypto.randomUUID(),
    productBatchPublicId: String(source.productBatchPublicId ?? ''),
    name: String(source.name ?? ''),
    batchNumber: String(source.batchNumber ?? ''),
    lotNumber: String(source.lotNumber ?? ''),
    barcode: String(source.barcode ?? ''),
    supplierName: String(source.supplierName ?? ''),
    manufacturingDate: String(source.manufacturingDate ?? '').slice(0, 10),
    expiryDate: String(source.expiryDate ?? '').slice(0, 10),
    receivedDate: String(source.receivedDate ?? '').slice(0, 10),
    receivedQuantity: Number(source.receivedQuantity ?? 0),
    availableQuantity: Number(source.availableQuantity ?? 0),
    reservedQuantity: Number(source.reservedQuantity ?? 0),
    minimumQuantity: Number(source.minimumQuantity ?? 0),
    costPrice: Number(source.costPrice ?? 0),
    mrp: Number(source.mrp ?? 0),
    sellingPrice: Number(source.sellingPrice ?? 0),
    active: apiBoolean(source.active ?? source.isActive, true),
    status: String(source.status ?? 'Active'),
    archived: apiBoolean(source.archived, false),
  };
}
