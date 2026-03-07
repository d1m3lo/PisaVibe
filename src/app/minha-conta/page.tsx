
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import { updateProfile, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, Order } from '@/lib/types';
import { cn, fixImageUrl } from '@/lib/utils';
import { User, KeyRound, ShoppingCart, ChevronDown, ChevronUp, LogOut, PackageSearch, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

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
    const { toast } = useToast();
    const router = useRouter();
    const [openOrderId, setOpenOrderId] = useState<string | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'orders'), orderBy('orderDate', 'desc'));
    }, [user, firestore]);
    
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Pedido confirmado': return 'default';
            case 'Pedido em separação': return 'secondary';
            case 'Pedido em transporte': return 'secondary';
            case 'Saiu para entrega': return 'secondary';
            case 'Pedido entregue': return 'outline';
            default: return 'destructive';
        }
    }

    const handleConfirmDeliveryClick = (order: Order) => {
        setSelectedOrder(order);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelivery = async () => {
        if (!user || !firestore || !selectedOrder) return;
        setIsUpdating(true);
        try {
            const orderRef = doc(firestore, `users/${user.uid}/orders`, selectedOrder.id);
            await updateDoc(orderRef, { status: 'Pedido entregue' });
            
            setIsConfirmModalOpen(false);
            setIsInviteModalOpen(true);
            toast({ title: "Entrega confirmada!", description: "Seu pedido foi marcado como entregue." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível confirmar a entrega." });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleGoToReview = () => {
        if (!selectedOrder || !selectedOrder.items[0]) return;
        const firstProductId = selectedOrder.items[0].productId;
        router.push(`/produtos/${firstProductId}?review=true`);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
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
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4"
                    >
                        <div 
                            className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center cursor-pointer"
                            onClick={() => setOpenOrderId(prev => prev === order.id ? null : order.id)}
                        >
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
                        <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                            {(order.status === 'Pedido em transporte' || order.status === 'Saiu para entrega') && (
                                <Button 
                                    size="sm" 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleConfirmDeliveryClick(order)}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Confirmar Entrega
                                </Button>
                            )}
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <Link href={`/minha-conta/acompanhar-pedido/${order.id}`}>
                                    <PackageSearch className="mr-2 h-4 w-4" />
                                    Acompanhar
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 sm:hidden" onClick={() => setOpenOrderId(prev => prev === order.id ? null : order.id)}>
                                {openOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
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
                                                  <Image src={fixImageUrl(item.imageUrl)} alt={item.productName} width={50} height={50} className="rounded-md object-cover" />
                                                  <div className="flex-grow">
                                                      <p className="font-semibold text-sm">{item.productName}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                          {item.quantity} x R$ {item.price.toFixed(2).replace('.', ',')}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                          Cor: {item.variantColor} / Tam: {item.size}
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

            {/* Modal de Confirmação de Entrega */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Recebimento</DialogTitle>
                        <DialogDescription>
                            Você confirma que recebeu o seu pedido #{selectedOrder?.id.slice(0,7)}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleConfirmDelivery} disabled={isUpdating}>
                            Confirmar Entrega
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Convite para Avaliação */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <ShoppingCart className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl">Seu produto chegou!</DialogTitle>
                        <DialogDescription className="text-base py-2">
                            Gostaria de deixar uma avaliação? Avaliações ajudam outros clientes a comprar com mais confiança.
                        </DialogDescription>
                        <p className="text-sm font-semibold text-primary">
                            Avalie o produto e ganhe +5 pontos para desconto em uma próxima compra.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button onClick={handleGoToReview} className="w-full">
                            Avaliar agora
                        </Button>
                        <DialogClose asChild>
                            <Button variant="ghost" className="w-full">Talvez depois</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const PasswordChangeForm = () => {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const isEmailProvider = user?.providerData.some(
        (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
    );

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user || !user.email) {
            setError("Usuário não encontrado.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("As novas senhas não coincidem.");
            return;
        }
        if (newPassword.length < 6) {
            setError("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsSaving(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);

            toast({
                title: "Senha alterada!",
                description: "Sua senha foi atualizada com sucesso.",
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
             let errorMessage = "Ocorreu um erro desconhecido.";
            switch (error.code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'A senha atual está incorreta.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'A nova senha é muito fraca.';
                    break;
                default:
                    errorMessage = 'Falha ao alterar a senha. Tente novamente.';
                    break;
            }
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Erro ao alterar senha',
                description: errorMessage,
            });
        } finally {
            setIsSaving(false);
        }
    }
    
    if (!isEmailProvider) {
        return (
            <p className="text-sm text-muted-foreground">
                A alteração de senha não está disponível para contas criadas via login social (Google).
            </p>
        )
    }

    return (
        <form onSubmit={handlePasswordChange} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                    <Input 
                        id="current-password" 
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                 <div className="relative">
                    <Input 
                        id="new-password" 
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                 <div className="relative">
                    <Input 
                        id="confirm-password" 
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
        </form>
    )
}

export default function MyAccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState('orders'); // Default to orders
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
      { id: 'orders', label: 'Meus Pedidos', icon: ShoppingCart },
      { id: 'profile', label: 'Detalhes do Perfil', icon: User },
      { id: 'password', label: 'Alterar Senha', icon: KeyRound },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold">Minha Conta</h1>
            <p className="mt-2 text-lg text-muted-foreground">Gerencie suas informações e preferências.</p>
        </div>
        {profile.points !== undefined && (
            <Badge variant="secondary" className="text-base py-2 px-4 flex gap-2 items-center bg-amber-100 text-amber-900 border-amber-200">
                <ShoppingCart className="h-4 w-4" />
                {profile.points} pontos acumulados
            </Badge>
        )}
      </div>
      
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
                                Acompanhe o histórico e o status de suas compras.
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
                           <PasswordChangeForm />
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    </div>
  );
}
