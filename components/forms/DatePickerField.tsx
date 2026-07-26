'use client';

import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Button } from '@/components/ui/Button';

export function DatePickerField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  return (
    <div className="relative">
      <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setOpen((current) => !current)}>
        <CalendarDays className="h-4 w-4" />
        {selected ? format(selected, 'dd MMM yyyy') : 'Select date'}
      </Button>
      {open ? (
        <div className="absolute z-20 mt-2 rounded-lg border border-border bg-card p-2 shadow-panel">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
