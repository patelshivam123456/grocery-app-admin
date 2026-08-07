import type { AdminRecord } from '@/types/admin';
import { apiCaller } from '@/services/apiCaller';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const PRODUCT_API_PATH = '/e-comm-admin/product/v1';
const CATEGORY_API_PATH = '/e-comm-admin/category/v1';

type ApiObject = Record<string, unknown>;
type ProductListFilter = 'all' | 'active' | 'deleted';

export type CategoryNode = {
  categoryPublicId: string;
  categoryName: string;
  subCategoryDtoList: CategoryNode[];
};

export type ProductBatchPayload = {
  productBatchPublicId?: string;
  name: string;
  batchNumber: string;
  lotNumber: string;
  barcode: string;
  supplierName: string;
  manufacturingDate: string;
  expiryDate: string;
  receivedDate: string;
  receivedQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minimumQuantity: number;
  costPrice: number;
  mrp: number;
  sellingPrice: number;
  active: boolean;
  status: string;
  archived: boolean;
};

export type ProductVariantPayload = {
  productVariantPublicId?: string;
  variantName: string;
  productName: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  taxPercentage: number;
  discountPercentage: number;
  rating: number;
  stockQuantity: number;
  lowStockThreshold: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  active: boolean;
  featured: boolean;
  favoured: boolean;
  inDemand: boolean;
  returnable: boolean;
  codAvailable: boolean;
  measuringUnit: string;
  amount: number;
  productImage1: string;
  productImage2: string;
  productImage3: string;
  productImage4: string;
  productImage5: string;
  batchList: ProductBatchPayload[];
};

export type ProductPayload = {
  productPublicId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  brand: string;
  sku: string;
  hsnCode: string;
  barcode: string;
  additionalDetails: Record<string, string>;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  shopBranchCode: string;
  hasVariant: boolean;
  hasBatch: boolean;
  categoryPublicIdList: string[];
  productVariantList: ProductVariantPayload[];
};

const today = () => new Date().toISOString().slice(0, 10);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('Product API base URL is not configured.');
  return apiCaller<T>(`${PRODUCT_API_PATH}${path}`, { ...init, baseUrl: API_BASE });
}

async function categoryRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('Category API base URL is not configured.');
  return apiCaller<T>(`${CATEGORY_API_PATH}${path}`, { ...init, baseUrl: API_BASE });
}

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const data = value as ApiObject;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.productVariantList)) return data.productVariantList;
  if (data.data && typeof data.data === 'object') return data.data;
  if (data.result && typeof data.result === 'object') return data.result;
  if (data.product && typeof data.product === 'object') return data.product;
  if (data.variant && typeof data.variant === 'object') return data.variant;
  return data;
}

function field(source: ApiObject, names: string[]): unknown {
  return names.map((name) => source[name]).find((value) => value !== undefined && value !== null);
}

function toNumber(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', 'active', 'yes'].includes(value.toLowerCase());
  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function categoryNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return String(field(item as ApiObject, ['categoryName', 'name', 'subCategoryName']) ?? '');
    return '';
  }).map((item) => item.trim()).filter(Boolean);
}

function imageUrls(source: ApiObject): string[] {
  const imageFields = ['featuredImage', 'image', 'imageUrl', 'productImage1', 'productImage2', 'productImage3', 'productImage4', 'productImage5']
    .map((name) => source[name])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
  const imageList = field(source, ['galleryImages', 'images', 'productImages', 'productImageList', 'imagePreviews']);
  const listUrls = Array.isArray(imageList)
    ? imageList.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return String(field(item as ApiObject, ['url', 'imageUrl', 'src', 'path']) ?? '');
      return '';
    }).map((item) => item.trim()).filter(Boolean)
    : [];
  return Array.from(new Set([...imageFields, ...listUrls]));
}

function productImageUrls(source: ApiObject): string[] {
  const directImages = imageUrls(source);
  const variants = field(source, ['productVariantList', 'variantList', 'variants']);
  const variantImages = Array.isArray(variants)
    ? variants.flatMap((variant) => imageUrls((variant && typeof variant === 'object' ? variant : {}) as ApiObject))
    : [];
  return Array.from(new Set([...directImages, ...variantImages]));
}

export function normalizeCategoryTree(value: unknown): CategoryNode {
  const source = (value && typeof value === 'object' ? value : {}) as ApiObject;
  const children = field(source, ['subCategoryDtoList', 'children', 'subCategories']);
  return {
    categoryPublicId: String(field(source, ['categoryPublicId', 'publicId', 'id', '_id']) ?? ''),
    categoryName: String(field(source, ['categoryName', 'name']) ?? ''),
    subCategoryDtoList: Array.isArray(children) ? children.map(normalizeCategoryTree).filter((item) => item.categoryPublicId) : [],
  };
}

