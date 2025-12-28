
'use client';
import { useState, useEffect } from 'react';
import { collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Order } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderWithId extends Order {
  id: string;
}

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const ordersQuery = query(collectionGroup(firestore, 'orders'));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          ...(doc.data() as Order),
          id: doc.id,
        }));
        // Sort orders by date, newest first
        ordersData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar pedidos',
          description: 'Não foi possível carregar os pedidos do banco de dados.',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'outline';
      default:
        return 'destructive';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Pedidos</CardTitle>
        <CardDescription>Veja todos os pedidos realizados na sua loja.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente ID</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell>{format(new Date(order.orderDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell className="font-mono text-xs">{order.userId}</TableCell>
                  <TableCell className="font-medium">
                    R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum pedido encontrado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
