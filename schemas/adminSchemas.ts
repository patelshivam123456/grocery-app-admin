import { z } from 'zod';
import type { FieldConfig, ModuleConfig } from '@/types/admin';

const valueSchema = (field: FieldConfig) => {
  if (field.type === 'number') return z.coerce.number().min(0, `${field.label} must be zero or more`);
  if (field.type === 'images') return z.array(z.string()).default([]);
  if (field.required) return z.string().min(1, `${field.label} is required`);
  return z.union([z.string(), z.boolean(), z.array(z.string())]).optional();
};

export function schemaFor(module: ModuleConfig) {
  return z.object(Object.fromEntries(module.fields.map((field) => [field.name, valueSchema(field)])));
}
