import { format } from 'date-fns';
import type { AdminValue } from '@/types/admin';

export function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function shortDate(value: AdminValue | undefined) {
  if (!value || typeof value === 'boolean') return '-';
  const date = new Date(Array.isArray(value) ? value[0] : value);
  return Number.isNaN(date.getTime()) ? String(value) : format(date, 'dd MMM yyyy');
}

export function readable(value: AdminValue | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === undefined || value === '') return '-';
  return String(value);
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
