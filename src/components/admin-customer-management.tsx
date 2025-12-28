'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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

interface Customer {
  firestoreId: string;
  uid: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const unsubscribe = onSnapshot(
      collection(firestore, 'users'),
      (snapshot) => {
        const customersData = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...(doc.data() as Omit<Customer, 'firestoreId'>),
        }));
        setCustomers(customersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching customers:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar clientes',
          description: 'Não foi possível carregar os clientes do banco de dados.',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Clientes</CardTitle>
        <CardDescription>Veja os clientes cadastrados na sua loja.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Endereço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                </TableRow>
              ))
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.firestoreId}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || 'Não informado'}</TableCell>
                  <TableCell>{customer.address || 'Não informado'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && customers.length === 0 && (
            <p className="text-center text-muted-foreground pt-8">Nenhum cliente encontrado.</p>
        )}
      </CardContent>
    </Card>
  );
}

    