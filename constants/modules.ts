import {
  BarChart3, Bell, Boxes, Building2, ClipboardList, CreditCard, Gift, ImageIcon, LayoutDashboard,
  Megaphone, Package, RefreshCcw, Settings, ShieldCheck, Star, Tags, Truck, Users
} from 'lucide-react';
import type { FieldConfig, ModuleConfig, ModuleKey } from '@/types/admin';

const status = ['Active', 'Inactive', 'Draft', 'Archived'];
const yesNo = ['Yes', 'No'];

const field = (name: string, label: string, type: FieldConfig['type'] = 'text', section = 'Details', options?: string[], required = false): FieldConfig => ({
  name, label, type, section, options, required,
});

const seo = [
  field('seoTitle', 'SEO Title', 'text', 'SEO'),
  field('seoDescription', 'SEO Description', 'textarea', 'SEO'),
  field('seoKeywords', 'SEO Keywords', 'text', 'SEO'),
];

export const modules: ModuleConfig[] = [
  {
    key: 'banners', label: 'Banners', singular: 'Banner', path: 'banners', icon: ImageIcon,
    description: 'Manage promotional banners across web and mobile storefronts.',
    statuses: status, filters: ['bannerType', 'category', 'status'], imageField: 'image',
    table: ['title', 'bannerType', 'category', 'priority', 'status', 'startDate', 'endDate'],
    fields: [
      field('title', 'Title', 'text', 'Content', undefined, true), field('subtitle', 'Subtitle', 'textarea', 'Content'),
      field('image', 'Image', 'image', 'Media', undefined, true), field('mobileImage', 'Mobile Image', 'image', 'Media'),
      field('bannerType', 'Banner Type', 'select', 'Placement', ['Hero', 'Category', 'Offer', 'Checkout'], true),
      field('redirectUrl', 'Redirect URL', 'url', 'Placement'), field('category', 'Category', 'select', 'Placement', ['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Snacks']),
      field('priority', 'Priority', 'number', 'Placement'), field('status', 'Status', 'select', 'Publishing', status),
      field('startDate', 'Start Date', 'date', 'Publishing'), field('endDate', 'End Date', 'date', 'Publishing'),
      field('buttonText', 'Button Text', 'text', 'CTA'), field('buttonUrl', 'Button URL', 'url', 'CTA'),
    ],
  },
  {
    key: 'categories', label: 'Categories', singular: 'Category', path: 'categories', icon: Tags,
    description: 'Organize catalog navigation, category imagery, and SEO metadata.',
    statuses: status, filters: ['parentCategory', 'featuredCategory', 'status'], imageField: 'thumbnail',
    table: ['categoryName', 'parentCategory', 'sortOrder', 'featuredCategory', 'showOnHome', 'status'],
    fields: [
      field('categoryName', 'Category Name', 'text', 'Basic', undefined, true), field('slug', 'Slug', 'text', 'Basic', undefined, true),
      field('parentCategory', 'Parent Category', 'select', 'Basic', ['None', 'Vegetables', 'Fruits', 'Dairy', 'Bakery']),
      field('icon', 'Icon', 'image', 'Media'), field('thumbnail', 'Thumbnail', 'image', 'Media'), field('bannerImage', 'Banner Image', 'image', 'Media'),
      field('description', 'Description', 'textarea', 'Content'), field('sortOrder', 'Sort Order', 'number', 'Visibility'),
      field('featuredCategory', 'Featured Category', 'select', 'Visibility', yesNo), field('showOnHome', 'Show on Home', 'select', 'Visibility', yesNo),
      field('showInMenu', 'Show in Menu', 'select', 'Visibility', yesNo), field('status', 'Status', 'select', 'Visibility', status), ...seo,
    ],
  },
  {
    key: 'products', label: 'Products', singular: 'Product', path: 'products', icon: Package,
    description: 'Create, duplicate, price, publish, and merchandize catalog products.',
    statuses: ['Active', 'Draft', 'Out of Stock', 'Archived'], filters: ['category', 'warehouse', 'status', 'featured'], imageField: 'featuredImage',
    table: ['productName', 'sku', 'category', 'sellingPrice', 'stockQuantity', 'warehouse', 'status'],
    fields: [
      field('productName', 'Product Name', 'text', 'Basic Information', undefined, true), field('slug', 'Slug', 'text', 'Basic Information', undefined, true),
      field('sku', 'SKU', 'text', 'Basic Information', undefined, true), field('barcode', 'Barcode', 'text', 'Basic Information'),
      field('shortDescription', 'Short Description', 'textarea', 'Basic Information'), field('fullDescription', 'Full Description', 'textarea', 'Basic Information'),
      field('category', 'Category', 'select', 'Basic Information', ['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Snacks'], true), field('subcategory', 'Subcategory', 'text', 'Basic Information'),
      field('brand', 'Brand', 'text', 'Basic Information'), field('tags', 'Tags', 'text', 'Basic Information'),
      field('sellingPrice', 'Selling Price', 'number', 'Pricing', undefined, true), field('mrp', 'MRP', 'number', 'Pricing'), field('costPrice', 'Cost Price', 'number', 'Pricing'),
      field('discountType', 'Discount Type', 'select', 'Pricing', ['Flat', 'Percentage', 'None']), field('discountValue', 'Discount Value', 'number', 'Pricing'),
      field('gst', 'GST', 'number', 'Pricing'), field('taxType', 'Tax Type', 'select', 'Pricing', ['Inclusive', 'Exclusive']),
      field('stockQuantity', 'Stock Quantity', 'number', 'Inventory'), field('minimumStockAlert', 'Minimum Stock Alert', 'number', 'Inventory'),
      field('unit', 'Unit', 'text', 'Inventory'), field('weight', 'Weight', 'text', 'Inventory'), field('dimensions', 'Dimensions', 'text', 'Inventory'),
      field('featuredImage', 'Featured Image', 'image', 'Images'), field('galleryImages', 'Gallery Images', 'images', 'Images'), field('video', 'Video', 'url', 'Images'),
      field('variantName', 'Variant Name', 'text', 'Variants'), field('variantSku', 'Variant SKU', 'text', 'Variants'), field('variantPrice', 'Variant Price', 'number', 'Variants'), field('variantStock', 'Variant Stock', 'number', 'Variants'), field('variantImage', 'Variant Image', 'image', 'Variants'),
      field('shippingRequired', 'Shipping Required', 'select', 'Shipping', yesNo), field('shippingWeight', 'Shipping Weight', 'text', 'Shipping'), field('shippingCharges', 'Shipping Charges', 'number', 'Shipping'), field('freeShipping', 'Free Shipping', 'select', 'Shipping', yesNo),
      field('status', 'Status', 'select', 'Visibility', ['Active', 'Draft', 'Out of Stock', 'Archived']), field('featured', 'Featured', 'select', 'Visibility', yesNo), field('bestSeller', 'Best Seller', 'select', 'Visibility', yesNo),
      field('trending', 'Trending', 'select', 'Visibility', yesNo), field('recommended', 'Recommended', 'select', 'Visibility', yesNo), field('newArrival', 'New Arrival', 'select', 'Visibility', yesNo),
      field('metaTitle', 'Meta Title', 'text', 'SEO'), field('metaDescription', 'Meta Description', 'textarea', 'SEO'), field('metaKeywords', 'Meta Keywords', 'text', 'SEO'), field('seoUrl', 'SEO URL', 'url', 'SEO'),
      field('deliveryTime', 'Delivery Time', 'text', 'Delivery'), field('cod', 'COD', 'select', 'Delivery', yesNo), field('returnAvailable', 'Return Available', 'select', 'Delivery', yesNo), field('returnDays', 'Return Days', 'number', 'Delivery'),
      field('vendorName', 'Vendor Name', 'text', 'Vendor'), field('commission', 'Commission', 'number', 'Vendor'), field('warehouse', 'Warehouse', 'select', 'Vendor', ['WH-AHM-01', 'WH-SRT-02', 'WH-BLR-03']),
      field('country', 'Country', 'text', 'Additional Details'), field('manufacturer', 'Manufacturer', 'text', 'Additional Details'), field('manufacturingDate', 'Manufacturing Date', 'date', 'Additional Details'), field('expiryDate', 'Expiry Date', 'date', 'Additional Details'),
      field('warranty', 'Warranty', 'text', 'Additional Details'), field('shelfLife', 'Shelf Life', 'text', 'Additional Details'), field('storageInstructions', 'Storage Instructions', 'textarea', 'Additional Details'),
      field('ingredients', 'Ingredients', 'textarea', 'Additional Details'), field('nutritionalInformation', 'Nutritional Information', 'textarea', 'Additional Details'), field('fssaiLicense', 'FSSAI License', 'text', 'Additional Details'),
      field('vegetarian', 'Vegetarian', 'select', 'Additional Details', yesNo), field('organic', 'Organic', 'select', 'Additional Details', yesNo), field('packageType', 'Package Type', 'text', 'Additional Details'), field('packSize', 'Pack Size', 'text', 'Additional Details'),
      field('maximumOrder', 'Maximum Order', 'number', 'Additional Details'), field('minimumOrder', 'Minimum Order', 'number', 'Additional Details'), field('averageRating', 'Average Rating', 'number', 'System Fields'), field('totalReviews', 'Total Reviews', 'number', 'System Fields'),
      field('visibility', 'Visibility', 'select', 'System Fields', ['Public', 'Private', 'Scheduled']), field('publishSchedule', 'Publish Schedule', 'date', 'System Fields'), field('sortOrder', 'Sort Order', 'number', 'System Fields'),
      field('createdBy', 'Created By', 'text', 'System Fields'), field('updatedBy', 'Updated By', 'text', 'System Fields'),
    ],
  },
  {
    key: 'productImages', label: 'Product Images', singular: 'Product Image', path: 'product-images', icon: Megaphone,
    description: 'Upload, preview, sort, edit, and remove catalog imagery.',
    statuses: status, filters: ['product', 'status'], imageField: 'image',
    table: ['product', 'imageType', 'sortOrder', 'altText', 'status'],
    fields: [field('product', 'Product', 'select', 'Details', ['Organic Tomato', 'Alphonso Mango', 'A2 Cow Milk'], true), field('image', 'Image', 'image', 'Media', undefined, true), field('galleryImages', 'Multiple Images', 'images', 'Media'), field('imageType', 'Image Type', 'select', 'Details', ['Featured', 'Gallery', 'Variant']), field('sortOrder', 'Sort Order', 'number', 'Details'), field('altText', 'Alt Text', 'text', 'SEO'), field('status', 'Status', 'select', 'Publishing', status)],
  },
  {
    key: 'inventory', label: 'Inventory', singular: 'Inventory Item', path: 'inventory', icon: Boxes,
    description: 'Monitor stock, low-stock alerts, transfers, and stock history.',
    statuses: ['Healthy', 'Low Stock', 'Near Expiry', 'Out of Stock'], filters: ['warehouse', 'movementType', 'status'],
    table: ['product', 'sku', 'warehouse', 'currentStock', 'availableStock', 'reorderLevel', 'status'],
    fields: [
      field('product', 'Product', 'text', 'Product', undefined, true), field('sku', 'SKU', 'text', 'Product'), field('warehouse', 'Warehouse', 'select', 'Product', ['WH-AHM-01', 'WH-SRT-02', 'WH-BLR-03']), field('variant', 'Variant', 'text', 'Product'),
      field('currentStock', 'Current Stock', 'number', 'Stock'), field('availableStock', 'Available Stock', 'number', 'Stock'), field('reservedStock', 'Reserved Stock', 'number', 'Stock'), field('damagedStock', 'Damaged Stock', 'number', 'Stock'),
      field('minimumStock', 'Minimum Stock', 'number', 'Stock'), field('maximumStock', 'Maximum Stock', 'number', 'Stock'), field('reorderLevel', 'Reorder Level', 'number', 'Stock'), field('supplier', 'Supplier', 'text', 'Procurement'),
      field('purchasePrice', 'Purchase Price', 'number', 'Procurement'), field('purchaseDate', 'Purchase Date', 'date', 'Procurement'), field('batchNumber', 'Batch Number', 'text', 'Procurement'), field('invoiceNumber', 'Invoice Number', 'text', 'Procurement'),
      field('manufacturingDate', 'Manufacturing Date', 'date', 'Shelf'), field('expiryDate', 'Expiry Date', 'date', 'Shelf'), field('shelfLife', 'Shelf Life', 'text', 'Shelf'), field('rack', 'Rack', 'text', 'Location'), field('shelf', 'Shelf', 'text', 'Location'), field('bin', 'Bin', 'text', 'Location'),
      field('movementType', 'Movement Type', 'select', 'Transaction', ['Inward', 'Outward', 'Transfer', 'Adjustment']), field('quantity', 'Quantity', 'number', 'Transaction'), field('reason', 'Reason', 'textarea', 'Transaction'), field('notes', 'Notes', 'textarea', 'Transaction'),
      field('lowStockAlert', 'Low Stock Alert', 'select', 'Alerts', yesNo), field('nearExpiryAlert', 'Near Expiry Alert', 'select', 'Alerts', yesNo), field('status', 'Status', 'select', 'Alerts', ['Healthy', 'Low Stock', 'Near Expiry', 'Out of Stock']),
    ],
  },
  {
    key: 'warehouses', label: 'Warehouses', singular: 'Warehouse', path: 'warehouses', icon: Building2,
    description: 'Manage fulfillment locations and operational status.',
    statuses: status, filters: ['status'], table: ['warehouseName', 'code', 'contactPerson', 'phone', 'status'],
    fields: [field('warehouseName', 'Warehouse Name', 'text', 'Details', undefined, true), field('code', 'Code', 'text', 'Details', undefined, true), field('address', 'Address', 'textarea', 'Details'), field('contactPerson', 'Contact Person', 'text', 'Contact'), field('phone', 'Phone', 'tel', 'Contact'), field('status', 'Status', 'select', 'Status', status)],
  },
  {
    key: 'orders', label: 'Orders', singular: 'Order', path: 'orders', icon: ClipboardList,
    description: 'Process online orders, cancellations, refunds, riders, and invoices.',
    statuses: ['Placed', 'Processing', 'Packed', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'], filters: ['status', 'payment', 'warehouse', 'deliveryPartner', 'city'],
    table: ['orderId', 'customer', 'items', 'amount', 'payment', 'status', 'delivery', 'date'],
    fields: [
      field('orderId', 'Order ID', 'text', 'Order', undefined, true), field('customer', 'Customer', 'text', 'Customer'), field('phone', 'Phone', 'tel', 'Customer'), field('address', 'Address', 'textarea', 'Customer'),
      field('items', 'Items', 'number', 'Products'), field('products', 'Products', 'textarea', 'Products'), field('amount', 'Amount', 'number', 'Payment'), field('payment', 'Payment', 'select', 'Payment', ['COD', 'UPI', 'Wallet', 'Card']),
      field('paymentStatus', 'Payment Status', 'select', 'Payment', ['Paid', 'Pending', 'Refunded']), field('summary', 'Summary', 'textarea', 'Payment'), field('invoice', 'Invoice', 'text', 'Payment'),
      field('status', 'Status', 'select', 'Tracking', ['Placed', 'Processing', 'Packed', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned']),
      field('delivery', 'Delivery', 'select', 'Tracking', ['Unassigned', 'Assigned', 'In Transit', 'Delivered']), field('trackingNumber', 'Tracking Number', 'text', 'Tracking'), field('rider', 'Rider', 'text', 'Tracking'), field('eta', 'ETA', 'text', 'Tracking'), field('liveLocation', 'Live Location Placeholder', 'text', 'Tracking'),
      field('warehouse', 'Warehouse', 'select', 'Filters', ['WH-AHM-01', 'WH-SRT-02', 'WH-BLR-03']), field('deliveryPartner', 'Delivery Partner', 'select', 'Filters', ['FreshFleet', 'QuickShip', 'HyperLocal']), field('city', 'City', 'text', 'Filters'), field('date', 'Date', 'date', 'Filters'),
    ],
  },
  {
    key: 'delivery', label: 'Delivery', singular: 'Rider', path: 'delivery', icon: Truck,
    description: 'Manage riders, order assignment, reports, and live tracking placeholders.',
    statuses: ['Available', 'Assigned', 'Offline', 'Inactive'], filters: ['status', 'zone'], table: ['riderName', 'phone', 'zone', 'assignedOrders', 'successRate', 'status'],
    fields: [field('riderName', 'Rider Name', 'text', 'Rider', undefined, true), field('phone', 'Phone', 'tel', 'Rider'), field('zone', 'Zone', 'text', 'Rider'), field('assignedOrders', 'Assigned Orders', 'number', 'Orders'), field('successRate', 'Success Rate', 'number', 'Reports'), field('liveTracking', 'Live Tracking Placeholder', 'text', 'Tracking'), field('status', 'Status', 'select', 'Status', ['Available', 'Assigned', 'Offline', 'Inactive'])],
  },
  {
    key: 'returns', label: 'Returns', singular: 'Return Request', path: 'returns', icon: RefreshCcw,
    description: 'Approve, reject, and refund return requests.',
    statuses: ['Requested', 'Approved', 'Rejected', 'Refunded'], filters: ['status', 'reason'], table: ['returnId', 'orderId', 'customer', 'amount', 'reason', 'status'],
    fields: [field('returnId', 'Return ID', 'text', 'Request', undefined, true), field('orderId', 'Order ID', 'text', 'Request'), field('customer', 'Customer', 'text', 'Request'), field('amount', 'Amount', 'number', 'Refund'), field('reason', 'Reason', 'textarea', 'Request'), field('status', 'Status', 'select', 'Status', ['Requested', 'Approved', 'Rejected', 'Refunded'])],
  },
  {
    key: 'payments', label: 'Payments', singular: 'Payment', path: 'payments', icon: CreditCard,
    description: 'Track COD, UPI, wallet, card payments, and refunds.',
    statuses: ['Paid', 'Pending', 'Failed', 'Refunded'], filters: ['method', 'status'], table: ['paymentId', 'orderId', 'customer', 'method', 'amount', 'status'],
    fields: [field('paymentId', 'Payment ID', 'text', 'Payment', undefined, true), field('orderId', 'Order ID', 'text', 'Payment'), field('customer', 'Customer', 'text', 'Payment'), field('method', 'Method', 'select', 'Payment', ['COD', 'UPI', 'Wallet', 'Card']), field('amount', 'Amount', 'number', 'Payment'), field('status', 'Status', 'select', 'Status', ['Paid', 'Pending', 'Failed', 'Refunded'])],
  },
  {
    key: 'customers', label: 'Customers', singular: 'Customer', path: 'customers', icon: Users,
    description: 'View customer details, order totals, and account status.',
    statuses: ['Active', 'Blocked', 'Inactive'], filters: ['status', 'city'], table: ['name', 'email', 'phone', 'city', 'orders', 'totalSpend', 'status'],
    fields: [field('name', 'Name', 'text', 'Profile', undefined, true), field('email', 'Email', 'email', 'Profile'), field('phone', 'Phone', 'tel', 'Profile'), field('city', 'City', 'text', 'Address'), field('orders', 'Orders', 'number', 'Stats'), field('totalSpend', 'Total Spend', 'number', 'Stats'), field('status', 'Status', 'select', 'Status', ['Active', 'Blocked', 'Inactive'])],
  },
  {
    key: 'reviews', label: 'Reviews', singular: 'Review', path: 'reviews', icon: Star,
    description: 'Moderate customer reviews, replies, hidden states, and deletion.',
    statuses: ['Published', 'Hidden', 'Flagged'], filters: ['rating', 'status'], table: ['product', 'customer', 'rating', 'review', 'status'],
    fields: [field('product', 'Product', 'text', 'Review', undefined, true), field('customer', 'Customer', 'text', 'Review'), field('rating', 'Rating', 'number', 'Review'), field('review', 'Review', 'textarea', 'Review'), field('reply', 'Reply', 'textarea', 'Moderation'), field('status', 'Status', 'select', 'Moderation', ['Published', 'Hidden', 'Flagged'])],
  },
  {
    key: 'coupons', label: 'Coupons', singular: 'Coupon', path: 'coupons', icon: Gift,
    description: 'Create and control promotional coupon campaigns.',
    statuses: status, filters: ['discountType', 'status'], table: ['code', 'discountType', 'discountValue', 'usageLimit', 'status', 'endDate'],
    fields: [field('code', 'Code', 'text', 'Coupon', undefined, true), field('discountType', 'Discount Type', 'select', 'Coupon', ['Flat', 'Percentage']), field('discountValue', 'Discount Value', 'number', 'Coupon'), field('minimumOrder', 'Minimum Order', 'number', 'Rules'), field('usageLimit', 'Usage Limit', 'number', 'Rules'), field('startDate', 'Start Date', 'date', 'Validity'), field('endDate', 'End Date', 'date', 'Validity'), field('status', 'Status', 'select', 'Status', status)],
  },
  {
    key: 'notifications', label: 'Notifications', singular: 'Notification', path: 'notifications', icon: Bell,
    description: 'Send, mark read, archive, and delete admin notifications.',
    statuses: ['Unread', 'Read', 'Archived'], filters: ['type', 'status'], table: ['title', 'type', 'audience', 'status', 'createdAt'],
    fields: [field('title', 'Title', 'text', 'Notification', undefined, true), field('message', 'Message', 'textarea', 'Notification'), field('type', 'Type', 'select', 'Notification', ['Order', 'Inventory', 'Promotion', 'System']), field('audience', 'Audience', 'select', 'Notification', ['All', 'Admins', 'Customers']), field('status', 'Status', 'select', 'Status', ['Unread', 'Read', 'Archived'])],
  },
  {
    key: 'reports', label: 'Reports', singular: 'Report', path: 'reports', icon: BarChart3,
    description: 'Sales, revenue, orders, inventory, customers, and delivery reporting.',
    statuses: ['Ready', 'Generating', 'Archived'], filters: ['reportType', 'status'], table: ['reportName', 'reportType', 'period', 'owner', 'status'],
    fields: [field('reportName', 'Report Name', 'text', 'Report', undefined, true), field('reportType', 'Report Type', 'select', 'Report', ['Sales', 'Revenue', 'Orders', 'Inventory', 'Customers', 'Delivery']), field('period', 'Period', 'text', 'Report'), field('owner', 'Owner', 'text', 'Report'), field('status', 'Status', 'select', 'Status', ['Ready', 'Generating', 'Archived'])],
  },
  {
    key: 'settings', label: 'Settings', singular: 'Setting', path: 'settings', icon: Settings,
    description: 'Configure order, delivery, cancellation, refund, return, and invoice settings.',
    statuses: ['Enabled', 'Disabled'], filters: ['group', 'status'], table: ['settingName', 'group', 'value', 'status'],
    fields: [field('settingName', 'Setting Name', 'text', 'Setting', undefined, true), field('group', 'Group', 'select', 'Setting', ['Order Settings', 'Delivery', 'Returns', 'Invoice']), field('value', 'Value', 'text', 'Setting'), field('description', 'Description', 'textarea', 'Setting'), field('status', 'Status', 'select', 'Status', ['Enabled', 'Disabled'])],
  },
];

export const dashboardNav = { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard };
export const brandIcon = ShieldCheck;
export const moduleByPath = Object.fromEntries(modules.map((module) => [module.path, module])) as Record<string, ModuleConfig>;
export const moduleByKey = Object.fromEntries(modules.map((module) => [module.key, module])) as Record<ModuleKey, ModuleConfig>;
