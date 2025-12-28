
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Users } from 'lucide-react';
import ProductManagement from './admin-product-management';
import CustomerManagement from './admin-customer-management';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="w-64 bg-background p-4 flex flex-col justify-between">
        <div>
           <h2 className="font-headline text-2xl font-bold mb-8">Admin</h2>
            <nav className="flex flex-col gap-2">
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
          </nav>
        </div>
        <Button onClick={onLogout} className="w-full justify-start gap-2">
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </aside>
      <main className="flex-1 p-8">
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'customers' && <CustomerManagement />}
      </main>
    </div>
  );
}

    