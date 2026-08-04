import type { LucideIcon } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'radio' | 'date' | 'boolean' | 'image' | 'images' | 'url' | 'email' | 'tel';
export type AdminValue = string | number | boolean | string[];
export type AdminRecord = { id: string; createdAt: string; updatedAt: string } & Record<string, AdminValue>;

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  disabled?: boolean;
  options?: string[];
  section?: string;
  placeholder?: string;
};

export type ModuleKey =
  | 'banners' | 'categories' | 'products' | 'productImages' | 'inventory' | 'warehouses'
  | 'orders' | 'delivery' | 'returns' | 'payments' | 'customers' | 'reviews' | 'coupons'
  | 'notifications' | 'reports' | 'settings';

export type ModuleConfig = {
  key: ModuleKey;
  label: string;
  singular: string;
  path: string;
  icon: LucideIcon;
  description: string;
  fields: FieldConfig[];
  table: string[];
  statuses: string[];
  filters: string[];
  imageField?: string;
  lockedActions?: string[];
};

export type ConfirmationAction = 'delete' | 'bulkDelete' | 'status' | 'cancel' | 'refund' | 'transfer' | 'archive' | 'deactivate';
