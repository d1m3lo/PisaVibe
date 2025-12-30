
'use client';
import React, { useState, useEffect } from 'react';
import { collectionGroup, onSnapshot, query, getDocs, writeBatch } from 'firebase/firestore';
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
import Image from 'next/image';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Separator } from './ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface OrderWithId extends Order {
  id: string;
}

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleClearAllOrders = async () => {
    if (!firestore || orders.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum pedido para apagar',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const ordersQuery = query(collectionGroup(firestore, 'orders'));
      const querySnapshot = await getDocs(ordersQuery);
      
      if (querySnapshot.empty) {
        toast({ title: 'Tudo limpo!', description: 'Não havia pedidos para remover.' });
        return;
      }
      
      const batch = writeBatch(firestore);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      toast({
        title: 'Sucesso!',
        description: `${querySnapshot.size} pedidos foram removidos.`,
      });
    } catch (error) {
      console.error("Error clearing all orders:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao zerar pedidos',
        description: 'Não foi possível remover todos os pedidos. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };


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
      <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Gerenciamento de Pedidos</CardTitle>
          <CardDescription>Veja todos os pedidos realizados na sua loja.</CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading || orders.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Zerar Pedidos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Todos os {orders.length} pedidos serão permanentemente apagados dos registros de todos os usuários.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllOrders} disabled={isDeleting}>
                {isDeleting ? 'Apagando...' : 'Sim, apagar tudo'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <React.Fragment key={order.id}>
                  <Collapsible asChild open={openOrderId === order.id} onOpenChange={() => setOpenOrderId(prev => prev === order.id ? null : order.id)}>
                    <>
                      <TableRow className="cursor-pointer">
                          <TableCell>
                              <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                      {openOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                              </CollapsibleTrigger>
                          </TableCell>
                          <TableCell>{format(new Date(order.orderDate), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                          <TableCell className="font-medium">{order.customerInfo.name}</TableCell>
                          <TableCell className="font-medium">
                              R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                              <Badge variant={getStatusVariant(order.status)}>
                              {order.status}
                              </Badge>
                          </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                          <tr className="bg-secondary/50 hover:bg-secondary/50">
                              <TableCell colSpan={5} className="p-0">
                                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                          <h4 className="font-bold mb-2">Detalhes do Cliente</h4>
                                          <p><strong>Nome:</strong> {order.customerInfo.name}</p>
                                          <p><strong>Email:</strong> {order.customerInfo.email}</p>
                                          <p><strong>Endereço:</strong> {order.shippingAddress}</p>
                                          <p className="font-mono text-xs mt-2 text-muted-foreground">User ID: {order.userId}</p>
                                      </div>
                                      <div>
                                          <h4 className="font-bold mb-2">Itens do Pedido</h4>
                                          <div className="space-y-4">
                                              {order.items.map((item, index) => (
                                                  <div key={index} className="flex items-center gap-4">
                                                      <Image src={item.imageUrl} alt={item.productName} width={50} height={50} className="rounded-md object-cover" />
                                                      <div className="flex-grow">
                                                          <p className="font-semibold">{item.productName}</p>
                                                          <p className="text-sm text-muted-foreground">
                                                              {item.quantity} x R$ {item.price.toFixed(2).replace('.', ',')}
                                                          </p>
                                                          <p className="text-xs text-muted-foreground">Cor: {item.variantColor} / Tam: {item.size}</p>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                          <Separator className="my-4" />
                                          <div className="space-y-1 text-sm">
                                              {order.discountAmount > 0 && (
                                                  <div className="flex justify-between">
                                                      <span>Subtotal:</span>
                                                      <span>R$ {(order.totalAmount + order.discountAmount).toFixed(2).replace('.', ',')}</span>
                                                  </div>
                                              )}
                                              {order.discountAmount > 0 && (
                                                  <div className="flex justify-between text-green-600">
                                                      <span>Desconto ({order.couponCode}):</span>
                                                      <span>- R$ {order.discountAmount.toFixed(2).replace('.', ',')}</span>
                                                  </div>
                                              )}
                                              <div className="flex justify-between font-bold">
                                                      <span>Total do Pedido:</span>
                                                      <span>R$ {order.totalAmount.toFixed(2).replace('.', ',')}</span>
                                                  </div>
                                          </div>
                                      </div>
                                  </div>
                              </TableCell>
                          </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                </React.Fragment>
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
