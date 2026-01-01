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
import { loadStripe } from '@stripe/stripe-js';


export default function CheckoutPage() {
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
  
  const shippingFormRef = useRef<HTMLDivElement>(null);

  const STRIPE_CHECKOUT_URL = "/api/createStripeCheckoutSession";
  
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    // Clear cart if payment was successful
    if (searchParams.get('session_id')) {
      toast({
        title: 'Compra realizada com sucesso!',
        description: 'Seu pedido foi recebido e está sendo processado. Obrigado!',
      });
      clearCart();
    }
  }, [searchParams, clearCart, toast]);


  useEffect(() => {
    if (!isUserLoading && cartItems.length === 0 && !searchParams.get('session_id')) {
      router.push("/");
    }
    if (user && !shippingInfo.email) {
      setShippingInfo(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      }));
    }
  }, [cartItems.length, router, isUserLoading, user, shippingInfo.email, searchParams]);

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

  const isShippingFormInvalid = !shippingInfo.name || !shippingInfo.email;
  const isCheckoutDisabled = isShippingFormInvalid || isProcessing;

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
    setShippingInfo(prev => ({ ...prev, [id]: value }));
  }

  const handleCheckout = async () => {
    if (isShippingFormInvalid || !user) {
        toast({
            variant: "destructive",
            title: "Formulário Incompleto",
            description: "Por favor, preencha todos os dados de contato.",
        });
        shippingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    setIsProcessing(true);

    try {
        // Prepare a clean list of items for the backend
        const lineItems = cartItems.map(item => ({
            productId: item.product.id,
            variantId: item.variant.id,
            name: item.product.name,
            displayName: item.displayName,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
            variantColor: item.variant.color,
            imageUrl: fixImageUrl(
                (item.product.subCategory === 'mochilas' && item.selectedImage) 
                ? item.selectedImage 
                : item.variant.images[0]
            ),
            selectedImage: item.selectedImage
        }));
        
        const response = await fetch(STRIPE_CHECKOUT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: lineItems,
                userEmail: shippingInfo.email,
                success_url: `${window.location.origin}/checkout`,
                cancel_url: `${window.location.origin}/checkout`,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || "Falha ao iniciar o pagamento.");
        }
        
        const { url } = responseData;
        if (!url) {
            throw new Error("Não foi possível obter a URL de pagamento.");
        }
        
        router.push(url);

    } catch (error: any) {
        console.error("Erro durante o checkout com Stripe:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Finalizar a Compra",
            description: error.message || "Não foi possível processar seu pedido. Tente novamente.",
        });
        setIsProcessing(false);
    }
  };


  if (cartItems.length === 0 && !isUserLoading) {
     if (searchParams.get('session_id')) {
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
                <Card ref={shippingFormRef}>
                <CardHeader>
                    <CardTitle>1. Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" value={shippingInfo.name} onChange={handleInfoChange} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={shippingInfo.email} onChange={handleInfoChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone (Opcional)</Label>
                            <Input id="phone" value={shippingInfo.phone} onChange={handleInfoChange} placeholder="(00) 00000-0000"/>
                        </div>
                    </div>
                     <p className="text-sm text-muted-foreground pt-4">O endereço de entrega será solicitado na página de pagamento segura da Stripe.</p>
                </CardContent>
                </Card>
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
                            disabled={isApplyingCoupon || !!appliedCoupon}
                        />
                        <Button 
                            onClick={handleApplyCoupon} 
                            disabled={isApplyingCoupon || !!appliedCoupon}
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
                <Button size="lg" className="w-full h-12 text-lg" onClick={handleCheckout} disabled={isCheckoutDisabled}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                     `Pagar R$ ${finalTotal.toFixed(2).replace('.', ',')}`
                  )}
                </Button>
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
