
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, KeyRound, Heart, ShoppingCart, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AccountPageSkeleton = () => (
    <div className="container mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-5 w-2/3 mb-8" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
            <Skeleton className="h-48 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-11 w-32" />
                </CardContent>
            </Card>
        </div>
    </div>
);

const OrderHistory = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const [openOrderId, setOpenOrderId] = useState<string | null>(null);

    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'orders'), orderBy('orderDate', 'desc'));
    }, [user, firestore]);
    
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
          case 'processing': return 'default';
          case 'shipped': return 'secondary';
          case 'delivered': return 'outline';
          default: return 'destructive';
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-16">
                <ShoppingCart className="mx-auto h-12 w-12" />
                <p className="mt-4">Você ainda não fez nenhum pedido.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <Card key={order.id}>
                    <div 
                        className="flex items-center gap-4 p-4 cursor-pointer"
                        onClick={() => setOpenOrderId(prev => prev === order.id ? null : order.id)}
                    >
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                             <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Pedido</span>
                                <span className="font-mono text-sm font-semibold truncate">#{order.id.slice(0, 7)}</span>
                             </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Data</span>
                                <span className="text-sm font-semibold">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Total</span>
                                <span className="text-sm font-semibold">R$ {order.totalAmount.toFixed(2).replace('.',',')}</span>
                             </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <Badge variant={getStatusVariant(order.status)} className="w-fit">{order.status}</Badge>
                             </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            {openOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>

                    {openOrderId === order.id && (
                        <div className="px-4 pb-4 border-t pt-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <h4 className="font-semibold mb-2">Endereço de Entrega</h4>
                                      <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold mb-2">Itens</h4>
                                      <div className="space-y-4">
                                          {order.items.map((item, index) => (
                                              <div key={index} className="flex items-center gap-4">
                                                  <Image src={item.imageUrl} alt={item.productName} width={50} height={50} className="rounded-md object-cover" />
                                                  <div className="flex-grow">
                                                      <p className="font-semibold text-sm">{item.productName}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                          {item.quantity} x R$ {item.price.toFixed(2).replace('.', ',')}
                                                      </p>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                      <Separator className="my-4" />
                                       <div className="space-y-1 text-sm">
                                            {order.discountAmount && order.discountAmount > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>R$ {(order.totalAmount + order.discountAmount).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            )}
                                            {order.discountAmount && order.discountAmount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Desconto ({order.couponCode}):</span>
                                                    <span>- R$ {order.discountAmount.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold">
                                                    <span>Total:</span>
                                                    <span>R$ {order.totalAmount.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                       </div>
                                  </div>
                              </div>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    )
}

export default function MyAccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        setName(data.name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
      } else {
         // Create a profile if it doesn't exist (e.g. for users who signed up before profile creation)
        const newProfile = {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        setName(newProfile.name);
      }
    };

    fetchProfile();
  }, [user, isUserLoading, firestore, router]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
        // Update Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            name,
            address,
            phone,
        });

        // Also update Firebase Auth profile if name changed
        if (auth.currentUser && auth.currentUser.displayName !== name) {
            await updateProfile(auth.currentUser, { displayName: name });
        }

        toast({
            title: 'Perfil Atualizado!',
            description: 'Suas informações foram salvas com sucesso.',
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar seu perfil. Tente novamente.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    toast({ title: 'Você saiu da sua conta.' });
  }
  
  if (isUserLoading || !profile) {
    return <AccountPageSkeleton />;
  }

  const menuItems = [
      { id: 'profile', label: 'Detalhes do Perfil', icon: User },
      { id: 'orders', label: 'Meus Pedidos', icon: ShoppingCart },
      { id: 'favorites', label: 'Favoritos', icon: Heart },
      { id: 'password', label: 'Alterar Senha', icon: KeyRound },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-headline text-4xl font-bold">Minha Conta</h1>
      <p className="mt-2 text-lg text-muted-foreground">Gerencie suas informações e preferências.</p>
      
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
            <nav className="flex flex-col gap-2">
                {menuItems.map(item => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? 'secondary' : 'ghost'}
                        className="justify-start"
                        onClick={() => setActiveView(item.id)}
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </Button>
                ))}
                 <Separator className="my-2" />
                <Button
                    variant='ghost'
                    className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </nav>

            <div>
                {activeView === 'profile' && (
                    <form onSubmit={handleSave}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhes do Perfil</CardTitle>
                                <CardDescription>
                                    Mantenha seus dados de contato e entrega atualizados.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={profile.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" />
                                </div>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                )}

                {activeView === 'orders' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Meus Pedidos</CardTitle>
                            <CardDescription>
                                Acompanhe o histórico de suas compras.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrderHistory />
                        </CardContent>
                    </Card>
                )}

                {activeView === 'password' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Alterar Senha</CardTitle>
                            <CardDescription>
                                Para sua segurança, recomendamos o uso de uma senha forte.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Funcionalidade a ser implementada.</p>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Senha Atual</Label>
                                <Input id="current-password" type="password" disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input id="new-password" type="password" disabled />
                            </div>
                            <Button disabled>Salvar Nova Senha</Button>
                        </CardContent>
                    </Card>
                )}

                {activeView === 'favorites' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Favoritos</CardTitle>
                            <CardDescription>
                               Seus produtos salvos para não perder de vista.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-muted-foreground py-8">
                                 <p>Você ainda não tem produtos favoritos.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}

    