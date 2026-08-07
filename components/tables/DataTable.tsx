'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState, type VisibilityState
} from '@tanstack/react-table';
import { Archive, ArrowUpDown, Boxes, ChevronLeft, ChevronRight, Columns3, Copy, Download, Edit, Eye, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import type { AdminRecord, AdminValue, ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/modals/Modal';
import { StatusChip } from '@/components/common/StatusChip';
import { Pagination } from '@/components/tables/Pagination';
import { Filters } from '@/components/tables/Filters';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonRows } from '@/components/common/Skeleton';
import { readable } from '@/utils/format';

type Props = {
  module: ModuleConfig;
  data: AdminRecord[];
  onView: (record: AdminRecord) => void;
  onEdit: (record: AdminRecord) => void;
  onDelete: (ids: string[]) => void;
  onDuplicate: (record: AdminRecord) => void;
  onArchive: (ids: string[]) => void;
  onStatus: (ids: string[], status: string) => void;
  onAdd: () => void;
  onAddSubCategory?: (record: AdminRecord) => void;
  onVariants?: (record: AdminRecord) => void;
  onBatches?: (record: AdminRecord) => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
};

type ImagePreviewState = {
  images: string[];
  index: number;
  title: string;
};

export function DataTable({ module, data, onView, onEdit, onDelete, onDuplicate, onArchive, onStatus, onAdd, onAddSubCategory, onVariants, onBatches, onRetry, loading, error }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnQuery, setColumnQuery] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);

  const openImagePreview = useCallback((images: string[], title: string) => {
    if (!images.length) return;
    setImagePreview({ images, title, index: 0 });
  }, []);

  const filteredData = useMemo(() => data.filter((record) => {
    const matchesSearch = JSON.stringify(record).toLowerCase().includes(query.toLowerCase());
    const matchesFilters = Object.entries(filters).every(([key, value]) => !value || readable(record[key]) === value);
    return matchesSearch && matchesFilters;
  }), [data, filters, query]);

  const columns = useMemo<ColumnDef<AdminRecord>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
    },
    ...module.table.map((key): ColumnDef<AdminRecord> => ({
      accessorKey: key,
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {module.fields.find((field) => field.name === key)?.label ?? key}
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.original[key];
        if (key.toLowerCase().includes('status') && typeof value === 'string') return <StatusChip status={value} />;
        if (module.imageField === key) {
          const images = imageValues(value);
          return <ImageCell images={images} title={readable(row.original.variantName ?? row.original.name ?? row.original.productName)} onOpen={openImagePreview} />;
        }
        return <span className="line-clamp-2">{readable(value)}</span>;
      },
    })),
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="h-8 w-8 p-0" title="View" onClick={() => onView(row.original)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" className="h-8 w-8 p-0" title="Edit" onClick={() => onEdit(row.original)}><Edit className="h-4 w-4" /></Button>
          {module.key === 'categories' && onAddSubCategory ? <Button variant="ghost" className="h-8 w-8 p-0" title="Add Sub Category" onClick={() => onAddSubCategory(row.original)}><Plus className="h-4 w-4" /></Button> : null}
          {module.key === 'products' && onVariants ? <Button variant="ghost" className="h-8 w-8 p-0" title="Variants" onClick={() => onVariants(row.original)}><Boxes className="h-4 w-4" /></Button> : null}
          {module.key === 'products' && onBatches ? <Button variant="ghost" className="h-8 w-8 p-0" title="Batches" onClick={() => onBatches(row.original)}><Boxes className="h-4 w-4" /></Button> : null}
          {module.label === 'Products' && !onVariants ? <Button variant="ghost" className="h-8 w-8 p-0" title="Duplicate" onClick={() => onDuplicate(row.original)}><Copy className="h-4 w-4" /></Button> : null}
          <Button variant="ghost" className="h-8 w-8 p-0" title="Archive" onClick={() => onArchive([row.original.id])}><Archive className="h-4 w-4" /></Button>
          <Button variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Delete" onClick={() => onDelete([row.original.id])}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [module, onAddSubCategory, onArchive, onBatches, onDelete, onDuplicate, onEdit, onVariants, onView, openImagePreview]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });
  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
  const searchableColumns = module.table.filter((key) => {
    const label = module.fields.find((field) => field.name === key)?.label ?? key;
    return label.toLowerCase().includes(columnQuery.toLowerCase()) || key.toLowerCase().includes(columnQuery.toLowerCase());
  });
  const visibleModuleColumns = module.table.filter((key) => table.getColumn(key)?.getIsVisible());
  const allModuleColumnsVisible = visibleModuleColumns.length === module.table.length;
  const noModuleColumnsVisible = visibleModuleColumns.length === 0;

  const setModuleColumnsVisible = (visible: boolean) => {
    setColumnVisibility({
      ...columnVisibility,
      ...Object.fromEntries(module.table.map((key) => [key, visible])),
    });
  };

  const toggleColumn = (key: string) => {
    const column = table.getColumn(key);
    if (!column) return;
    setColumnVisibility({ ...columnVisibility, [key]: !column.getIsVisible() });
  };

  const exportCsv = () => {
    const headers = module.table.join(',');
    const rows = filteredData.map((record) => module.table.map((key) => `"${readable(record[key]).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${module.path}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-visible">
      <Filters module={module} query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <div className="flex flex-wrap gap-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" onChange={(event) => event.target.value && onStatus(selectedIds, event.target.value)} disabled={!selectedIds.length}>
            <option value="">Status change</option>
            {module.statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <Button variant="outline" disabled={!selectedIds.length} onClick={() => onDelete(selectedIds)}><Trash2 className="h-4 w-4" /> Bulk Delete</Button>
          <Button variant="outline" disabled={!selectedIds.length} onClick={() => onArchive(selectedIds)}><Archive className="h-4 w-4" /> Archive</Button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="outline" type="button" onClick={() => setColumnsOpen((current) => !current)}>
              <Columns3 className="h-4 w-4" /> Columns
            </Button>
            {columnsOpen ? (
              <div className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-border bg-card p-2 shadow-panel">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring transition focus:ring-2"
                    placeholder="Search columns"
                    value={columnQuery}
                    onChange={(event) => setColumnQuery(event.target.value)}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                  <input type="checkbox" checked={allModuleColumnsVisible} onChange={() => setModuleColumnsVisible(!allModuleColumnsVisible)} />
                  <span>Select All</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                  <input type="checkbox" checked={noModuleColumnsVisible} onChange={() => setModuleColumnsVisible(false)} />
                  <span>Remove All</span>
                </label>
                <div className="my-1 border-t border-border" />
                <div className="max-h-56 overflow-auto">
                  {searchableColumns.length ? searchableColumns.map((key) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <input type="checkbox" checked={Boolean(table.getColumn(key)?.getIsVisible())} onChange={() => toggleColumn(key)} />
                      <span>{module.fields.find((field) => field.name === key)?.label ?? key}</span>
                    </label>
                  )) : <div className="px-2 py-3 text-sm text-muted-foreground">No columns found</div>}
                </div>
              </div>
            ) : null}
          </div>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button className="hidden sm:inline-flex" onClick={onAdd}>Add {module.singular}</Button>
          <Button className="h-10 w-10 p-0 sm:hidden" onClick={onAdd}><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>
      {loading ? (
        <div className="p-4"><SkeletonRows /></div>
      ) : error ? (
        <div className="p-4"><EmptyState title={error} actionLabel={onRetry ? 'Retry' : undefined} onAction={onRetry} /></div>
      ) : filteredData.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>{group.headers.map((header) => <th className="px-3 py-3" key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => <td className="px-3 py-3 align-middle" key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="p-4"><EmptyState title={`No ${module.label.toLowerCase()} found`} actionLabel={`Add ${module.singular}`} onAction={onAdd} /></div>}
      <Pagination page={table.getState().pagination.pageIndex} pageCount={table.getPageCount()} onPage={table.setPageIndex} />
      <ImagePreviewModal preview={imagePreview} onChange={setImagePreview} onClose={() => setImagePreview(null)} />
    </Card>
  );
}

function imageValues(value: AdminValue | undefined) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function ImageCell({ images, title, onOpen }: { images: string[]; title: string; onOpen: (images: string[], title: string) => void }) {
  if (!images.length) return <span className="text-muted-foreground">-</span>;
  return (
    <button
      type="button"
      className="group relative h-12 w-12 overflow-hidden rounded-md border border-border bg-muted"
      title="View images"
      onClick={() => onOpen(images, title)}
    >
      <img src={images[0]} alt={title} className="h-full w-full object-cover transition group-hover:scale-105" />
      {images.length > 1 ? (
        <span className="absolute bottom-1 right-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          +{images.length - 1}
        </span>
      ) : null}
    </button>
  );
}

function ImagePreviewModal({
  preview,
  onChange,
  onClose,
}: {
  preview: ImagePreviewState | null;
  onChange: (preview: ImagePreviewState) => void;
  onClose: () => void;
}) {
  const image = preview?.images[preview.index] ?? '';
  const count = preview?.images.length ?? 0;
  const previous = () => {
    if (!preview) return;
    onChange({ ...preview, index: (preview.index - 1 + preview.images.length) % preview.images.length });
  };
  const next = () => {
    if (!preview) return;
    onChange({ ...preview, index: (preview.index + 1) % preview.images.length });
  };

  return (
    <Modal open={Boolean(preview)} title={preview?.title || 'Image Preview'} onClose={onClose}>
      {preview ? (
        <div className="space-y-4">
          <div className="relative flex min-h-[320px] items-center justify-center rounded-md bg-muted">
            <img src={image} alt={preview.title} className="max-h-[65vh] w-full rounded-md object-contain" />
            {count > 1 ? (
              <>
                <Button type="button" variant="outline" className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-card/90 p-0" onClick={previous}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button type="button" variant="outline" className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-card/90 p-0" onClick={next}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            ) : null}
          </div>
          {count > 1 ? (
            <div className="flex items-center justify-center gap-2">
              {preview.images.map((previewImage, index) => (
                <button
                  key={`${previewImage}-${index}`}
                  type="button"
                  className={`h-14 w-14 overflow-hidden rounded-md border ${index === preview.index ? 'border-primary ring-2 ring-ring' : 'border-border'}`}
                  onClick={() => onChange({ ...preview, index })}
                >
                  <img src={previewImage} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
