
'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc } from 'firebase/firestore';
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
import type { UserProfile, Order } from '@/lib/types';
import { Button } from './ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
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

type Customer = UserProfile & { firestoreId: string };

export default function AdminCentralControle() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(firestore, 'users'),
      (snapshot) => {
        const customersData = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...(doc.data() as UserProfile),
        }));
        setCustomers(customersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching customers:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar clientes',
          description: 'Não foi possível carregar a lista de clientes.',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);
  
  const handleCreateManualOrder = async (customer: Customer) => {
    if (!firestore) return;
    setProcessingId(customer.uid);

    try {
        const userOrdersCollection = collection(firestore, 'users', customer.uid, 'orders');
        
        // Dados de um pedido de exemplo. O admin deverá editar isso depois.
        const exampleOrderData: Omit<Order, 'id'> = {
            userId: customer.uid,
            customerInfo: {
                name: customer.name,
                email: customer.email,
            },
            items: [
                {
                    productId: 'example-product-id',
                    productName: 'Produto de Exemplo (Editar)',
                    variantColor: 'Preto',
                    size: 'M',
                    quantity: 1,
                    price: 99.90,
                    imageUrl: 'https://via.placeholder.com/150',
                }
            ],
            orderDate: new Date().toISOString(),
            totalAmount: 99.90,
            status: 'Pedido confirmado', 
            shippingAddress: customer.address || 'Endereço não informado',
            paymentMethod: 'card', 
        };

        await addDoc(userOrdersCollection, exampleOrderData);

        toast({
            title: 'Pedido Criado!',
            description: `Um pedido de exemplo foi criado para ${customer.name}. Edite-o no Gerenciamento de Pedidos.`,
        });

    } catch (error) {
        console.error("Erro ao criar pedido manual:", error);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível criar o pedido manual. Tente novamente.',
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
          Crie e gerencie pedidos manualmente para os clientes cadastrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Cliente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Ação Manual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow key={customer.uid}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="text-right">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    disabled={processingId === customer.uid}
                                >
                                    {processingId === customer.uid ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Criar Pedido
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Criação de Pedido</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Isso criará um pedido de exemplo para <strong>{customer.name}</strong>. Você deverá editar os detalhes do pedido (produtos, valores) no painel "Pedidos dos Clientes" em seguida. Deseja continuar?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCreateManualOrder(customer)}>
                                        Sim, criar pedido
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Nenhum cliente cadastrado para iniciar um pedido.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
