
'use client';
import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  writeBatch,
  deleteDoc,
  getDoc,
  addDoc,
} from 'firebase/firestore';
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
import { OrderItem } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { Button } from './ui/button';
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

interface UnverifiedOrder {
  id: string;
  userId: string;
  originalSessionId: string;
  customerInfo: { name: string; email: string; };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function AdminPixVerification() {
  const [unverifiedOrders, setUnverifiedOrders] = useState<UnverifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const q = query(collection(firestore, 'unverified-orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UnverifiedOrder, 'id'>),
        }));
        ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUnverifiedOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching unverified orders:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar pagamentos',
          description: 'Não foi possível carregar a lista de verificações.',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);
  
  const handleConfirmPayment = async (order: UnverifiedOrder) => {
    if (!firestore) return;
    setProcessingId(order.id);

    try {
        const batch = writeBatch(firestore);

        // 1. Define the new order in the user's subcollection
        const newOrderRef = doc(collection(firestore, `users/${order.userId}/orders`));
        batch.set(newOrderRef, {
            userId: order.userId,
            customerInfo: order.customerInfo,
            items: order.items,
            orderDate: new Date().toISOString(),
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            status: 'Pedido confirmado',
            paymentMethod: order.paymentMethod,
            originalSessionId: order.originalSessionId,
        });

        // 2. Delete the unverified order
        const unverifiedOrderRef = doc(firestore, 'unverified-orders', order.id);
        batch.delete(unverifiedOrderRef);
        
        await batch.commit();

        toast({
            title: 'Pagamento Confirmado!',
            description: `O pedido de ${order.customerInfo.name} foi criado com sucesso.`,
        });

    } catch (error) {
         console.error("Error confirming payment:", error);
         toast({
            variant: "destructive",
            title: "Erro ao confirmar",
            description: "Não foi possível processar a confirmação do pagamento."
         });
    } finally {
        setProcessingId(null);
    }
  }
  
   const handleRejectPayment = async (orderId: string) => {
     if (!firestore) return;
     setProcessingId(orderId);
     try {
        await deleteDoc(doc(firestore, 'unverified-orders', orderId));
        toast({
            title: 'Pagamento Recusado',
            description: 'A solicitação de pagamento foi removida.',
            variant: 'destructive'
        });
     } catch (error) {
        console.error("Error rejecting payment:", error);
         toast({
            variant: "destructive",
            title: "Erro ao recusar",
            description: "Não foi possível remover a solicitação."
         });
     } finally {
        setProcessingId(null);
     }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Pagamentos PIX</CardTitle>
        <CardDescription>
          Confirme ou recuse os pagamentos PIX informados pelos clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : unverifiedOrders.length > 0 ? (
              unverifiedOrders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">
                        <div>{order.customerInfo.name}</div>
                        <div className="text-xs text-muted-foreground">{order.customerInfo.email}</div>
                    </TableCell>
                    <TableCell className="font-semibold">R$ {order.totalAmount.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {processingId === order.id ? (
                            <Button disabled size="sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                        ) : (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <XCircle className="mr-2 h-4 w-4" /> Recusar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Recusar Pagamento?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação irá remover a solicitação de verificação. O cliente será notificado que o pagamento não foi identificado. Tem certeza?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRejectPayment(order.id)} className="bg-destructive hover:bg-destructive/90">Sim, Recusar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm">
                                            <CheckCircle className="mr-2 h-4 w-4" /> Confirmar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Pagamento?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Isto irá criar um pedido oficial para <strong>{order.customerInfo.name}</strong> e movê-lo para o Gerenciamento de Pedidos. Confirme apenas se o valor de <strong>R$ {order.totalAmount.toFixed(2).replace('.', ',')}</strong> foi recebido.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleConfirmPayment(order)}>Sim, Confirmar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  Nenhum pagamento aguardando verificação.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
