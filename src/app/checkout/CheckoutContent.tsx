
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
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect, useRef } from "react";
import type { Coupon, Order } from "@/lib/types";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { fixImageUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';


const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });
} else {
  console.error("Chave pública do Mercado Pago não encontrada.");
}


export default function CheckoutContent() {
  const { user, isUserLoading } = useUser();
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const contactFormRef = useRef<HTMLDivElement>(null);
  
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    
    if (paymentStatus === 'approved' && paymentId) {
      toast({
        title: 'Compra realizada com sucesso!',
        description: 'Seu pedido foi recebido e está sendo processado. Obrigado!',
      });
      clearCart();
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
       toast({
        variant: "destructive",
        title: 'Pagamento falhou',
        description: 'Não foi possível processar seu pagamento. Por favor, tente novamente.',
      });
    }

  }, [searchParams, clearCart, toast]);


  useEffect(() => {
    if (!isUserLoading && cartItems.length === 0 && !searchParams.get('payment_id')) {
      router.push("/");
    }
    if (user && !contactInfo.email) {
      setContactInfo(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      }));
    }
  }, [cartItems.length, router, isUserLoading, user, contactInfo.email, searchParams]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return cartTotal * (appliedCoupon.discountValue / 100);
    }
    return appliedCoupon.discountValue;
  }, [appliedCoupon, cartTotal]);

  const finalTotal = useMemo(() => {
      const total = cartTotal - discountAmount;
      return total < 0 ? 0 : total;
  }, [cartTotal, discountAmount]);

  const isContactFormInvalid = !contactInfo.name || !contactInfo.email;
  const isCheckoutDisabled = isContactFormInvalid || isProcessing || !isPaymentReady;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
        setCouponMessage("Por favor, insira um código de cupom.");
        return;
    }
    if (!firestore) return;

    setIsApplyingCoupon(true);
    setCouponMessage("");
    setAppliedCoupon(null);

    try {
        const couponsRef = collection(firestore, 'coupons');
        const q = query(couponsRef, where('code', '==', couponCode.toUpperCase().trim()), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setCouponMessage("Cupom inválido ou expirado.");
            toast({ variant: 'destructive', title: 'Cupom Inválido' });
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const couponData = { ...couponDoc.data(), id: couponDoc.id } as Coupon;
        
        const expiryDate = couponData.expiryDate ? new Date(couponData.expiryDate) : null;
        if (expiryDate && expiryDate < new Date()) {
            setCouponMessage("Este cupom expirou.");
            toast({ variant: 'destructive', title: 'Cupom Expirado' });
            return;
        }

        setAppliedCoupon(couponData);
        setCouponMessage("Cupom aplicado com sucesso!");
        toast({ title: 'Cupom Aplicado!', description: 'O desconto foi aplicado ao seu total.' });

    } catch (error) {
        console.error("Error applying coupon:", error);
        setCouponMessage("Erro ao aplicar o cupom. Tente novamente.");
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível aplicar o cupom.' });
    } finally {
        setIsApplyingCoupon(false);
    }
  }

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setContactInfo(prev => ({ ...prev, [id]: value }));
  }

  const handleStartCheckout = async () => {
    if (isContactFormInvalid || !user) {
        toast({
            variant: "destructive",
            title: "Formulário Incompleto",
            description: "Por favor, preencha todos os dados de contato.",
        });
        contactFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (preferenceId) {
        // Preference already created, maybe just scroll to payment form
        document.getElementById('payment-brick-container')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    setIsProcessing(true);

    try {
        const validItems = cartItems.filter(item => item && item.product && item.product.price > 0);

        if (validItems.length === 0) {
            throw new Error("Nenhum item válido para processar.");
        }
        
        const lineItems = validItems.map(item => ({
            id: item.product.id,
            title: item.displayName || item.product.name,
            description: `${item.variant.color} / ${item.size}`,
            picture_url: fixImageUrl((item.product.subCategory === 'mochilas' && item.selectedImage) ? item.selectedImage : item.variant.images[0]),
            quantity: item.quantity,
            unit_price: item.product.price,
        }));
        
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: lineItems,
                payer: { name: contactInfo.name, email: contactInfo.email },
                coupon: appliedCoupon,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || "Falha ao iniciar o pagamento.");
        }
        
        const { preferenceId: newPreferenceId } = responseData;
        if (!newPreferenceId) {
            throw new Error("Não foi possível obter a preferência de pagamento.");
        }
        
        setPreferenceId(newPreferenceId);

    } catch (error: any) {
        console.error("Erro durante o início do checkout com Mercado Pago:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Iniciar a Compra",
            description: error.message || "Não foi possível preparar seu pedido. Tente novamente.",
        });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const paymentInitialization = {
      amount: finalTotal,
      preferenceId: preferenceId,
  };

  const paymentCustomization = {
    visual: {
      style: {
        theme: 'default', // 'dark' ou 'bootstrap'
      },
    },
    paymentMethods: {
      creditCard: 'all' as const,
      debitCard: 'all' as const,
      ticket: 'all' as const,
      pix: 'all' as const,
    },
  };

  if (cartItems.length === 0 && !isUserLoading) {
     if (searchParams.get('payment_id')) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="font-headline text-4xl font-bold">Obrigado pela sua compra!</h1>
                <p className="mt-4 text-lg text-muted-foreground">Seu pedido foi registrado e em breve você receberá uma confirmação.</p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button asChild>
                        <Link href="/produtos">Continuar Comprando</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/minha-conta">Ver Meus Pedidos</Link>
                    </Button>
                </div>
            </div>
        )
    }
    return null;
  }

  return (
    <>
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Checkout</h1>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
            <div className="space-y-8">
                <Card ref={contactFormRef}>
                <CardHeader>
                    <CardTitle>1. Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" value={contactInfo.name} onChange={handleInfoChange} required disabled={!!preferenceId} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={contactInfo.email} onChange={handleInfoChange} required disabled={!!preferenceId}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone (Opcional)</Label>
                            <Input id="phone" value={contactInfo.phone} onChange={handleInfoChange} placeholder="(00) 00000-0000" disabled={!!preferenceId}/>
                        </div>
                    </div>
                     {!preferenceId && (
                        <Button size="lg" className="w-full mt-4" onClick={handleStartCheckout} disabled={isContactFormInvalid || isProcessing}>
                            {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparando...</> : "Continuar para Pagamento"}
                        </Button>
                    )}
                </CardContent>
                </Card>

                 {preferenceId && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div id="payment-brick-container">
                                <Payment 
                                    initialization={paymentInitialization} 
                                    customization={paymentCustomization}
                                    onReady={() => setIsPaymentReady(true)}
                                    onError={(error) => console.error(error)}
                                    onSubmit={async ({ formData }) => {
                                        // A submissão é tratada pelo Brick, aqui podemos apenas logar ou mostrar um loader.
                                        // O backend receberá a notificação via webhook.
                                        console.log("Formulário de pagamento submetido.");
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map(({ product, variant, size, quantity, selectedImage, displayName }) => {
                  const displayImage = fixImageUrl(product.subCategory === 'mochilas' && selectedImage ? selectedImage : variant.images[0]);
                  return (
                    <div key={`${product.id}-${variant.id}-${size}-${selectedImage}`} className="flex items-center gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        <Image
                            src={displayImage}
                            alt={displayName || product.name}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                            {quantity}
                            </div>
                        </div>
                        <div className="flex-grow">
                        <p className="font-semibold">{displayName || product.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {variant.color}
                            {product.subCategory !== 'mochilas' && ` / ${size}`}
                        </p>
                        </div>
                        <p className="font-semibold">
                        R$ {(product.price * quantity).toFixed(2).replace(".", ",")}
                        </p>
                    </div>
                  )
                })}
                <Separator />
                 <div className="space-y-2">
                    <Label htmlFor="coupon">Cupom de Desconto</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="coupon" 
                            placeholder="Insira seu cupom"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={isApplyingCoupon || !!appliedCoupon || !!preferenceId}
                        />
                        <Button 
                            onClick={handleApplyCoupon} 
                            disabled={isApplyingCoupon || !!appliedCoupon || !!preferenceId}
                        >
                            {isApplyingCoupon ? "Aplicando..." : "Aplicar"}
                        </Button>
                    </div>
                    {couponMessage && <p className={`text-sm ${appliedCoupon ? 'text-green-600' : 'text-destructive'}`}>{couponMessage}</p>}
                 </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                </div>
                 {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                        <span>Desconto ({appliedCoupon.code})</span>
                        <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
           <div className="mt-4 text-center text-sm">
                <Link href="/carrinho" className="text-muted-foreground hover:text-primary">
                    Voltar para o carrinho
                </Link>
            </div>
        </div>
      </div>
    </div>
    </>
  );
}
