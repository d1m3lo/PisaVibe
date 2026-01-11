
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Users, ShoppingCart, LayoutDashboard, TicketPercent, CheckSquare, ShieldCheck, BellRing, BellOff, Loader2 } from 'lucide-react';
import ProductManagement from './admin-product-management';
import CustomerManagement from './admin-customer-management';
import AdminOrderManagement from './admin-order-management';
import AdminMainDashboard from './admin-main-dashboard';
import AdminCouponManagement from './admin-coupon-management';
import AdminCentralControle from './admin-central-controle';
import AdminPixVerification from './admin-pix-verification';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { initializeFirebase } from '@/firebase';


const NotificationManager = () => {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isTokenRegistered, setIsTokenRegistered] = useState(false);
    const [currentToken, setCurrentToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getVapidKey = useCallback(() => {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("VAPID key is not configured in .env.local");
            toast({ variant: 'destructive', title: "Erro de Configuração", description: "A chave de notificação (VAPID key) não foi encontrada." });
        }
        return vapidKey;
    }, [toast]);
    
    // Function to get token and check registration status
    const updateTokenStatus = useCallback(async () => {
        if (typeof window === 'undefined' || !('Notification' in window) || !firestore) {
            setIsTokenRegistered(false);
            setCurrentToken(null);
            return;
        }

        if (Notification.permission !== 'granted') {
             setIsTokenRegistered(false);
             setCurrentToken(null);
             return;
        }

        const vapidKey = getVapidKey();
        if (!vapidKey) return;

        try {
            const { messaging } = initializeFirebase();
            if (!messaging) throw new Error("Serviço de mensagens não disponível.");

            const token = await getToken(messaging, { vapidKey });
            if (token) {
                setCurrentToken(token);
                const tokenRef = doc(firestore, 'fcmTokens', token);
                const docSnap = await getDoc(tokenRef);
                setIsTokenRegistered(docSnap.exists());
            } else {
                setCurrentToken(null);
                setIsTokenRegistered(false);
                console.warn('Não foi possível obter o token de notificação. A permissão foi concedida?');
            }
        } catch (error) {
            console.error('Erro ao obter token ou verificar registro:', error);
            setCurrentToken(null);
            setIsTokenRegistered(false);
        }
    }, [firestore, getVapidKey]);

    useEffect(() => {
        setIsLoading(true);
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
        updateTokenStatus().finally(() => setIsLoading(false));
    }, [updateTokenStatus]);
    
    // Foreground message listener
    useEffect(() => {
        const { messaging } = initializeFirebase();
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            toast({
                title: payload.notification?.title || 'Nova Notificação',
                description: payload.notification?.body,
            });
        });
        return () => unsubscribe();
    }, [toast]);


    const handleToggleNotifications = async () => {
        setIsLoading(true);

        const vapidKey = getVapidKey();
        if (!vapidKey || !firestore) {
            toast({ variant: 'destructive', title: 'Erro de Configuração', description: 'Serviços indisponíveis.' });
            setIsLoading(false);
            return;
        }

        if (isTokenRegistered && currentToken) {
            // --- DEACTIVATE ---
            try {
                await deleteDoc(doc(firestore, 'fcmTokens', currentToken));
                setIsTokenRegistered(false);
                toast({ title: "Notificações Desativadas", description: "Você não receberá mais alertas de novos pedidos neste dispositivo." });
            } catch (error) {
                console.error('Erro ao desativar notificações:', error);
                toast({ variant: 'destructive', title: "Erro", description: "Não foi possível desativar as notificações." });
            }
        } else {
            // --- ACTIVATE ---
            try {
                const newPermission = await Notification.requestPermission();
                setPermission(newPermission);

                if (newPermission === 'granted') {
                    const { messaging } = initializeFirebase();
                    if (!messaging) throw new Error("Serviço de mensagens não disponível.");

                    const token = await getToken(messaging, { vapidKey });
                    if (token) {
                        await setDoc(doc(firestore, 'fcmTokens', token), { createdAt: new Date().toISOString() });
                        setIsTokenRegistered(true);
                        setCurrentToken(token);
                        toast({ title: "Notificações Ativadas!", description: "Você receberá alertas de novos pedidos." });
                    } else {
                         throw new Error("Não foi possível gerar o token de notificação.");
                    }
                } else {
                    toast({ variant: 'destructive', title: "Permissão Negada", description: "Você bloqueou as notificações para este site." });
                }
            } catch (error: any) {
                console.error('Erro ao ativar notificações:', error);
                toast({ variant: 'destructive', title: "Erro de Notificação", description: error.message });
            }
        }
        setIsLoading(false);
    };

    if (permission === 'denied') {
        return (
             <Button variant="ghost" className="w-full justify-start gap-2" disabled>
                <BellOff className="h-5 w-5 text-destructive" />
                <span>Notificações Bloqueadas</span>
            </Button>
        );
    }
    
    const buttonText = isTokenRegistered ? 'Notificações Ativas' : 'Ativar Notificações';
    const Icon = isTokenRegistered ? BellRing : BellOff;

    return (
        <Button 
          variant={isTokenRegistered ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-2"
          onClick={handleToggleNotifications}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Icon className={cn("h-5 w-5", isTokenRegistered && 'text-green-500')} />
          )}
          <span>
            {isLoading ? 'Carregando...' : buttonText}
          </span>
        </Button>
    )
}


interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const q = collection(firestore, 'unverified-orders');
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingOrdersCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [firestore]);


  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="w-64 bg-background p-4 flex flex-col justify-between">
        <div>
           <h2 className="font-headline text-2xl font-bold mb-8">Admin PISA VIBE</h2>
            <nav className="flex flex-col gap-2">
            <Button
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
             <Button
              variant={activeTab === 'pix' ? 'secondary' : 'ghost'}
              className="justify-start gap-2 relative"
              onClick={() => setActiveTab('pix')}
            >
              <ShieldCheck className="h-5 w-5" />
              Verificar Pagamentos
              {pendingOrdersCount > 0 && (
                 <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">
                    {pendingOrdersCount}
                 </span>
              )}
            </Button>
            <Button
              variant={activeTab === 'central' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('central')}
            >
              <CheckSquare className="h-5 w-5" />
              Central de Controle
            </Button>
            <Button
              variant={activeTab === 'products' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('products')}
            >
              <Package className="h-5 w-5" />
              Produtos
            </Button>
             <Button
              variant={activeTab === 'customers' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('customers')}
            >
              <Users className="h-5 w-5" />
              Clientes
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart className="h-5 w-5" />
              Pedidos dos Clientes
            </Button>
             <Button
              variant={activeTab === 'coupons' ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveTab('coupons')}
            >
              <TicketPercent className="h-5 w-5" />
              Cupons
            </Button>
          </nav>
        </div>
        <div className="space-y-2">
            <NotificationManager />
            <Button onClick={onLogout} className="w-full justify-start gap-2">
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {activeTab === 'dashboard' && <AdminMainDashboard />}
        {activeTab === 'pix' && <AdminPixVerification />}
        {activeTab === 'central' && <AdminCentralControle />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'orders' && <AdminOrderManagement />}
        {activeTab === 'coupons' && <AdminCouponManagement />}
      </main>
    </div>
  );
}