export function normalizeProduct(value: unknown): AdminRecord {
  const source = (value && typeof value === 'object' ? value : {}) as ApiObject;
  const productPublicId = String(field(source, ['productPublicId', 'publicId', 'id', '_id']) ?? '');
  const hasVariant = toBoolean(field(source, ['hasVariant']), true);
  const hasBatch = toBoolean(field(source, ['hasBatch']), false);
  const active = field(source, ['active', 'isActive']);
  const status = typeof active === 'boolean' ? (active ? 'Active' : 'Inactive') : String(field(source, ['status']) ?? 'Active');
  const categoryNameSource = field(source, ['categoryNameList', 'categoryNames', 'categories', 'categoryList']);
  const categoryDisplayNames = categoryNames(categoryNameSource);
  const categoryName = String(field(source, ['categoryName', 'category']) ?? '').trim() || categoryDisplayNames[0] || '';
  const subcategoryName = String(field(source, ['subCategoryName', 'subcategoryName', 'subCategory', 'subcategory']) ?? '').trim()
    || categoryDisplayNames.slice(1).join(' > ');
  const categoryIds = toStringArray(field(source, ['categoryPublicIdList', 'categoryPublicIds', 'categoryIds']));
  const fallbackCategoryIds = ['categoryPublicId', 'categoryId', 'subCategoryPublicId', 'subcategoryPublicId', 'subCategoryId', 'childCategoryPublicId']
    .map((name) => String(source[name] ?? '').trim())
    .filter(Boolean);
  const categoryPublicIdList = categoryIds.length ? categoryIds : fallbackCategoryIds;
  const createdAt = String(field(source, ['createdAt', 'createdDate']) ?? today()).slice(0, 10);
  const updatedAt = String(field(source, ['updatedAt', 'updatedDate']) ?? today()).slice(0, 10);

  return {
    id: productPublicId,
    productPublicId,
    productName: String(field(source, ['name', 'productName']) ?? ''),
    name: String(field(source, ['name', 'productName']) ?? ''),
    brand: String(field(source, ['brand']) ?? ''),
    sku: String(field(source, ['sku']) ?? ''),
    slug: String(field(source, ['slug']) ?? ''),
    categories: categoryDisplayNames.length ? categoryDisplayNames.join(', ') : categoryPublicIdList.join(', '),
    category: categoryName || categoryPublicIdList[0] || '',
    subcategory: subcategoryName || categoryPublicIdList.slice(1).join(' > '),
    categoryPublicIdList,
    featuredImage: productImageUrls(source),
    hasVariant,
    hasBatch,
    status,
    createdAt,
    updatedAt,
  };
}

export function normalizeVariant(value: unknown): AdminRecord {
  const source = (value && typeof value === 'object' ? value : {}) as ApiObject;
  const productVariantPublicId = String(field(source, ['productVariantPublicId', 'variantPublicId', 'publicId', 'id', '_id']) ?? '');
  const active = field(source, ['active', 'isActive']);
  const status = typeof active === 'boolean' ? (active ? 'Active' : 'Inactive') : String(field(source, ['status']) ?? 'Active');

  return {
    id: productVariantPublicId,
    productVariantPublicId,
    variantName: String(field(source, ['variantName', 'name']) ?? ''),
    images: imageUrls(source),
    mrp: toNumber(field(source, ['mrp'])),
    sellingPrice: toNumber(field(source, ['sellingPrice'])),
    stockQuantity: toNumber(field(source, ['stockQuantity', 'stock'])),
    measuringUnit: String(field(source, ['measuringUnit', 'unit']) ?? ''),
    amount: toNumber(field(source, ['amount'])),
    status,
    createdAt: String(field(source, ['createdAt', 'createdDate']) ?? today()).slice(0, 10),
    updatedAt: String(field(source, ['updatedAt', 'updatedDate']) ?? today()).slice(0, 10),
  };
}

export function normalizeBatch(value: unknown): AdminRecord {
  const source = (value && typeof value === 'object' ? value : {}) as ApiObject;
  const productBatchPublicId = String(field(source, ['productBatchPublicId', 'batchPublicId', 'publicId', 'id', '_id']) ?? '');
  const active = field(source, ['active', 'isActive']);
  const status = typeof active === 'boolean' ? (active ? 'Active' : 'Inactive') : String(field(source, ['status']) ?? 'Active');

  return {
    id: productBatchPublicId,
    productBatchPublicId,
    name: String(field(source, ['name']) ?? ''),
    batchNumber: String(field(source, ['batchNumber']) ?? ''),
    lotNumber: String(field(source, ['lotNumber']) ?? ''),
    barcode: String(field(source, ['barcode']) ?? ''),
    supplierName: String(field(source, ['supplierName']) ?? ''),
    manufacturingDate: String(field(source, ['manufacturingDate']) ?? '').slice(0, 10),
    expiryDate: String(field(source, ['expiryDate']) ?? '').slice(0, 10),
    availableQuantity: toNumber(field(source, ['availableQuantity'])),
    mrp: toNumber(field(source, ['mrp'])),
    sellingPrice: toNumber(field(source, ['sellingPrice'])),
    status,
    createdAt: String(field(source, ['createdAt', 'createdDate']) ?? today()).slice(0, 10),
    updatedAt: String(field(source, ['updatedAt', 'updatedDate']) ?? today()).slice(0, 10),
  };
}

