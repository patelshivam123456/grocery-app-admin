'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, IndianRupee, Package, ShoppingCart, Truck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/components/common/StatusChip';
import { useAppSelector } from '@/redux/hooks';
import { money } from '@/utils/format';

const chart = [42, 58, 46, 72, 66, 88, 76, 96, 84, 110, 92, 128];

export function Dashboard() {
  const records = useAppSelector((state) => state.admin.records);
  const activities = useAppSelector((state) => state.admin.activities);
  const orders = records.orders;
  const products = records.products;
  const customers = records.customers;
  const revenue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const delivered = orders.filter((order) => order.status === 'Delivered').length;
  const cancelled = orders.filter((order) => order.status === 'Cancelled').length;
  const lowStock = records.inventory.filter((item) => String(item.status).includes('Low')).length;
  const stats = [
    ['Total Revenue', money(revenue), IndianRupee, '+18.2%'],
    ["Today's Revenue", money(Math.round(revenue * 0.38)), ArrowUpRight, '+8.4%'],
    ['Orders', String(orders.length), ShoppingCart, '+12'],
    ['Products', String(products.length), Package, '+4'],
    ['Customers', String(customers.length), Users, '+9'],
    ['Pending Orders', String(orders.filter((order) => order.status !== 'Delivered').length), ArrowDownRight, '-3'],
    ['Delivered Orders', String(delivered), Truck, '+6'],
    ['Cancelled Orders', String(cancelled), AlertTriangle, '0'],
    ['Low Stock', String(lowStock), AlertTriangle, 'Needs review'],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="text-2xl font-bold tracking-normal">Commerce overview</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {stats.map(([label, value, Icon, delta]) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{value}</p>
                  <p className="mt-2 text-xs font-semibold text-primary">{delta}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader><h2 className="font-semibold">Revenue Chart</h2></CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-2">
              {chart.map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-primary" style={{ height: `${value * 1.6}px` }} />
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Sales Chart</h2></CardHeader>
          <CardContent>
            <svg viewBox="0 0 360 210" className="h-72 w-full">
              <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" points="10,160 55,120 100,138 145,76 190,92 235,44 280,70 340,24" />
              <polyline fill="none" stroke="hsl(var(--accent))" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points="10,178 55,152 100,144 145,120 190,132 235,84 280,98 340,62" />
            </svg>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><h2 className="font-semibold">Top Products</h2></CardHeader>
          <CardContent className="space-y-3">
            {products.map((product) => <Row key={product.id} title={String(product.productName)} meta={`${money(Number(product.sellingPrice || 0))} · ${product.category}`} status={String(product.status)} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Latest Orders</h2></CardHeader>
          <CardContent className="space-y-3">
            {orders.map((order) => <Row key={order.id} title={String(order.orderId)} meta={`${order.customer} · ${money(Number(order.amount || 0))}`} status={String(order.status)} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Low Stock Products</h2></CardHeader>
          <CardContent className="space-y-3">
            {records.inventory.filter((item) => String(item.status).includes('Low')).map((item) => <Row key={item.id} title={String(item.product)} meta={`${item.currentStock} units · ${item.warehouse}`} status={String(item.status)} />)}
            {activities.slice(0, 3).map((activity) => <p key={activity} className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{activity}</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ title, meta, status }: { title: string; meta: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <StatusChip status={status} />
    </div>
  );
}
