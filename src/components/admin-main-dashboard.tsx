
'use client';
import { useState, useEffect } from 'react';
import { collection, collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export default function AdminMainDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const usersQuery = query(collection(firestore, 'users'));
    const ordersQuery = query(collectionGroup(firestore, 'orders'));

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, totalCustomers: snapshot.size }));
    });

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      let revenue = 0;
      snapshot.docs.forEach((doc) => {
        revenue += doc.data().totalAmount || 0;
      });
      setStats((prev) => ({
        ...prev,
        totalOrders: snapshot.size,
        totalRevenue: revenue,
      }));
    });
    
    setLoading(false);

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, [firestore]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <Skeleton className="h-8 w-3/4" />
            ) : (
                <div className="text-2xl font-bold">
                    R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                 <Skeleton className="h-8 w-1/4" />
            ) : (
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <Skeleton className="h-8 w-1/4" />
            ) : (
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
