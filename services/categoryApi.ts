import type { AdminRecord, AdminValue } from '@/types/admin';
import { apiCaller } from '@/services/apiCaller';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const CATEGORY_API_PATH = '/e-comm-admin/category/v1';

type CategoryPayload = {
  categoryPublicId?: string;
  categoryName: string;
  categoryDescription: string;
  isActive?: boolean;
  categoryIconUrl?: string;
  tags: string;
  parentCategoryPublicId?: string;
  subCategoryDtoList?: string[];
};

type ApiObject = Record<string, unknown>;

const today = () => new Date().toISOString().slice(0, 10);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('Category API base URL is not configured.');
  return apiCaller<T>(`${CATEGORY_API_PATH}${path}`, { ...init, baseUrl: API_BASE });
}

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const data = value as ApiObject;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.categories)) return data.categories;
  if (data.data && typeof data.data === 'object') return data.data;
  if (data.result && typeof data.result === 'object') return data.result;
  if (data.category && typeof data.category === 'object') return data.category;
  return data;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function field(source: ApiObject, names: string[]): unknown {
  return names.map((name) => source[name]).find((value) => value !== undefined && value !== null);
}

export function normalizeCategory(value: unknown): AdminRecord {
  const source = (value && typeof value === 'object' ? value : {}) as ApiObject;
  const categoryPublicId = String(field(source, ['categoryPublicId', 'publicId', 'id', '_id']) ?? '');
  const isActive = field(source, ['isActive', 'active']);
  const status = typeof isActive === 'boolean' ? (isActive ? 'Active' : 'Inactive') : String(field(source, ['status']) ?? 'Active');
  const icon = String(field(source, ['categoryIconUrl', 'icon', 'thumbnail']) ?? '');
  const createdAt = String(field(source, ['createdAt', 'createdDate']) ?? today()).slice(0, 10);
  const updatedAt = String(field(source, ['updatedAt', 'updatedDate']) ?? today()).slice(0, 10);
  const tags = toStringArray(field(source, ['tags', 'tag']));
  const subCategoryDtoList = field(source, ['subCategoryDtoList', 'children', 'subCategories']);

  return {
    id: categoryPublicId,
    categoryPublicId,
    categoryName: String(field(source, ['categoryName', 'name']) ?? ''),
    categoryDescription: String(field(source, ['categoryDescription', 'description']) ?? ''),
    status,
    isActive: status === 'Active',
    categoryIconUrl: icon,
    tags,
    parentCategory: String(field(source, ['parentCategory', 'parentCategoryName']) ?? ''),
    parentCategoryPublicId: String(field(source, ['parentCategoryPublicId']) ?? ''),
    subCategoryDtoList: Array.isArray(subCategoryDtoList) ? subCategoryDtoList.map(normalizeCategory).filter((record) => record.id) : [],
    createdAt,
    updatedAt,
  } as unknown as AdminRecord;
}

function normalizeList(response: unknown): AdminRecord[] {
  const data = unwrap(response);
  if (Array.isArray(data)) return data.map(normalizeCategory).filter((record) => record.id);
  return [];
}

function normalizeOne(response: unknown): AdminRecord {
  return normalizeCategory(unwrap(response));
}

function tagsToPayload(value: AdminValue | undefined): string {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean).join(',');
  return String(value ?? '').split(',').map((tag) => tag.trim()).filter(Boolean).join(',');
}

export function categoryPayload(values: Record<string, AdminValue>, categoryPublicId?: string): CategoryPayload {
  const payload: CategoryPayload = {
    categoryName: String(values.categoryName ?? '').trim(),
    categoryDescription: String(values.categoryDescription ?? '').trim(),
    isActive: String(values.status) === 'Active' || values.isActive === true,
    categoryIconUrl: String(values.categoryIconUrl ?? '').trim(),
    tags: tagsToPayload(values.tags),
  };
  if (categoryPublicId) payload.categoryPublicId = categoryPublicId;
  const parentCategoryPublicId = values.parentCategoryPublicId;
  if (typeof parentCategoryPublicId === 'string' && parentCategoryPublicId) payload.parentCategoryPublicId = parentCategoryPublicId;
  return payload;
}

export function subCategoryPayload(values: Record<string, AdminValue>, parentCategoryPublicId: string): CategoryPayload {
  return {
    categoryName: String(values.subCategoryName ?? '').trim(),
    categoryDescription: String(values.subCategoryDescription ?? '').trim(),
    tags: tagsToPayload(values.subCategoryTags),
    parentCategoryPublicId,
  };
}

function dataUrlToBlob(value: string): Blob {
  const [meta, data] = value.split(',');
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? 'image/png';
  const binary = window.atob(data ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

function extractUploadedUrl(response: unknown, requireUrl: boolean): string {
  const data = unwrap(response);
  if (typeof data === 'string' && data) return data;
  const source = (data && typeof data === 'object' ? data : {}) as ApiObject;
  const direct = field(source, ['categoryIconUrl', 'iconUrl', 'url', 'location', 'secure_url']);
  if (typeof direct === 'string' && direct) return direct;
  const nested = field(source, ['categoryIcon', 'icon']);
  if (nested && typeof nested === 'object') {
    const url = field(nested as ApiObject, ['categoryIconUrl', 'url', 'location', 'secure_url']);
    if (typeof url === 'string' && url) return url;
  }
  if (!requireUrl) return '';
  throw new Error('Icon uploaded, but no category icon URL was returned.');
}

export const categoryApi = {
  async list() {
    return normalizeList(await request<unknown>('/get-all'));
  },
  async get(categoryPublicId: string) {
    return normalizeOne(await request<unknown>(`/get/${categoryPublicId}`));
  },
  async uploadIcon(iconValue: string, categoryPublicId?: string, requireUrl = true) {
    if (iconValue.trim() && !iconValue.startsWith('data:')) return iconValue;
    const formData = new FormData();
    if (categoryPublicId) formData.append('categoryPublicId', categoryPublicId);
    if (iconValue.startsWith('data:')) {
      formData.append('categoryIcon', dataUrlToBlob(iconValue), 'category-icon.png');
    }
    return extractUploadedUrl(await request<unknown>('/upload-icon', { method: 'POST', body: formData }), requireUrl);
  },
  async create(payload: CategoryPayload) {
    const response = await request<unknown>('/create', { method: 'POST', body: JSON.stringify(payload) });
    return { ...payload, ...normalizeOne(response) };
  },
  async createSubCategory(payload: CategoryPayload) {
    return normalizeOne(await request<unknown>('/create', { method: 'POST', body: JSON.stringify(payload) }));
  },
  async update(categoryPublicId: string, payload: CategoryPayload) {
    const response = await request<unknown>(`/update/${categoryPublicId}`, { method: 'PUT', body: JSON.stringify(payload) });
    return { ...payload, ...normalizeOne(response), id: categoryPublicId, categoryPublicId };
  },
  async remove(categoryPublicId: string) {
    await request<unknown>(`/delete/${categoryPublicId}`, { method: 'DELETE' });
    return categoryPublicId;
  },
};