function normalizeList(response: unknown): AdminRecord[] {
  const data = unwrap(response);
  if (Array.isArray(data)) return data.map(normalizeProduct).filter((record) => record.id);
  return [];
}

function normalizeVariantList(response: unknown): AdminRecord[] {
  const data = unwrap(response);
  if (Array.isArray(data)) return data.map(normalizeVariant).filter((record) => record.id);
  if (data && typeof data === 'object') {
    const variants = field(data as ApiObject, ['productVariantList', 'variantList', 'variants']);
    if (Array.isArray(variants)) return variants.map(normalizeVariant).filter((record) => record.id);
  }
  return [];
}

function normalizeBatchList(response: unknown): AdminRecord[] {
  const data = unwrap(response);
  if (Array.isArray(data)) return data.map(normalizeBatch).filter((record) => record.id);
  if (data && typeof data === 'object') {
    const batches = field(data as ApiObject, ['batchList', 'productBatchList', 'batches']);
    if (Array.isArray(batches)) return batches.map(normalizeBatch).filter((record) => record.id);
  }
  return [];
}

function batchRequestPayload(batch: ProductBatchPayload) {
  const { active, ...rest } = batch;
  return { ...rest, isActive: active };
}

export function extractVariantPublicIds(response: unknown): string[] {
  const data = unwrap(response);
  const source = (data && typeof data === 'object' ? data : {}) as ApiObject;
  const variants = Array.isArray(data) ? data : field(source, ['productVariantList', 'variantList', 'variants']);
  if (!Array.isArray(variants)) return [];
  return variants.map((variant) => {
    const variantSource = (variant && typeof variant === 'object' ? variant : {}) as ApiObject;
    return String(field(variantSource, ['productVariantPublicId', 'variantPublicId', 'publicId', 'id', '_id']) ?? '');
  }).filter(Boolean);
}

export const productApi = {
  async categories() {
    const data = unwrap(await categoryRequest<unknown>('/get-all'));
    return Array.isArray(data) ? data.map(normalizeCategoryTree).filter((category) => category.categoryPublicId) : [];
  },
  async list(options?: { filter?: ProductListFilter; categoryPublicId?: string }) {
    const params = new URLSearchParams({ filter: options?.filter ?? 'all' });
    if (options?.categoryPublicId) params.set('categoryPublicId', options.categoryPublicId);
    return normalizeList(await request<unknown>(`/get-all?${params.toString()}`));
  },
  async get(productPublicId: string) {
    return unwrap(await request<unknown>(`/get/${productPublicId}`));
  },
  async create(payload: ProductPayload) {
    return request<unknown>('/create', { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(productPublicId: string, payload: ProductPayload) {
    return request<unknown>(`/update/${productPublicId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async remove(productPublicId: string) {
    await request<unknown>(`/delete/${productPublicId}`, { method: 'DELETE' });
    return productPublicId;
  },
  async variants(productPublicId: string) {
    return normalizeVariantList(await request<unknown>(`/${productPublicId}/variant/get-all`));
  },
  async getVariant(productPublicId: string, variantPublicId: string) {
    return unwrap(await request<unknown>(`/variant/get/${variantPublicId}`));
  },
  async createVariant(productPublicId: string, payload: ProductVariantPayload) {
    return request<unknown>(`/${productPublicId}/variant/create`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateVariant(productPublicId: string, variantPublicId: string, payload: ProductVariantPayload) {
    return request<unknown>(`/variant/update/${variantPublicId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async removeVariant(productPublicId: string, variantPublicId: string) {
    await request<unknown>(`/variant/delete/${variantPublicId}`, { method: 'DELETE' });
    return variantPublicId;
  },
  async batches(productVariantPublicId: string) {
    return normalizeBatchList(await request<unknown>(`/variant/${productVariantPublicId}/batch/get-all`));
  },
  async getBatch(productBatchPublicId: string) {
    return unwrap(await request<unknown>(`/batch/get/${productBatchPublicId}`));
  },
  async createBatch(productVariantPublicId: string, payload: ProductBatchPayload) {
    return request<unknown>(`/variant/${productVariantPublicId}/batch/create`, { method: 'POST', body: JSON.stringify(batchRequestPayload(payload)) });
  },
  async removeBatch(productBatchPublicId: string) {
    await request<unknown>(`/batch/delete/${productBatchPublicId}`, { method: 'DELETE' });
    return productBatchPublicId;
  },
  async uploadVariantImages(productVariantPublicId: string, images: File[]) {
    if (!images.length) return null;
    const formData = new FormData();
    formData.append('productVariantPublicId', productVariantPublicId);
    images.slice(0, 5).forEach((image, index) => formData.append(`productImage${index + 1}`, image));
    return request<unknown>('/upload-image', { method: 'POST', body: formData });
  },
};
