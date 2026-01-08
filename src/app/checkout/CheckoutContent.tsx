
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
import { useState, useEffect, useRef, useCallback } from "react";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, collection, query, where, onSnapshot, getDocs, getDoc, doc } from "firebase/firestore";
import { fixImageUrl } from "@/lib/utils";
import { Loader2, Copy, CheckCircle, AlertCircle, XCircle, TicketPercent, Check, X } from "lucide-react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import type { Order, Coupon } from "@/lib/types";

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

  const finalTotal = cartTotal - discount;

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
        // Não precisa mais do listener do unverified
      }
    });

    // Timeout caso o admin demore muito ou recuse
    const rejectionTimeout = setTimeout(() => {
        getDocs(q).then(snapshot => {
             // Se depois do timeout o pedido ainda não foi criado, consideramos recusado
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
    !shippingInfo.street ||
    !shippingInfo.number ||
    !shippingInfo.city ||
    !shippingInfo.state;

  const validateForm = () => {
    if (isInvalid) {
      toast({
        variant: "destructive",
        title: "Preencha os dados de entrega",
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
        "https://us-central1-studio-4155277971-b1669.cloudfunctions.net/createPixPayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalTotal, // Usar o total com desconto
            email: shippingInfo.email,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");
      
      setPixData(data);
      setLastPaymentId(data.payment_id); // Salva o ID para o listener
      setPixStatus('generated');

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

    setPixStatus('pending_verification');

    const unverifiedOrderData: any = {
      userId: user.uid,
      originalSessionId: lastPaymentId,
      customerInfo: {
        name: shippingInfo.name,
        email: shippingInfo.email,
      },
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.displayName || item.product.name,
        variantColor: item.variant.color,
        size: item.size,
        quantity: item.quantity,
        price: item.variant.price,
        imageUrl: fixImageUrl(item.selectedImage || item.variant.images[0])
      })),
      totalAmount: finalTotal,
      shippingAddress: `${shippingInfo.street}, ${shippingInfo.number}, ${shippingInfo.neighborhood}, ${shippingInfo.city}, ${shippingInfo.state}`,
      paymentMethod: 'pix',
      status: 'Pagamento em análise',
      createdAt: new Date().toISOString(),
      discountAmount: discount,
    };

    if (appliedCoupon) {
      unverifiedOrderData.couponCode = appliedCoupon.code;
    }
    
    try {
      await addDoc(collection(firestore, 'unverified-orders'), unverifiedOrderData);
      
    } catch (error) {
       console.error("Erro ao enviar para verificação:", error);
       setPixStatus('error');
       toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar o pagamento para análise." });
    }
  };

  const handleCardPayment = async () => {
    if (!validateForm() || !user) return;
  
    const formattedItems = cartItems.map((item) => ({
      id: item.product.id,
      title: item.displayName || item.product.name,
      quantity: item.quantity,
      unit_price: item.variant.price,
      description: `${item.variant.color} / ${item.size}`,
      picture_url: fixImageUrl(item.selectedImage || item.variant.images[0]),
    }));
  
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: formattedItems,
          shippingInfo,
          coupon: appliedCoupon,
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

    if (zipCode.length === 8) {
      try {
        const response = await fetch(`/api/cep/${zipCode}`);
        if (!response.ok) {
            console.error("A resposta da API de CEP não foi OK.");
            return;
        }
        const data = await response.json();
        if (!data.error) {
          setShippingInfo(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
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
                <Input id="phone" type="tel" value={shippingInfo.phone} onChange={handleInputChange} placeholder="(XX) XXXXX-XXXX"/>
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
          <ScrollArea className="h-auto max-h-48 pr-4">
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
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {cartTotal.toFixed(2).replace('.',',')}</span>
            </div>
            {discount > 0 && (
                 <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><TicketPercent size={14}/> Desconto ({appliedCoupon?.code})</span>
                    <span>- R$ {discount.toFixed(2).replace('.',',')}</span>
                </div>
            )}
            <Separator />
             <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>R$ {finalTotal.toFixed(2).replace('.',',')}</span>
            </div>
          </div>
          

          <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={handlePixPayment} disabled={isGeneratingPix || pixStatus !== 'idle'}>
                {isGeneratingPix ? <Loader2 className="animate-spin" /> : "Pagar com PIX"}
              </Button>

              <Button className="w-full" variant="outline" onClick={handleCardPayment} disabled={pixStatus !== 'idle' || !!preferenceId}>
                Pagar com Cartão
              </Button>
          </div>

          {preferenceId && (
            <div className="mt-4">
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
             <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                <Loader2 className="mx-auto h-10 w-10 mb-3 animate-spin" />
                <h3 className="font-bold text-lg">Pagamento em análise</h3>
                <p className="text-sm">Fique tranquilo, assim que confirmarmos o Pix você será notificado. Seu dinheiro está em boas mãos.</p>
            </div>
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

    