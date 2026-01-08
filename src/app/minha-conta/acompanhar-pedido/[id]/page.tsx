
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusVisualizer } from '@/components/order-status-visualizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState, use } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { fixImageUrl } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const TrackingPageSkeleton = () => (
    <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-10 w-80 mb-8" />
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-8">
                 <Skeleton className="h-24 w-full" />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <Skeleton className="h-6 w-1/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-1/4 mb-4" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
);

export default function AcompanharPedidoPage() {
    const params = useParams();
    const { id: orderId } = use(params);
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        if (!orderId || !firestore) {
            setError("Pedido não encontrado.");
            setIsLoading(false);
            return;
        }

        const fetchOrder = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // The order document is a subcollection of the user
                const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId as string);
                const docSnap = await getDoc(orderRef);

                if (docSnap.exists()) {
                    setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
                } else {
                    setError("Este pedido não foi encontrado ou não pertence a você.");
                }
            } catch (err) {
                console.error("Error fetching order:", err);
                setError("Ocorreu um erro ao buscar os detalhes do seu pedido.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, user, isUserLoading, firestore, router]);


    if (isLoading) {
        return <TrackingPageSkeleton />;
    }

    if (error) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h1 className="mt-4 text-2xl font-bold">Erro ao Carregar Pedido</h1>
                <p className="mt-2 text-muted-foreground">{error}</p>
                <Button asChild className="mt-6">
                    <Link href="/minha-conta">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Meus Pedidos
                    </Link>
                </Button>
            </div>
        );
    }
    
    if (!order) {
        return null;
    }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/minha-conta">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Pedidos
            </Link>
        </Button>

        <header className="mb-8">
            <h1 className="font-headline text-4xl font-bold">Acompanhar Pedido</h1>
            <p className="text-lg text-muted-foreground">
                Veja o andamento da sua entrega em tempo real.
            </p>
        </header>
        
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Pedido #{order.id.slice(0,7)}</CardTitle>
                        <CardDescription>
                            Realizado em {format(new Date(order.orderDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardDescription>
                    </div>
                     <Badge variant="secondary" className="w-fit text-base py-1 px-3">
                        Total: R$ {order.totalAmount.toFixed(2).replace('.',',')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <OrderStatusVisualizer currentStatus={order.status} />
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                        <p className="text-sm text-muted-foreground">
                            {order.shippingAddress}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Resumo dos Itens</h3>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <Image 
                                        src={fixImageUrl(item.imageUrl)} 
                                        alt={item.productName} 
                                        width={64} 
                                        height={64} 
                                        className="rounded-md object-cover border"
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">{item.quantity} unidade(s)</p>
                                    </div>
                                    <p className="text-sm font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
