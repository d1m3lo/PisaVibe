
"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { addDoc, collection, query, where, onSnapshot, getDocs, getDoc, doc, updateDoc, increment } from "firebase/firestore";
import { fixImageUrl } from "@/lib/utils";
import { Loader2, Copy, CheckCircle, AlertCircle, XCircle, TicketPercent, Check, X, Truck, Info, Gift, Sparkles } from "lucide-react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import type { Order, Coupon, OrderItem, UserProfile } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type PixStatus = 'idle' | 'generated' | 'pending_verification' | 'confirmed' | 'error' | 'rejected';

export default function CheckoutContent() {
  const { user, isUserLoading } = useUser();
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [pixData, setPixData] = useState<any>(null);
  const [pixStatus, setPixStatus] = useState<PixStatus>('idle');
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [showNightMessageForPix, setShowNightMessageForPix] = useState(false);

  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const shippingFormRef = useRef<HTMLDivElement>(null);

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Carregar perfil para pontos
  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const points = profile?.points || 0;

  const loyaltyRewards = [
    { points: 20, value: 5, minSpend: 80, label: 'R$ 5 OFF' },
    { points: 40, value: 10, minSpend: 120, label: 'R$ 10 OFF' },
    { points: 70, value: 20, minSpend: 180, label: 'R$ 20 OFF' },
  ];

  const availableRewards = useMemo(() => {
    return loyaltyRewards.filter(r => points >= r.points && cartTotal >= r.minSpend);
  }, [points, cartTotal]);

  const totalAcrescimoCartao = useMemo(() => {
    return cartItems.reduce((acc, item) => {
        const acrescimo = item.variant.acrescimoCartao ?? 20;
        return acc + (acrescimo * item.quantity);
    }, 0);
  }, [cartItems]);

  const finalTotal = cartTotal - discount + (shippingCost || 0);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (key) initMercadoPago(key, { locale: "pt-BR" });
  }, []);
  
   useEffect(() => {
    if (pixStatus === 'generated') {
      const timer = setTimeout(() => {
        setShowVerificationPrompt(true);
      }, 8000); // 8 segundos
      return () => clearTimeout(timer);
    }
  }, [pixStatus]);

  useEffect(() => {
    if (!user) return;
    setShippingInfo(prev => ({
      ...prev,
      name: user.displayName || prev.name,
      email: user.email || prev.email,
      phone: user.phoneNumber || prev.phone
    }));
  }, [user]);

  // Listener para o resultado da verificação do admin
  useEffect(() => {
    if (pixStatus !== 'pending_verification' || !lastPaymentId || !user || !firestore) {
      return;
    }

    // Listener para o pedido ser criado (sucesso)
    const userOrdersRef = collection(firestore, `users/${user.uid}/orders`);
    const q = query(userOrdersRef, where("originalSessionId", "==", lastPaymentId));
    
    const unsubscribeOrder = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPixStatus('confirmed');
        clearCart();
        unsubscribeOrder();
      }
    });

    // Timeout caso o admin demore muito ou recuse
    const rejectionTimeout = setTimeout(() => {
        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                setPixStatus('rejected');
            }
        });
    }, 300000); // 5 minutos de timeout

    return () => {
      unsubscribeOrder();
      clearTimeout(rejectionTimeout);
    };

  }, [pixStatus, lastPaymentId, user, firestore, clearCart]);


  const isInvalid =
    !shippingInfo.name ||
    !shippingInfo.email ||
    !shippingInfo.phone ||
    !shippingInfo.zipCode ||
    !shippingInfo.street ||
    !shippingInfo.number ||
    !shippingInfo.city ||
    !shippingInfo.state;

  const validateForm = () => {
    if (isInvalid) {
      toast({
        variant: "destructive",
        title: "Preencha todos os dados de entrega",
        description: "Nome, email, telefone, CEP e endereço completo são obrigatórios para continuar."
      });
      shippingFormRef.current?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!firestore) {
      setCouponError('Serviço indisponível. Tente novamente.');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const couponsRef = collection(firestore, 'coupons');
      const q = query(couponsRef, where('code', '==', couponCode.toUpperCase()), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError('Cupom inválido ou inativo.');
        setAppliedCoupon(null);
        setDiscount(0);
        return;
      }
      
      const couponDoc = querySnapshot.docs[0];
      const couponData = { ...couponDoc.data(), id: couponDoc.id } as Coupon;

      if (couponData.expiryDate && new Date(couponData.expiryDate) < new Date()) {
        setCouponError('Este cupom expirou.');
        setAppliedCoupon(null);
        setDiscount(0);
        return;
      }

      if (couponData.minSpend && cartTotal < couponData.minSpend) {
        setCouponError(`Valor mínimo para este cupom: R$ ${couponData.minSpend}`);
        setAppliedCoupon(null);
        setDiscount(0);
        return;
      }

      setAppliedCoupon(couponData);
      let calculatedDiscount = 0;
      if (couponData.discountType === 'percentage') {
        calculatedDiscount = cartTotal * (couponData.discountValue / 100);
      } else {
        calculatedDiscount = couponData.discountValue;
      }
      setDiscount(calculatedDiscount);
      setCouponSuccess(`Cupom "${couponData.code}" aplicado!`);

    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError('Erro ao aplicar o cupom. Tente novamente.');
      setAppliedCoupon(null);
      setDiscount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRedeemPoints = async (reward: typeof loyaltyRewards[0]) => {
    if (!firestore || !user || !profile) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
        const code = `RESGATE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        // 1. Criar o cupom no banco
        const couponData: Omit<Coupon, 'id'> = {
            code,
            discountType: 'fixed',
            discountValue: reward.value,
            minSpend: reward.minSpend,
            isActive: true,
            usageCount: 0,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        const couponRef = await addDoc(collection(firestore, 'coupons'), couponData);

        // 2. Descontar pontos do usuário
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            points: increment(-reward.points)
        });

        // 3. Aplicar automaticamente ao checkout
        const newCoupon = { ...couponData, id: couponRef.id } as Coupon;
        setAppliedCoupon(newCoupon);
        setDiscount(reward.value);
        setCouponCode(code);
        setCouponSuccess(`Desconto de ${reward.label} resgatado e aplicado!`);
        
        toast({
            title: "Pontos Resgatados!",
            description: `Você usou ${reward.points} pontos por um desconto de R$ ${reward.value}.`,
        });
    } catch (error) {
        console.error("Error redeeming points in checkout:", error);
        toast({ variant: 'destructive', title: "Erro no resgate", description: "Não foi possível usar seus pontos agora." });
    } finally {
        setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponError(null);
    setCouponSuccess(null);
    toast({ title: 'Cupom removido.' });
  }

  const handlePixPayment = async () => {
    if (!validateForm() || !user) return;

    setIsGeneratingPix(true);
    setShowVerificationPrompt(false);
    setPixStatus('idle');

    try {
      const res = await fetch(
        "/api/create-pix-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalTotal,
            email: shippingInfo.email,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");
      
      setPixData(data);
      setLastPaymentId(data.payment_id);
      setPixStatus('generated');

      await createUnverifiedOrder(user.uid, 'pix', data.payment_id);

      toast({ title: "PIX gerado com sucesso" });
    } catch (err: any) {
      setPixStatus('error');
      toast({
        variant: "destructive",
        title: "Erro ao gerar PIX",
        description: err.message,
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleConfirmPixVerification = async () => {
    if (!user || !firestore || !lastPaymentId) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado ou ID do pagamento ausente." });
      return;
    }
    
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 7) {
      setShowNightMessageForPix(true);
    } else {
      setShowNightMessageForPix(false);
    }
    
    setPixStatus('pending_verification');
  };
  
  const createUnverifiedOrder = async (userId: string, method: 'pix' | 'card', paymentId?: string): Promise<string | null> => {
    if (!firestore) return null;
  
    const unverifiedOrderData: any = {
      user_id: userId,
      customerInfo: {
        name: shippingInfo.name,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
      },
      items: cartItems.map(item => {
        const orderItem: OrderItem = {
          productId: item.product.id,
          productName: item.displayName || item.product.name,
          variantColor: item.variant.color,
          size: item.size,
          quantity: item.quantity,
          price: item.variant.price,
          imageUrl: fixImageUrl(item.selectedImage || item.variant.images[0]),
        };

        if (item.giftChoice) {
          orderItem.giftChoice = item.giftChoice;
        }

        return orderItem;
      }),
      totalAmount: finalTotal,
      shippingAddress: `${shippingInfo.street}, ${shippingInfo.number}, ${shippingInfo.neighborhood}, ${shippingInfo.city}, ${shippingInfo.state}`,
      paymentMethod: method,
      status: method === 'card' ? 'Aguardando Pagamento' : 'Pagamento em análise',
      createdAt: new Date().toISOString(),
    };

    if (paymentId) {
        unverifiedOrderData.originalSessionId = paymentId;
    }

    if (appliedCoupon && discount > 0) {
      unverifiedOrderData.discountAmount = discount;
      unverifiedOrderData.couponCode = appliedCoupon.code;
    }
  
    try {
      const docRef = await addDoc(collection(firestore, 'unverified_orders'), unverifiedOrderData);
      return docRef.id;
    } catch (error) {
      console.error(`Falha ao criar pré-ordem para ${method}:`, error);
      return null;
    }
  };

  const handleCardPayment = async () => {
    if (!validateForm() || !user || !firestore) return;
  
    const formattedItems = cartItems.map((item) => {
        const title = item.product.subCategory === 'mochilas'
            ? `${item.displayName || item.product.name} (${item.variant.color})`
            : `${item.displayName || item.product.name} (${item.variant.color} / ${item.size})`;
        
        return {
            id: item.product.id,
            title: title,
            quantity: item.quantity,
            unit_price: item.variant.price,
            description: title,
            picture_url: fixImageUrl(item.selectedImage || item.variant.images[0]),
        }
    });
    
    try {
      const unverifiedOrderId = await createUnverifiedOrder(user.uid, 'card');
      if (!unverifiedOrderId) {
        throw new Error("Não foi possível criar a pré-ordem. Tente novamente.");
      }
      
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: formattedItems,
          shippingInfo,
          coupon: appliedCoupon,
          userId: user.uid,
          shippingCost: shippingCost,
          unverifiedOrderId: unverifiedOrderId,
          totalAcrescimoCartao: totalAcrescimoCartao,
        }),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao criar preferência de pagamento.');
      }
  
      const data = await res.json();
      setPreferenceId(data.preferenceId);
  
    } catch (error: any) {
      console.error("Erro ao iniciar pagamento com cartão:", error);
      toast({
        variant: "destructive",
        title: "Erro no Pagamento",
        description: error.message || "Não foi possível iniciar o pagamento com cartão. Tente novamente.",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value.replace(/\D/g, '');
    setShippingInfo(prev => ({...prev, zipCode}));
    setShippingCost(null);

    if (zipCode.length === 8) {
      setIsCalculatingShipping(true);
      try {
        const response = await fetch(`/api/cep/${zipCode}`);
        if (!response.ok) {
            toast({ variant: "destructive", title: "Erro de CEP", description: "CEP não encontrado ou inválido."});
            setIsCalculatingShipping(false);
            return;
        }
        const data = await response.json();
        if (data.erro) {
            toast({ variant: "destructive", title: "Erro de CEP", description: "CEP não encontrado."});
            setIsCalculatingShipping(false);
            return;
        }

        setShippingCost(0);
        
        setShippingInfo(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
        
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({ variant: "destructive", title: "Erro de CEP", description: "Não foi possível consultar o CEP."});
      } finally {
        setIsCalculatingShipping(false);
      }
    }
  };


  return (
    <div className="container mx-auto py-10 grid lg:grid-cols-2 gap-10">
      <Card ref={shippingFormRef}>
        <CardHeader>
          <CardTitle>Informações de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-6 gap-4">
            <div className="col-span-6">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" value={shippingInfo.name} onChange={handleInputChange} placeholder="Seu nome completo" required/>
            </div>
            <div className="col-span-6 sm:col-span-4">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={shippingInfo.email} onChange={handleInputChange} placeholder="seu.email@exemplo.com" required/>
            </div>
            <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" type="tel" value={shippingInfo.phone} onChange={handleInputChange} placeholder="(XX) XXXXX-XXXX" required/>
            </div>
            <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" value={shippingInfo.zipCode} onChange={handleZipCodeChange} placeholder="00000-000" required/>
            </div>
             <div className="col-span-6 sm:col-span-4">
                <Label htmlFor="street">Rua / Logradouro</Label>
                <Input id="street" value={shippingInfo.street} onChange={handleInputChange} placeholder="Nome da sua rua" required/>
            </div>
            <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" value={shippingInfo.number} onChange={handleInputChange} placeholder="123" required/>
            </div>
             <div className="col-span-6 sm:col-span-4">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" value={shippingInfo.complement} onChange={handleInputChange} placeholder="Apto, bloco, etc. (opcional)" />
            </div>
             <div className="col-span-6">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" value={shippingInfo.neighborhood} onChange={handleInputChange} placeholder="Seu bairro" required/>
            </div>
            <div className="col-span-6 sm:col-span-4">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="Sua cidade" required/>
            </div>
            <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" value={shippingInfo.state} onChange={handleInputChange} placeholder="UF" required/>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo e Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-auto max-h-[300px] pr-4">
            {cartItems.map((item, i) => (
                <div key={i} className="flex gap-3 mb-4">
                <Image
                    src={fixImageUrl(item.selectedImage || item.variant.images[0])}
                    alt={item.displayName || item.product.name}
                    width={60}
                    height={60}
                    className="rounded-md border object-cover"
                />
                <div>
                    <p className="font-semibold">{item.displayName || item.product.name}</p>
                    {item.giftChoice && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                            <Gift className="h-3 w-3" />
                            <span>Brinde: Pulseira {item.giftChoice}</span>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground">R$ {item.variant.price.toFixed(2).replace('.',',')}</p>
                </div>
                </div>
            ))}
          </ScrollArea>

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex gap-2">
                <Input 
                    placeholder="Código do cupom" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-grow"
                />
                {appliedCoupon ? (
                    <Button variant="outline" size="icon" onClick={removeCoupon} className="text-destructive hover:text-destructive">
                        <X className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
                        {isApplyingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : 'Aplicar'}
                    </Button>
                )}
            </div>
             {couponError && <p className="text-sm text-destructive flex items-center gap-1"><XCircle size={14}/> {couponError}</p>}
             {couponSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><Check size={14}/> {couponSuccess}</p>}

             {/* Atalho para usar pontos */}
             {availableRewards.length > 0 && !appliedCoupon && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1 mb-2 uppercase tracking-tight">
                        <Sparkles size={12} className="text-amber-500" /> Use seus pontos ({points} pts)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {availableRewards.map((reward, i) => (
                            <Button 
                                key={i} 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2 text-[10px] bg-white border-amber-300 text-amber-700 hover:bg-amber-100 font-bold"
                                onClick={() => handleRedeemPoints(reward)}
                                disabled={isApplyingCoupon}
                            >
                                {reward.label}
                            </Button>
                        ))}
                    </div>
                </div>
             )}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {cartTotal.toFixed(2).replace('.',',')}</span>
            </div>
            {discount > 0 && (
                 <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><TicketPercent size={14}/> Desconto ({appliedCoupon?.code || couponCode})</span>
                    <span>- R$ {discount.toFixed(2).replace('.',',')}</span>
                </div>
            )}
             <div className="flex justify-between">
                 <span className="text-muted-foreground flex items-center gap-1">
                    <Truck size={14}/> Frete
                </span>

                {isCalculatingShipping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : shippingCost !== null ? (
                    <span>
                        {shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2).replace('.',',')}`}
                    </span>
                ) : (
                    <span>-</span>
                )}
            </div>
            <Separator />
             <div className="flex justify-between font-bold text-base">
                <span>Total (no Pix)</span>
                <span>R$ {finalTotal.toFixed(2).replace('.',',')}</span>
            </div>
          </div>
          

          <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={handlePixPayment} disabled={isGeneratingPix || pixStatus !== 'idle' || shippingCost === null}>
                {isGeneratingPix ? <Loader2 className="animate-spin" /> : "Pagar com PIX"}
              </Button>

              <Button className="w-full" variant="outline" onClick={handleCardPayment} disabled={pixStatus !== 'idle' || !!preferenceId || shippingCost === null}>
                Pagar com Cartão
              </Button>
          </div>

          {preferenceId && (
            <div className="mt-6 space-y-4 rounded-lg border bg-secondary/50 p-4">
                <h3 className="font-semibold text-center">Pagamento com Cartão</h3>
                <Separator />
                <div className="flex justify-between text-sm">
                    <span>Subtotal dos produtos</span>
                    <span>R$ {cartTotal.toFixed(2).replace('.',',')}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto ({appliedCoupon?.code || couponCode})</span>
                        <span>- R$ {discount.toFixed(2).replace('.',',')}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span>Acréscimo do cartão</span>
                    <span>+ R$ {totalAcrescimoCartao.toFixed(2).replace('.',',')}</span>
                </div>
                {shippingCost !== null && (
                    <div className="flex justify-between text-sm">
                        <span>Frete</span>
                        <span>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2).replace('.',',')}`}</span>
                    </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                    <span>Total a pagar</span>
                    <span>R$ {(finalTotal + totalAcrescimoCartao).toFixed(2).replace('.',',')}</span>
                </div>
                <Wallet initialization={{ preferenceId }} customization={{ texts: { valueProp: 'smart_option'}}} />
            </div>
           )}

          {pixStatus === 'generated' && pixData && (
            <div className="mt-6 text-center animate-in fade-in-50">
                <h3 className="font-semibold mb-2">Pague com este QR Code</h3>
                <Image
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="PIX QR Code"
                    width={200}
                    height={200}
                    className="mx-auto rounded-md"
                />
                <div className="relative mt-3">
                    <Input value={pixData.qr_code} readOnly />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() => {
                            navigator.clipboard.writeText(pixData.qr_code);
                            toast({ title: 'Código PIX copiado!' });
                        }}
                    >
                        <Copy size={16} />
                    </Button>
                </div>
                {showVerificationPrompt && (
                    <div className="mt-6 p-4 bg-secondary rounded-lg animate-in fade-in-50">
                        <p className="font-semibold">O pagamento já foi efetuado?</p>
                        <div className="mt-3 flex justify-center gap-4">
                            <Button onClick={handleConfirmPixVerification}>Sim</Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: 'Ok, sem pressa.',
                                  description: 'Estamos aguardando a confirmação do seu pagamento.',
                                });
                              }}
                            >
                              Não
                            </Button>
                        </div>
                    </div>
                )}
            </div>
          )}
          
           {pixStatus === 'pending_verification' && (
            showNightMessageForPix ? (
                <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                    <CheckCircle className="mx-auto h-10 w-10 mb-3 text-green-600" />
                    <h3 className="font-bold text-lg">Compra finalizada com sucesso.</h3>
                    <p className="text-sm max-w-md mx-auto">
                        Recebemos seu pedido normalmente. Como a compra foi feita durante a madrugada, a validação do pagamento será feita a partir das 07:00 da manhã. Pode ficar tranquilo(a), assim que for validado o pedido aparece normalmente no sistema.
                    </p>
                </div>
            ) : (
                <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                    <Loader2 className="mx-auto h-10 w-10 mb-3 animate-spin" />
                    <h3 className="font-bold text-lg">Pagamento em análise</h3>
                    <p className="text-sm">Fique tranquilo, assim que confirmarmos o Pix você será notificado. Seu dinheiro está em boas mãos.</p>
                </div>
            )
           )}
           
           {pixStatus === 'confirmed' && (
             <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                <CheckCircle className="mx-auto h-10 w-10 mb-3" />
                <h3 className="font-bold text-lg">Pagamento confirmado com sucesso!</h3>
                <p className="text-sm">Seu pedido já está sendo preparado. Você pode acompanhá-lo em 'Meus Pedidos'.</p>
                 <Button asChild className="mt-4">
                    <a href="/minha-conta">Ir para Meus Pedidos</a>
                </Button>
            </div>
           )}
           
            {pixStatus === 'rejected' && (
                 <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
                    <AlertCircle className="mx-auto h-10 w-10 mb-3" />
                    <h3 className="font-bold text-lg">Pagamento não identificado</h3>
                    <p className="text-sm">Não conseguimos confirmar seu pagamento. Por favor, tente novamente ou verifique se o pagamento foi concluído no seu banco.</p>
                     <Button onClick={() => setPixStatus('idle')} className="mt-4">Tentar Novamente</Button>
                </div>
            )}

            {pixStatus === 'error' && (
                 <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <XCircle className="mx-auto h-10 w-10 mb-3" />
                    <h3 className="font-bold text-lg">Ocorreu um erro</h3>
                    <p className="text-sm">Não foi possível processar seu pagamento. Por favor, tente novamente.</p>
                    <Button onClick={() => setPixStatus('idle')} className="mt-4">Tentar Novamente</Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
