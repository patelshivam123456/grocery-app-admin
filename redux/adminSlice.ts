import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AdminRecord, ModuleKey } from '@/types/admin';
import { mockData } from '@/services/mockData';

type AdminState = {
  records: Record<ModuleKey, AdminRecord[]>;
  loading: boolean;
  error: string | null;
  activities: string[];
};

const initialState: AdminState = {
  records: mockData,
  loading: false,
  error: null,
  activities: ['Dashboard refreshed', 'Inventory audit completed', 'Rider assignment rules updated'],
};

const stamp = () => new Date().toISOString().slice(0, 10);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setModuleRecords(state, action: PayloadAction<{ module: ModuleKey; records: AdminRecord[] }>) {
      state.records[action.payload.module] = action.payload.records;
    },
    createRecord(state, action: PayloadAction<{ module: ModuleKey; record: AdminRecord }>) {
      state.records[action.payload.module].unshift(action.payload.record);
      state.activities.unshift(`Created ${action.payload.record.id}`);
    },
    updateRecord(state, action: PayloadAction<{ module: ModuleKey; record: AdminRecord }>) {
      state.records[action.payload.module] = state.records[action.payload.module].map((record) => (
        record.id === action.payload.record.id ? { ...action.payload.record, updatedAt: stamp() } : record
      ));
      state.activities.unshift(`Updated ${action.payload.record.id}`);
    },
    upsertRecord(state, action: PayloadAction<{ module: ModuleKey; record: AdminRecord }>) {
      const exists = state.records[action.payload.module].some((record) => record.id === action.payload.record.id);
      state.records[action.payload.module] = exists
        ? state.records[action.payload.module].map((record) => (record.id === action.payload.record.id ? action.payload.record : record))
        : [action.payload.record, ...state.records[action.payload.module]];
    },
    duplicateRecord(state, action: PayloadAction<{ module: ModuleKey; id: string }>) {
      const original = state.records[action.payload.module].find((record) => record.id === action.payload.id);
      if (!original) return;
      const copy: AdminRecord = { ...original, id: `${original.id}-copy-${Date.now()}`, createdAt: stamp(), updatedAt: stamp() };
      state.records[action.payload.module].unshift(copy);
      state.activities.unshift(`Duplicated ${original.id}`);
    },
    deleteRecords(state, action: PayloadAction<{ module: ModuleKey; ids: string[] }>) {
      state.records[action.payload.module] = state.records[action.payload.module].filter((record) => !action.payload.ids.includes(record.id));
      state.activities.unshift(`Deleted ${action.payload.ids.length} record(s)`);
    },
    changeStatus(state, action: PayloadAction<{ module: ModuleKey; ids: string[]; status: string }>) {
      state.records[action.payload.module] = state.records[action.payload.module].map((record) => (
        action.payload.ids.includes(record.id) ? { ...record, status: action.payload.status, updatedAt: stamp() } : record
      ));
      state.activities.unshift(`Changed status to ${action.payload.status}`);
    },
  },
});

export const { setLoading, setModuleRecords, createRecord, updateRecord, upsertRecord, duplicateRecord, deleteRecords, changeStatus } = adminSlice.actions;
export default adminSlice.reducer;
