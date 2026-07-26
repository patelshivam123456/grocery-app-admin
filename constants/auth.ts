export type DummyUser = {
  name: string;
  email: string;
  password: string;
  role: 'Super Admin' | 'Operations Manager' | 'Inventory Manager' | 'Support Agent';
};

export type UserRole = DummyUser['role'];
export type PageAccessKey =
  | 'dashboard'
  | 'banners'
  | 'categories'
  | 'products'
  | 'product-images'
  | 'inventory'
  | 'warehouses'
  | 'orders'
  | 'delivery'
  | 'returns'
  | 'payments'
  | 'customers'
  | 'reviews'
  | 'coupons'
  | 'notifications'
  | 'reports'
  | 'settings';

export const dummyUsers: DummyUser[] = [
  { name: 'Aarav Super Admin', email: 'admin@freshdrop.test', password: 'Admin@123', role: 'Super Admin' },
  { name: 'Meera Operations', email: 'ops@freshdrop.test', password: 'Ops@123', role: 'Operations Manager' },
  { name: 'Karan Inventory', email: 'inventory@freshdrop.test', password: 'Inventory@123', role: 'Inventory Manager' },
  { name: 'Priya Support', email: 'support@freshdrop.test', password: 'Support@123', role: 'Support Agent' },
];

export const authStorageKey = 'freshdrop-admin-session';

export const roleAccess: Record<UserRole, PageAccessKey[]> = {
  'Super Admin': [
    'dashboard', 'banners', 'categories', 'products', 'product-images', 'inventory', 'warehouses',
    'orders', 'delivery', 'returns', 'payments', 'customers', 'reviews', 'coupons', 'notifications',
    'reports', 'settings',
  ],
  'Operations Manager': [
    'dashboard', 'banners', 'categories', 'products', 'orders', 'delivery', 'returns', 'payments',
    'customers', 'reviews', 'coupons', 'notifications', 'reports', 'settings',
  ],
  'Inventory Manager': [
    'dashboard', 'categories', 'products', 'product-images', 'inventory', 'warehouses', 'reports',
    'notifications', 'settings',
  ],
  'Support Agent': [
    'dashboard', 'orders', 'delivery', 'returns', 'payments', 'customers', 'reviews', 'notifications',
  ],
};

export function authenticate(email: string, password: string) {
  return dummyUsers.find((user) => user.email.toLowerCase() === email.toLowerCase().trim() && user.password === password) ?? null;
}

export function canAccess(role: UserRole, page: string) {
  return roleAccess[role].includes(page as PageAccessKey);
}
