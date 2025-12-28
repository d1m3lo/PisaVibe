
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Users, ShoppingCart, LayoutDashboard, TicketPercent } from 'lucide-react';
import ProductManagement from './admin-product-management';
import CustomerManagement from './admin-customer-management';
import AdminOrderManagement from './admin-order-management';
import AdminMainDashboard from './admin-main-dashboard';
import AdminCouponManagement from './admin-coupon-management';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="w-64 bg-background p-4 flex flex-col justify-between">
        <div>
           <h2 className="font-headline text-2xl font-bold mb-8">Admin</h2>
            <nav className="flex flex-col gap-2">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'products' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('products')}
            >
              <Package className="h-5 w-5" />
              Produtos
            </Button>
             <Button
              variant={activeTab === 'customers' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('customers')}
            >
              <Users className="h-5 w-5" />
              Clientes
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart className="h-5 w-5" />
              Pedidos
            </Button>
             <Button
              variant={activeTab === 'coupons' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('coupons')}
            >
              <TicketPercent className="h-5 w-5" />
              Cupons
            </Button>
          </nav>
        </div>
        <Button onClick={onLogout} className="w-full justify-start gap-2">
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </aside>
      <main className="flex-1 p-8">
        {activeTab === 'dashboard' && <AdminMainDashboard />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'orders' && <AdminOrderManagement />}
        {activeTab === 'coupons' && <AdminCouponManagement />}
      </main>
    </div>
  );
}
