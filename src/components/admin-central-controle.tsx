
'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
import { Order, OrderItem } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { fixImageUrl } from '@/lib/utils';
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
  customerInfo: { name: string; email: string };
  items: OrderItem[];
  orderDate: string;
  totalAmount: number;
  status: 'Pedido recebido';
  shippingAddress: string;
  paymentMethod: 'card' | 'pix';
}

export default function AdminCentralControle() {
  const [unverifiedOrders, setUnverifiedOrders] = useState<UnverifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const q = collection(firestore, 'unverified-orders');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UnverifiedOrder, 'id'>),
        }));
        ordersData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setUnverifiedOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching unverified orders:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar pedidos',
          description: 'Não foi possível carregar os pedidos da central de controle.',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);
  
  const handleAddOrderToCustomerAccount = async (order: UnverifiedOrder) => {
    if (!firestore) return;
    setProcessingId(order.id);

    try {
        // Referência para o pedido na conta do usuário
        const userOrdersCollection = collection(firestore, 'users', order.userId, 'orders');
        const newOrderRef = doc(userOrdersCollection); // Gera um novo ID

        // Referência para o pedido não verificado
        const unverifiedOrderRef = doc(firestore, 'unverified-orders', order.id);

        const orderData: Omit<Order, 'id'> = {
            userId: order.userId,
            customerInfo: order.customerInfo,
            items: order.items,
            orderDate: order.orderDate,
            totalAmount: order.totalAmount,
            status: 'Pedido confirmado', // Status inicial para o cliente
            shippingAddress: order.shippingAddress || 'Não informado',
            paymentMethod: order.paymentMethod || 'card',
        };

        const batch = writeBatch(firestore);
        
        // 1. Cria o novo pedido na subcoleção do usuário
        batch.set(newOrderRef, orderData);

        // 2. Apaga o pedido da coleção de não verificados
        batch.delete(unverifiedOrderRef);

        await batch.commit();

        toast({
            title: 'Sucesso!',
            description: `Pedido #${order.id.slice(0, 7)} adicionado à conta de ${order.customerInfo.name}.`,
        });

    } catch (error) {
        console.error("Erro ao adicionar pedido à conta do cliente:", error);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível processar a ação. Tente novamente.',
        });
    } finally {
        setProcessingId(null);
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Central de Controle Operacional</CardTitle>
        <CardDescription>
          Pedidos recebidos aguardando aprovação manual para serem vinculados à conta do cliente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Ação Manual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : unverifiedOrders.length > 0 ? (
              unverifiedOrders.map((order) => (
                <Collapsible asChild key={order.id} open={openOrderId === order.id} onOpenChange={() => setOpenOrderId(prev => prev === order.id ? null : order.id)}>
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
                      <TableCell>{order.customerInfo.email}</TableCell>
                      <TableCell className="font-medium">R$ {order.totalAmount.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-right">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    disabled={processingId === order.id}
                                >
                                    {processingId === order.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    Adicionar à Conta
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Você tem certeza que deseja adicionar este pedido à conta do cliente <strong>{order.customerInfo.name}</strong>? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAddOrderToCustomerAccount(order)}>
                                        Sim, adicionar pedido
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <tr className="bg-secondary/50 hover:bg-secondary/50">
                        <TableCell colSpan={6} className="p-4">
                          <h4 className="font-bold mb-2">Itens do Pedido</h4>
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-4">
                                <Image src={fixImageUrl(item.imageUrl)} alt={item.productName} width={40} height={40} className="rounded-md object-cover" />
                                <div className="flex-grow">
                                  <p className="font-semibold text-sm">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Cor: {item.variantColor} / Tam: {item.size} / Qtd: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-medium text-sm">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </tr>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum pedido aguardando aprovação.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
