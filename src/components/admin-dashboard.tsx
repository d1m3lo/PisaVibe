
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
    const [permission, setPermission] = useState('default');
    const [isTokenRegistered, setIsTokenRegistered] = useState(false);
    const [currentToken, setCurrentToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getVapidKey = () => {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("VAPID key is not configured in .env.local");
            toast({ variant: 'destructive', title: "Erro de Configuração", description: "A chave de notificação (VAPID key) não foi encontrada." });
        }
        return vapidKey;
    };

    const fetchTokenAndCheckRegistration = useCallback(async () => {
        if (!firestore || permission !== 'granted') {
            setIsLoading(false);
            return;
        }

        const vapidKey = getVapidKey();
        if (!vapidKey) {
            setIsLoading(false);
            return;
        }
        
        try {
            const { messaging } = initializeFirebase();
            if (!messaging) throw new Error("Messaging service is not available.");
            
            const token = await getToken(messaging, { vapidKey });
            if (token) {
                setCurrentToken(token);
                const tokenRef = doc(firestore, 'fcmTokens', token);
                const docSnap = await getDoc(tokenRef);
                setIsTokenRegistered(docSnap.exists());
            } else {
                setCurrentToken(null);
                setIsTokenRegistered(false);
            }
        } catch (error) {
            console.error('Error getting FCM token or checking registration:', error);
            setCurrentToken(null);
            setIsTokenRegistered(false);
        } finally {
            setIsLoading(false);
        }
    }, [firestore, permission, toast]);


    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchTokenAndCheckRegistration();
    }, [permission, fetchTokenAndCheckRegistration]);

    // Listener for foreground messages
    useEffect(() => {
        const { messaging } = initializeFirebase();
        if (!messaging) return;
        
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received. ', payload);
            toast({
                title: payload.notification?.title || 'Nova Notificação',
                description: payload.notification?.body,
            });
        });

        return () => unsubscribe();
    }, [toast]);
    
    const handleToggleNotifications = async () => {
        setIsLoading(true);

        if (isTokenRegistered) { // Turn off notifications
            if (currentToken && firestore) {
                try {
                    await deleteDoc(doc(firestore, 'fcmTokens', currentToken));
                    setIsTokenRegistered(false);
                    toast({ title: "Notificações desativadas", description: "Você não receberá mais alertas de novos pedidos neste dispositivo." });
                } catch (error) {
                    toast({ variant: 'destructive', title: "Erro", description: "Não foi possível desativar as notificações." });
                }
            }
        } else { // Turn on notifications
            try {
                const newPermission = await Notification.requestPermission();
                setPermission(newPermission);

                if (newPermission === 'granted') {
                    await fetchTokenAndCheckRegistration(); // Re-fetch and check
                    
                     // After permission, try to register the token if it wasn't already
                    const vapidKey = getVapidKey();
                    if(!vapidKey) return;

                    const { messaging } = initializeFirebase();
                    if (!messaging) throw new Error("Messaging service is not available.");
                    
                    const token = await getToken(messaging, { vapidKey });

                    if(token && firestore){
                       await setDoc(doc(firestore, 'fcmTokens', token), { createdAt: new Date().toISOString() });
                       setIsTokenRegistered(true);
                       setCurrentToken(token);
                       toast({ title: "Notificações ativadas!", description: "Você receberá alertas de novos pedidos." });
                    }
                } else {
                    toast({ variant: 'destructive', title: "Permissão negada", description: "Você bloqueou as notificações." });
                }
            } catch (error: any) {
                console.error('Error toggling notifications:', error);
                toast({ variant: 'destructive', title: "Erro de Notificação", description: error.message });
            }
        }
        setIsLoading(false);
    };
    
    const buttonText = isTokenRegistered ? 'Notificações Ativas' : 'Ativar Notificações';
    const Icon = isTokenRegistered ? BellRing : BellOff;

    return (
        <Button 
          variant={isTokenRegistered ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-2"
          onClick={handleToggleNotifications}
          disabled={isLoading || permission === 'denied'}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Icon className={cn("h-5 w-5", isTokenRegistered && 'text-green-500')} />
          )}
          <span>
            {isLoading ? 'Carregando...' : (permission === 'denied' ? 'Notificações Bloqueadas' : buttonText)}
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
