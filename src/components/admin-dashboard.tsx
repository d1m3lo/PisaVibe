
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Users, ShoppingCart, LayoutDashboard, TicketPercent, CheckSquare, ShieldCheck, BellRing, BellOff } from 'lucide-react';
import ProductManagement from './admin-product-management';
import CustomerManagement from './admin-customer-management';
import AdminOrderManagement from './admin-order-management';
import AdminMainDashboard from './admin-main-dashboard';
import AdminCouponManagement from './admin-coupon-management';
import AdminCentralControle from './admin-central-controle';
import AdminPixVerification from './admin-pix-verification';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { initializeFirebase } from '@/firebase';


const NotificationManager = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    useEffect(() => {
        // Listen for foreground messages
        const { firebaseApp } = initializeFirebase();
        const messaging = getMessaging(firebaseApp);
        
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast({
                title: payload.notification?.title || 'Nova Notificação',
                description: payload.notification?.body,
            });
        });

        return () => unsubscribe();
    }, [toast]);
    
    const handleEnableNotifications = async () => {
        try {
            const { firebaseApp } = initializeFirebase();
            const messaging = getMessaging(firebaseApp);
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                const currentToken = await getToken(messaging, {
                    vapidKey: 'BMD6I_yUaYvK2nEWNy-s_h5F0Doro0yqSPnFpS9wLsoB0i510P9p0q2R9zM9_d4g_r-y7K8-B4rU7fJ9y6lUoT8',
                });

                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    if (firestore) {
                        await setDoc(doc(firestore, 'fcmTokens', currentToken), {
                           createdAt: new Date().toISOString() 
                        });
                        toast({ title: "Notificações ativadas!", description: "Você receberá alertas de novos pedidos."});
                    }
                } else {
                    toast({ variant: 'destructive', title: "Erro", description: "Não foi possível obter o token de notificação."});
                }
            } else {
                 toast({ variant: 'destructive', title: "Permissão negada", description: "As notificações foram bloqueadas. Você pode reativá-las nas configurações do seu navegador."});
            }
        } catch(error) {
            console.error('Error getting FCM token:', error);
            toast({ variant: 'destructive', title: "Erro de Notificação", description: "Não foi possível ativar as notificações." });
        }
    };
    
    return (
        <Button 
          variant={notificationPermission === 'granted' ? 'ghost' : 'secondary'}
          className="w-full justify-start gap-2"
          onClick={handleEnableNotifications}
          disabled={notificationPermission === 'granted'}
        >
          {notificationPermission === 'granted' ? <BellRing className="h-5 w-5 text-green-500" /> : <BellOff className="h-5 w-5" />}
          {notificationPermission === 'granted' ? 'Notificações Ativas' : 'Ativar Notificações'}
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
