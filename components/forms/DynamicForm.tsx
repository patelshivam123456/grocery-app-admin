'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type { DefaultValues, Resolver } from 'react-hook-form';
import { Save, X } from 'lucide-react';
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
  onSubmit: (values: FormValues) => boolean | void | Promise<boolean | void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const schema = useMemo(() => schemaFor(module), [module]);
  const defaults = Object.fromEntries(module.fields.map((field) => {
    const fallback: AdminValue = field.type === 'number' ? 0 : field.type === 'images' || field.type === 'multiselect' ? [] : field.options?.[0] ?? '';
    return [field.name, record?.[field.name] ?? fallback];
  })) as FormValues;
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaults as DefaultValues<FormValues>,
  });
  const sections = module.fields.reduce<Record<string, typeof module.fields>>((groups, field) => {
    const section = field.section ?? 'Details';
    return { ...groups, [section]: [...(groups[section] ?? []), field] };
  }, {});

  const submit = async (values: FormValues) => {
    setSaving(true);
    try {
      const shouldReset = await onSubmit(values as FormValues);
      if (shouldReset) reset(defaults as DefaultValues<FormValues>);
    } finally {
      setSaving(false);
    }
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
                const disabled = Boolean(field.disabled);
                return (
                  <label key={field.name} className={field.type === 'textarea' || field.type === 'images' ? 'md:col-span-2' : ''}>
                    <span className="mb-1.5 block text-sm font-medium">{field.label}{field.required ? ' *' : ''}</span>
                    {field.type === 'textarea' ? (
                      <textarea className={`${common} min-h-28 py-2 disabled:cursor-not-allowed disabled:opacity-55`} disabled={disabled} {...register(field.name)} />
                    ) : field.type === 'select' ? (
                      <select className={`${common} disabled:cursor-not-allowed disabled:opacity-55`} disabled={disabled} {...register(field.name)}>
                        {(field.options ?? []).map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : field.type === 'radio' ? (
                      <Controller
                        control={control}
                        name={field.name}
                        render={({ field: controllerField }) => (
                          <div className={`flex min-h-10 flex-wrap items-center gap-4 rounded-md border border-input bg-background px-3 py-2 ${disabled ? 'opacity-55' : ''}`}>
                            {(field.options ?? []).map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  value={option}
                                  disabled={disabled}
                                  checked={controllerField.value === option}
                                  onChange={() => controllerField.onChange(option)}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      />
                    ) : field.type === 'multiselect' ? (
                      <Controller
                        control={control}
                        name={field.name}
                        render={({ field: controllerField }) => (
                          <MultiSelect
                            options={field.options ?? []}
                            value={Array.isArray(controllerField.value) ? controllerField.value.map(String) : String(controllerField.value ?? '').split(',').map((tag) => tag.trim()).filter(Boolean)}
                            onChange={controllerField.onChange}
                            disabled={disabled}
                          />
                        )}
                      />
                    ) : field.type === 'image' || field.type === 'images' ? (
                      <Controller
                        control={control}
                        name={field.name}
                        render={({ field: controllerField }) => (
                          <ImageUpload value={controllerField.value as string | string[] | undefined} multiple={field.type === 'images'} onChange={controllerField.onChange} disabled={disabled} />
                        )}
                      />
                    ) : field.type === 'date' ? (
                      <Controller
                        control={control}
                        name={field.name}
                        render={({ field: controllerField }) => (
                          disabled ? <input className={`${common} disabled:cursor-not-allowed disabled:opacity-55`} disabled value={typeof controllerField.value === 'string' ? controllerField.value : ''} /> : <DatePickerField value={typeof controllerField.value === 'string' ? controllerField.value : ''} onChange={controllerField.onChange} />
                        )}
                      />
                    ) : (
                      <input className={`${common} disabled:cursor-not-allowed disabled:opacity-55`} disabled={disabled} type={field.type === 'number' ? 'number' : field.type} {...register(field.name)} />
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

function MultiSelect({ options, value, onChange, disabled }: { options: string[]; value: string[]; onChange: (value: string[]) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = value.filter((item) => options.includes(item));
  const filtered = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));
  const allSelected = options.length > 0 && selected.length === options.length;

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <div className="relative">
      <button
        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm outline-none ring-ring transition focus:ring-2"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        {selected.length ? (
          <span className="flex flex-wrap gap-1.5">
            {selected.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                {tag}
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (disabled) return;
                    onChange(selected.filter((item) => item !== tag));
                  }}
                  onKeyDown={(event) => {
                    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      onChange(selected.filter((item) => item !== tag));
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
          </span>
        ) : <span className="text-muted-foreground">Select tags</span>}
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card p-2 shadow-panel">
          <input
            className="mb-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring transition focus:ring-2"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
            <input type="checkbox" checked={allSelected} onChange={() => onChange(allSelected ? [] : options)} />
            <span>Select All</span>
          </label>
          <div className="max-h-40 overflow-auto">
            {filtered.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
