import type { AdminRecord, ModuleKey } from '@/types/admin';
import { mockData } from '@/services/mockData';

const delay = () => new Promise((resolve) => setTimeout(resolve, 220));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let db = clone(mockData);

export const mockApi = {
  async list(module: ModuleKey) {
    await delay();
    return clone(db[module]);
  },
  async create(module: ModuleKey, record: AdminRecord) {
    await delay();
    db = { ...db, [module]: [record, ...db[module]] };
    return clone(record);
  },
  async update(module: ModuleKey, record: AdminRecord) {
    await delay();
    db = { ...db, [module]: db[module].map((item) => (item.id === record.id ? record : item)) };
    return clone(record);
  },
  async remove(module: ModuleKey, ids: string[]) {
    await delay();
    db = { ...db, [module]: db[module].filter((item) => !ids.includes(item.id)) };
    return ids;
  },
};
