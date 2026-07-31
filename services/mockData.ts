import type { AdminRecord, ModuleKey } from '@/types/admin';

const now = '2026-07-23';
const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
const base = (id: string) => ({ id, createdAt: now, updatedAt: now });

export const mockData: Record<ModuleKey, AdminRecord[]> = {
  banners: [
    { ...base('ban-1'), title: 'Fresh Harvest Weekend', subtitle: 'Premium produce at doorstep speed.', image: image('photo-1542838132-92c53300491e'), mobileImage: image('photo-1506806732259-39c2d0268443'), bannerType: 'Hero', redirectUrl: '/collections/fresh', category: 'Vegetables', priority: 1, status: 'Active', startDate: '2026-07-01', endDate: '2026-08-15', buttonText: 'Shop fresh', buttonUrl: '/products' },
    { ...base('ban-2'), title: 'Dairy Essentials', subtitle: 'Milk, curd, paneer and butter.', image: image('photo-1628088062854-d1870b4553da'), mobileImage: image('photo-1550583724-b2692b85b150'), bannerType: 'Category', redirectUrl: '/categories/dairy', category: 'Dairy', priority: 2, status: 'Draft', startDate: '2026-07-20', endDate: '2026-08-20', buttonText: 'Browse dairy', buttonUrl: '/categories/dairy' },
  ],
  categories: [
    { ...base('cat-1'), categoryName: 'Vegetables', slug: 'vegetables', parentCategory: 'None', icon: image('photo-1518843875459-f738682238a6'), thumbnail: image('photo-1566385101042-1a0aa0c1268c'), bannerImage: image('photo-1540420773420-3366772f4999'), description: 'Daily fresh vegetables.', sortOrder: 1, featuredCategory: 'Yes', showOnHome: 'Yes', showInMenu: 'Yes', status: 'Active', seoTitle: 'Fresh Vegetables', seoDescription: 'Buy fresh vegetables online.', seoKeywords: 'vegetables,grocery' },
    { ...base('cat-2'), categoryName: 'Fruits', slug: 'fruits', parentCategory: 'None', icon: image('photo-1619566636858-adf3ef46400b'), thumbnail: image('photo-1619566636858-adf3ef46400b'), bannerImage: image('photo-1519996529931-28324d5a630e'), description: 'Seasonal fruits.', sortOrder: 2, featuredCategory: 'Yes', showOnHome: 'Yes', showInMenu: 'Yes', status: 'Active', seoTitle: 'Fresh Fruits', seoDescription: 'Seasonal fruit delivery.', seoKeywords: 'fruits,grocery' },
  ],
  products: [
    { ...base('prd-1'), productName: 'Organic Tomato', slug: 'organic-tomato', sku: 'FD-VEG-TOM-500', barcode: '890100000001', shortDescription: 'Firm organic tomatoes.', fullDescription: 'Farm sourced tomatoes for daily cooking.', category: 'Vegetables', subcategory: 'Fresh Vegetables', brand: 'Just Harvst', tags: 'organic,tomato', sellingPrice: 38, mrp: 48, costPrice: 24, discountType: 'Flat', discountValue: 10, gst: 5, taxType: 'Inclusive', stockQuantity: 84, minimumStockAlert: 25, unit: '500 g', weight: '500 g', dimensions: '12 x 8 x 5 cm', featuredImage: image('photo-1592924357228-91a4daadcfea'), galleryImages: [image('photo-1566385101042-1a0aa0c1268c')], video: '', variantName: '500 g pack', variantSku: 'FD-VEG-TOM-500-A', variantPrice: 38, variantStock: 84, variantImage: image('photo-1592924357228-91a4daadcfea'), shippingRequired: 'Yes', shippingWeight: '0.5 kg', shippingCharges: 0, freeShipping: 'Yes', status: 'Active', featured: 'Yes', bestSeller: 'Yes', trending: 'No', recommended: 'Yes', newArrival: 'No', metaTitle: 'Organic Tomato', metaDescription: 'Fresh organic tomatoes.', metaKeywords: 'tomato,organic', seoUrl: '/products/organic-tomato', deliveryTime: '10 min', cod: 'Yes', returnAvailable: 'No', returnDays: 0, vendorName: 'Green Valley Farms', commission: 8, warehouse: 'WH-AHM-01', country: 'India', manufacturer: 'Green Valley Farms', manufacturingDate: '2026-07-20', expiryDate: '2026-07-29', warranty: 'NA', shelfLife: '7 days', storageInstructions: 'Keep refrigerated.', ingredients: 'Tomato', nutritionalInformation: 'Rich in lycopene.', fssaiLicense: '10012022000101', vegetarian: 'Yes', organic: 'Yes', packageType: 'Pouch', packSize: '500 g', maximumOrder: 10, minimumOrder: 1, averageRating: 4.6, totalReviews: 142, visibility: 'Public', publishSchedule: '2026-07-23', sortOrder: 1, createdBy: 'Admin', updatedBy: 'Admin' },
    { ...base('prd-2'), productName: 'A2 Cow Milk', slug: 'a2-cow-milk', sku: 'FD-DRY-MILK-500', barcode: '890100000002', shortDescription: 'Fresh A2 cow milk.', fullDescription: 'Pasteurized A2 milk delivered cold.', category: 'Dairy', subcategory: 'Milk', brand: 'Just Harvst Dairy', tags: 'milk,dairy', sellingPrice: 44, mrp: 48, costPrice: 34, discountType: 'Flat', discountValue: 4, gst: 0, taxType: 'Inclusive', stockQuantity: 16, minimumStockAlert: 30, unit: '500 ml', weight: '500 ml', dimensions: '8 x 8 x 18 cm', featuredImage: image('photo-1563636619-e9143da7973b'), galleryImages: [image('photo-1550583724-b2692b85b150')], video: '', variantName: '500 ml pouch', variantSku: 'FD-DRY-MILK-500-A', variantPrice: 44, variantStock: 16, variantImage: image('photo-1563636619-e9143da7973b'), shippingRequired: 'Yes', shippingWeight: '0.5 kg', shippingCharges: 0, freeShipping: 'Yes', status: 'Out of Stock', featured: 'Yes', bestSeller: 'No', trending: 'Yes', recommended: 'Yes', newArrival: 'Yes', metaTitle: 'A2 Cow Milk', metaDescription: 'Fresh A2 cow milk.', metaKeywords: 'milk,dairy', seoUrl: '/products/a2-cow-milk', deliveryTime: '8 min', cod: 'Yes', returnAvailable: 'No', returnDays: 0, vendorName: 'Just Harvst Dairy', commission: 5, warehouse: 'WH-SRT-02', country: 'India', manufacturer: 'Just Harvst Dairy', manufacturingDate: '2026-07-23', expiryDate: '2026-07-25', warranty: 'NA', shelfLife: '2 days', storageInstructions: 'Refrigerate below 4C.', ingredients: 'Cow milk', nutritionalInformation: 'Calcium rich.', fssaiLicense: '10012022000102', vegetarian: 'Yes', organic: 'No', packageType: 'Pouch', packSize: '500 ml', maximumOrder: 6, minimumOrder: 1, averageRating: 4.8, totalReviews: 219, visibility: 'Public', publishSchedule: '2026-07-23', sortOrder: 2, createdBy: 'Admin', updatedBy: 'Ops' },
  ],
  productImages: [
    { ...base('img-1'), product: 'Organic Tomato', image: image('photo-1592924357228-91a4daadcfea'), galleryImages: [image('photo-1566385101042-1a0aa0c1268c'), image('photo-1542838132-92c53300491e')], imageType: 'Featured', sortOrder: 1, altText: 'Organic tomato pack', status: 'Active' },
  ],
  inventory: [
    { ...base('inv-1'), product: 'Organic Tomato', sku: 'FD-VEG-TOM-500', warehouse: 'WH-AHM-01', variant: '500 g pack', currentStock: 84, availableStock: 72, reservedStock: 10, damagedStock: 2, minimumStock: 25, maximumStock: 250, reorderLevel: 40, supplier: 'Green Valley Farms', purchasePrice: 24, purchaseDate: '2026-07-20', batchNumber: 'BT-7821', invoiceNumber: 'INV-2026-402', manufacturingDate: '2026-07-20', expiryDate: '2026-07-29', shelfLife: '7 days', rack: 'A', shelf: '2', bin: '8', movementType: 'Inward', quantity: 120, reason: 'Fresh purchase', notes: 'Quality checked.', lowStockAlert: 'No', nearExpiryAlert: 'No', status: 'Healthy' },
    { ...base('inv-2'), product: 'A2 Cow Milk', sku: 'FD-DRY-MILK-500', warehouse: 'WH-SRT-02', variant: '500 ml pouch', currentStock: 16, availableStock: 13, reservedStock: 3, damagedStock: 0, minimumStock: 30, maximumStock: 300, reorderLevel: 45, supplier: 'Just Harvst Dairy', purchasePrice: 34, purchaseDate: '2026-07-23', batchNumber: 'BT-9912', invoiceNumber: 'INV-2026-451', manufacturingDate: '2026-07-23', expiryDate: '2026-07-25', shelfLife: '2 days', rack: 'C', shelf: '1', bin: '4', movementType: 'Outward', quantity: 64, reason: 'Orders assigned', notes: 'Restock needed.', lowStockAlert: 'Yes', nearExpiryAlert: 'Yes', status: 'Low Stock' },
  ],
  warehouses: [
    { ...base('wh-1'), warehouseName: 'Ahmedabad Central', code: 'WH-AHM-01', address: 'SG Highway, Ahmedabad', contactPerson: 'Meera Joshi', phone: '+91 98765 10001', status: 'Active' },
    { ...base('wh-2'), warehouseName: 'Surat Express', code: 'WH-SRT-02', address: 'Ring Road, Surat', contactPerson: 'Arjun Patel', phone: '+91 98765 10002', status: 'Active' },
  ],
  orders: [
    { ...base('ord-1'), orderId: 'ORD-2026-1081', customer: 'Rahul Sharma', phone: '+91 98765 43210', address: '12 Green Avenue, Ahmedabad', items: 5, products: 'Organic Tomato, A2 Cow Milk, Bread', amount: 842, payment: 'UPI', paymentStatus: 'Paid', summary: 'Subtotal 802, delivery 40', invoice: 'FD-INV-1081', status: 'Processing', delivery: 'Assigned', trackingNumber: 'TRK1081', rider: 'Karan Shah', eta: '22 min', liveLocation: 'Map placeholder', warehouse: 'WH-AHM-01', deliveryPartner: 'FreshFleet', city: 'Ahmedabad', date: '2026-07-23' },
    { ...base('ord-2'), orderId: 'ORD-2026-1082', customer: 'Priya Singh', phone: '+91 98765 11111', address: '204 Market Street, Surat', items: 3, products: 'Fruits, Milk', amount: 516, payment: 'COD', paymentStatus: 'Pending', summary: 'COD order', invoice: 'FD-INV-1082', status: 'Out for Delivery', delivery: 'In Transit', trackingNumber: 'TRK1082', rider: 'Nilesh Rana', eta: '10 min', liveLocation: 'Map placeholder', warehouse: 'WH-SRT-02', deliveryPartner: 'QuickShip', city: 'Surat', date: '2026-07-23' },
  ],
  delivery: [
    { ...base('del-1'), riderName: 'Karan Shah', phone: '+91 98765 22110', zone: 'Ahmedabad West', assignedOrders: 8, successRate: 96, liveTracking: 'Live tracking placeholder', status: 'Assigned' },
    { ...base('del-2'), riderName: 'Nilesh Rana', phone: '+91 98765 22111', zone: 'Surat Central', assignedOrders: 5, successRate: 92, liveTracking: 'Live tracking placeholder', status: 'Available' },
  ],
  returns: [
    { ...base('ret-1'), returnId: 'RET-401', orderId: 'ORD-2026-1032', customer: 'Ananya Mehta', amount: 299, reason: 'Damaged package', status: 'Requested' },
  ],
  payments: [
    { ...base('pay-1'), paymentId: 'PAY-991', orderId: 'ORD-2026-1081', customer: 'Rahul Sharma', method: 'UPI', amount: 842, status: 'Paid' },
    { ...base('pay-2'), paymentId: 'PAY-992', orderId: 'ORD-2026-1082', customer: 'Priya Singh', method: 'COD', amount: 516, status: 'Pending' },
  ],
  customers: [
    { ...base('cus-1'), name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', city: 'Ahmedabad', orders: 18, totalSpend: 18420, status: 'Active' },
    { ...base('cus-2'), name: 'Priya Singh', email: 'priya@example.com', phone: '+91 98765 11111', city: 'Surat', orders: 11, totalSpend: 9320, status: 'Active' },
  ],
  reviews: [
    { ...base('rev-1'), product: 'A2 Cow Milk', customer: 'Rahul Sharma', rating: 5, review: 'Fresh and delivered cold.', reply: 'Thank you for the feedback.', status: 'Published' },
    { ...base('rev-2'), product: 'Organic Tomato', customer: 'Priya Singh', rating: 4, review: 'Good quality.', reply: '', status: 'Published' },
  ],
  coupons: [
    { ...base('cup-1'), code: 'FRESH100', discountType: 'Flat', discountValue: 100, minimumOrder: 999, usageLimit: 500, startDate: '2026-07-01', endDate: '2026-08-01', status: 'Active' },
  ],
  notifications: [
    { ...base('not-1'), title: 'Low stock alert', message: 'A2 Cow Milk is below reorder level.', type: 'Inventory', audience: 'Admins', status: 'Unread' },
    { ...base('not-2'), title: 'Order spike', message: 'Ahmedabad orders are 22% above average.', type: 'Order', audience: 'Admins', status: 'Read' },
  ],
  reports: [
    { ...base('rep-1'), reportName: 'Daily Sales', reportType: 'Sales', period: 'Today', owner: 'Finance', status: 'Ready' },
    { ...base('rep-2'), reportName: 'Inventory Health', reportType: 'Inventory', period: 'This week', owner: 'Operations', status: 'Ready' },
  ],
  settings: [
    { ...base('set-1'), settingName: 'Auto Assign Rider', group: 'Order Settings', value: 'Enabled', description: 'Automatically assigns nearest available rider.', status: 'Enabled' },
    { ...base('set-2'), settingName: 'Delivery Charges', group: 'Delivery', value: '40', description: 'Default delivery charge in INR.', status: 'Enabled' },
    { ...base('set-3'), settingName: 'Delivery Radius', group: 'Delivery', value: '8 km', description: 'Maximum serviceable radius.', status: 'Enabled' },
    { ...base('set-4'), settingName: 'OTP Verification', group: 'Order Settings', value: 'Enabled', description: 'Require OTP at delivery.', status: 'Enabled' },
    { ...base('set-5'), settingName: 'Return Days', group: 'Returns', value: '7', description: 'Default return window.', status: 'Enabled' },
    { ...base('set-6'), settingName: 'Cancellation Time', group: 'Order Settings', value: '15 min', description: 'Cancellation window after placement.', status: 'Enabled' },
    { ...base('set-7'), settingName: 'Invoice Prefix', group: 'Invoice', value: 'FD-INV', description: 'Prefix for generated invoices.', status: 'Enabled' },
  ],
};
