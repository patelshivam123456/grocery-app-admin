'use client';

import { useMemo, useState } from 'react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState, type VisibilityState
} from '@tanstack/react-table';
import { Archive, ArrowUpDown, Copy, Download, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import type { AdminRecord, ModuleConfig } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/common/StatusChip';
import { Pagination } from '@/components/tables/Pagination';
import { Filters } from '@/components/tables/Filters';
import { EmptyState } from '@/components/common/EmptyState';
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
};

export function DataTable({ module, data, onView, onEdit, onDelete, onDuplicate, onArchive, onStatus, onAdd }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

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
        if (module.imageField === key && typeof value === 'string') return <img src={value} alt="" className="h-10 w-10 rounded-md object-cover" />;
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
          {module.key === 'products' ? <Button variant="ghost" className="h-8 w-8 p-0" title="Duplicate" onClick={() => onDuplicate(row.original)}><Copy className="h-4 w-4" /></Button> : null}
          <Button variant="ghost" className="h-8 w-8 p-0" title="Archive" onClick={() => onArchive([row.original.id])}><Archive className="h-4 w-4" /></Button>
          <Button variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Delete" onClick={() => onDelete([row.original.id])}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [module, onArchive, onDelete, onDuplicate, onEdit, onView]);

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
    <Card className="overflow-hidden">
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
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" onChange={(event) => setColumnVisibility({ ...columnVisibility, [event.target.value]: !table.getColumn(event.target.value)?.getIsVisible() })}>
            <option value="">Columns</option>
            {module.table.map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button className="hidden sm:inline-flex" onClick={onAdd}>Add {module.singular}</Button>
          <Button className="h-10 w-10 p-0 sm:hidden" onClick={onAdd}><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>
      {filteredData.length ? (
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
    </Card>
  );
}
