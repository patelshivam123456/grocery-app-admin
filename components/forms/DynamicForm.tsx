'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type { DefaultValues, Resolver } from 'react-hook-form';
import { Save } from 'lucide-react';
import type { AdminRecord, AdminValue, ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageUpload } from '@/components/forms/ImageUpload';
import { DatePickerField } from '@/components/forms/DatePickerField';
import { schemaFor } from '@/schemas/adminSchemas';

type FormValues = Record<string, AdminValue>;

export function DynamicForm({
  module,
  record,
  onSubmit,
  onCancel,
}: {
  module: ModuleConfig;
  record?: AdminRecord;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const schema = useMemo(() => schemaFor(module), [module]);
  const defaults = Object.fromEntries(module.fields.map((field) => {
    const fallback: AdminValue = field.type === 'number' ? 0 : field.type === 'images' ? [] : field.options?.[0] ?? '';
    return [field.name, record?.[field.name] ?? fallback];
  })) as FormValues;
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaults as DefaultValues<FormValues>,
  });
  const sections = module.fields.reduce<Record<string, typeof module.fields>>((groups, field) => {
    const section = field.section ?? 'Details';
    return { ...groups, [section]: [...(groups[section] ?? []), field] };
  }, {});

  const submit = (values: FormValues) => {
    setSaving(true);
    window.setTimeout(() => {
      onSubmit(values as FormValues);
      setSaving(false);
    }, 240);
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(submit)(event)}>
      {Object.entries(sections).map(([section, fields]) => (
        <Card key={section}>
          <CardContent>
            <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">{section}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {(fields ?? []).map((field) => {
                const error = errors[field.name]?.message;
                const common = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring transition focus:ring-2';
                return (
                  <label key={field.name} className={field.type === 'textarea' || field.type === 'images' ? 'md:col-span-2' : ''}>
                    <span className="mb-1.5 block text-sm font-medium">{field.label}{field.required ? ' *' : ''}</span>
                    {field.type === 'textarea' ? (
                      <textarea className={`${common} min-h-28 py-2`} {...register(field.name)} />
                    ) : field.type === 'select' ? (
                      <select className={common} {...register(field.name)}>
                        {(field.options ?? []).map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : field.type === 'image' || field.type === 'images' ? (
                      <Controller
                        control={control}
                        name={field.name}
                        render={({ field: controllerField }) => (
                          <ImageUpload value={controllerField.value as string | string[] | undefined} multiple={field.type === 'images'} onChange={controllerField.onChange} />
                        )}
                      />
                    ) : field.type === 'date' ? (
                      <Controller
                        control={control}
                        name={field.name}
                        render={({ field: controllerField }) => (
                          <DatePickerField value={typeof controllerField.value === 'string' ? controllerField.value : ''} onChange={controllerField.onChange} />
                        )}
                      />
                    ) : (
                      <input className={common} type={field.type === 'number' ? 'number' : field.type} {...register(field.name)} />
                    )}
                    {typeof error === 'string' ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save {module.singular}</Button>
      </div>
    </form>
  );
}
