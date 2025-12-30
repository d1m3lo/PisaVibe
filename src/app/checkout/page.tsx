
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, FormEvent, useEffect } from "react";
import type { Coupon, Order } from "@/lib/types";
import { collection, query, where, getDocs, addDoc, doc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
      cardNumber: '',
      expiryDate: '',
      cvc: '',
  });

  useEffect(() => {
    // Redirect if cart is empty, runs only on client after mount
    if (cartItems.length === 0) {
      router.push("/");
    }
  }, [cartItems, router]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id in shippingInfo) {
      setShippingInfo(prev => ({ ...prev, [id]: value }));
    } else {
      setPaymentInfo(prev => ({ ...prev, [id]: value }));
    }
  }

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Você precisa estar logado para finalizar a compra.",
        });
        return;
    }
    setIsProcessing(true);
    
    // =================================================================
    // SIMULAÇÃO DE INTEGRAÇÃO COM A API DE PAGAMENTO (EX: MERCADO PAGO)
    // =================================================================
    try {
      // 1. SIMULAÇÃO: Validar os dados do cartão.
      if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvc) {
        throw new Error("Por favor, preencha todos os dados de pagamento.");
      }
      console.log("Simulando validação de dados do cartão...");
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. SIMULAÇÃO: O SDK do Mercado Pago criaria um token seguro aqui.
      // const cardToken = await mp.sdk.cardToken.create({ ... });
      const simulatedCardToken = `tok_${Date.now()}`;
      console.log("Simulando criação de Card Token:", simulatedCardToken);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. SIMULAÇÃO: Envio do token para um backend seguro para processar o pagamento.
      // const paymentResponse = await fetch('/api/process-payment', { 
      //   method: 'POST', 
      //   body: JSON.stringify({ token: simulatedCardToken, amount: finalTotal }) 
      // });
      // if (!paymentResponse.ok) throw new Error("Falha no pagamento.");
      console.log("Simulando envio do token ao backend e processamento...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Simulação de pagamento aprovado!");

      // 4. Se o pagamento foi aprovado (na simulação, ele sempre é), cria o pedido no Firestore.
      const fullAddress = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.zip}`;
      
      const orderData: Omit<Order, 'id'> = {
          userId: user.uid,
          customerInfo: shippingInfo,
          orderDate: new Date().toISOString(),
          totalAmount: finalTotal,
          shippingAddress: fullAddress,
          status: 'Processing',
          items: cartItems.map(item => ({
              productId: item.product.id,
              productName: item.displayName || item.product.name,
              variantColor: item.variant.color,
              size: item.size,
              quantity: item.quantity,
              price: item.product.price,
              imageUrl: (item.product.subCategory === 'mochilas' && item.selectedImage) 
                  ? item.selectedImage 
                  : item.variant.images[0]
          })),
          couponCode: appliedCoupon?.code || undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
      };
      
      // Remove campos 'undefined' antes de enviar ao Firestore
      Object.keys(orderData).forEach(key => {
        const typedKey = key as keyof typeof orderData;
        if (orderData[typedKey] === undefined) {
          delete orderData[typedKey];
        }
      });

      const userOrdersRef = collection(firestore, 'users', user.uid, 'orders');
      await addDoc(userOrdersRef, orderData);

      toast({
          title: "Compra finalizada com sucesso!",
          description: "Obrigado por comprar na PISA VIBE.",
      });
      clearCart();
      router.push("/minha-conta");

    } catch (error: any) {
        console.error("Error during checkout simulation:", error);
        toast({
            variant: "destructive",
            title: "Erro ao finalizar a compra",
            description: error.message || "Não foi possível processar seu pedido. Tente novamente.",
        });
    } finally {
        setIsProcessing(false);
    }
  }

  // Prevents rendering if cart is empty before useEffect can redirect
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Checkout</h1>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informações de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={shippingInfo.name} onChange={handleInfoChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={shippingInfo.email} onChange={handleInfoChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={shippingInfo.address} onChange={handleInfoChange} required placeholder="Rua, Av, etc. e número" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" value={shippingInfo.city} onChange={handleInfoChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" value={shippingInfo.state} onChange={handleInfoChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">CEP</Label>
                    <Input id="zip" value={shippingInfo.zip} onChange={handleInfoChange} required />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input id="cardNumber" placeholder="XXXX XXXX XXXX XXXX" value={paymentInfo.cardNumber} onChange={handleInfoChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="expiryDate">Validade</Label>
                        <Input id="expiryDate" placeholder="MM/AA" value={paymentInfo.expiryDate} onChange={handleInfoChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" value={paymentInfo.cvc} onChange={handleInfoChange} required />
                    </div>
                </div>
                 <p className="pt-2 text-xs text-muted-foreground">
                    Este é um ambiente de demonstração. Nenhum pagamento real será processado.
                 </p>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="mt-8 w-full" disabled={isProcessing || isUserLoading}>
              {isProcessing ? 'Processando pagamento...' : `Pagar R$ ${finalTotal.toFixed(2).replace('.',',')}`}
            </Button>
          </form>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map(({ product, variant, size, quantity, selectedImage, displayName }) => {
                  const displayImage = product.subCategory === 'mochilas' && selectedImage ? selectedImage : variant.images[0];
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
  );
}
