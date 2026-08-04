'use client';

import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ImageUpload({
  value,
  multiple,
  onChange,
  disabled,
  maxFiles,
  fileMode,
}: {
  value: string | string[] | undefined;
  multiple?: boolean;
  onChange: (value: string | string[] | File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  fileMode?: boolean;
}) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = (files: FileList | null) => {
    if (disabled) return;
    if (!files?.length) return;
    const selectedFiles = Array.from(files).slice(0, maxFiles ? Math.max(maxFiles - values.length, 0) : undefined);
    if (fileMode) {
      onChange(selectedFiles);
      return;
    }
    const readers = selectedFiles.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    }));
    void Promise.all(readers).then((images) => onChange(multiple ? [...values, ...images].slice(0, maxFiles) : images[0] ?? ''));
  };

  const remove = (image: string) => {
    const next = values.filter((item) => item !== image);
    onChange(multiple ? next : '');
  };

  return (
    <div className="space-y-3">
      <label className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/35 p-4 text-center text-sm text-muted-foreground transition ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:bg-muted'}`}>
        <ImagePlus className="h-6 w-6" />
        <span>{multiple ? 'Drop or choose multiple images' : 'Drop or choose image'}</span>
        <input className="hidden" type="file" accept="image/*" multiple={multiple} disabled={disabled} onChange={(event) => handleFiles(event.target.files)} />
      </label>
      {values.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {values.map((image, index) => (
            <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
              <img src={image} alt="" className="h-full w-full object-cover" />
              {disabled ? null : (
                <Button type="button" variant="danger" className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={() => remove(image)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
