
'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, collectionGroup, onSnapshot, query, Timestamp, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, Package, Eye } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RevenueData {
    date: string;
    total: number;
}

export default function AdminMainDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    todayAccesses: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const usersQuery = query(collection(firestore, 'users'));
    const ordersQuery = query(collectionGroup(firestore, 'orders'));
    const productsQuery = query(collection(firestore, 'products'));

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const accessQuery = query(
      collection(firestore, 'access_logs'),
      where('timestamp', '>=', todayStart),
      where('timestamp', '<=', todayEnd)
    );

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, totalCustomers: snapshot.size }));
    });

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      let revenue = 0;
      const fetchedOrders: any[] = [];
      snapshot.docs.forEach((doc) => {
        const orderData = doc.data();
        revenue += orderData.totalAmount || 0;
        fetchedOrders.push(orderData);
      });
      setOrders(fetchedOrders);
      setStats((prev) => ({
        ...prev,
        totalOrders: snapshot.size,
        totalRevenue: revenue,
      }));
    });

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        setStats((prev) => ({ ...prev, totalProducts: snapshot.size }));
    });
    
    const unsubAccess = onSnapshot(accessQuery, (snapshot) => {
        setStats((prev) => ({...prev, todayAccesses: snapshot.size }));
    });

    // Simulating loading finish
    const timer = setTimeout(() => setLoading(false), 1500);

    return () => {
      unsubUsers();
      unsubOrders();
      unsubProducts();
      unsubAccess();
      clearTimeout(timer);
    };
  }, [firestore]);

  const weeklyRevenueData = useMemo((): RevenueData[] => {
    const data: { [key: string]: number } = {};
    const today = startOfDay(new Date());

    // Initialize last 7 days with 0 revenue
    for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        const formattedDate = format(date, 'dd/MM');
        data[formattedDate] = 0;
    }

    orders.forEach(order => {
        const orderDate = startOfDay(new Date(order.orderDate));
        if (orderDate >= subDays(today, 6)) { // Filter for last 7 days
            const formattedDate = format(orderDate, 'dd/MM');
            if (data[formattedDate] !== undefined) {
                 data[formattedDate] += order.totalAmount;
            }
        }
    });

    return Object.keys(data).map(date => ({
        date,
        total: data[date]
    })).reverse(); // Reverse to have the oldest day first

  }, [orders]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <Skeleton className="h-8 w-1/4" />
            ) : (
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acessos Hoje</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <Skeleton className="h-8 w-1/4" />
            ) : (
                <div className="text-2xl font-bold">{stats.todayAccesses}</div>
            )}
          </CardContent>
        </Card>
      </div>

       <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Receita nos últimos 7 dias</CardTitle>
                    <CardDescription>
                       Um resumo das vendas diárias na última semana.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                   {loading ? (
                     <Skeleton className="h-[350px] w-full" />
                   ) : (
                     <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={weeklyRevenueData}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--secondary))' }}
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))'
                                }}
                                 formatter={(value: number) => [
                                    `R$ ${value.toFixed(2).replace('.', ',')}`,
                                    'Receita'
                                ]}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                   )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
