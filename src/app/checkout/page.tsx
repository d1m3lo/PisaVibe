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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import type { Coupon, Order } from "@/lib/types";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { fixImageUrl } from "@/lib/utils";
import { Clipboard, Check } from "lucide-react";


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
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{ qrcode: string; payload: string } | null>(null);
  const [copied, setCopied] = useState(false);


  const PAYMENT_FUNCTION_URL = useMemo(() => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://processpayment-ewmivjnydq-rj.a.run.app';
    }
    // Para desenvolvimento, usamos uma URL relativa que o proxy do Next.js irá redirecionar
    return '/api/processPayment';
  }, []);
  
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    cpf: '',
    address: '',
    complemento: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    if (!isUserLoading && cartItems.length === 0) {
      router.push("/");
    }
    if (user && !shippingInfo.email) {
      setShippingInfo(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
      }));
    }
  }, [cartItems.length, router, isUserLoading, user, shippingInfo.email]);

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

  const isFormInvalid = !shippingInfo.name || !shippingInfo.email || !shippingInfo.cpf || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zip;
  
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

  const createOrderInFirestore = async () => {
    if (!user || !firestore) {
      throw new Error("Usuário ou Firestore não disponível.");
    }
    
    const fullAddress = `${shippingInfo.address}, ${shippingInfo.complemento ? shippingInfo.complemento + ', ' : ''}${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.zip}`;
    
    const orderData: Omit<Order, 'id'> = {
        userId: user.uid,
        customerInfo: {
          name: shippingInfo.name,
          email: shippingInfo.email,
          complemento: shippingInfo.complemento,
        },
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
            imageUrl: fixImageUrl((item.product.subCategory === 'mochilas' && item.selectedImage) 
                ? item.selectedImage 
                : item.variant.images[0])
        })),
        couponCode: appliedCoupon?.code,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        paymentMethod: 'pix',
    };
    
    Object.keys(orderData).forEach(key => {
      const typedKey = key as keyof typeof orderData;
      if (orderData[typedKey] === undefined) {
        delete (orderData as any)[typedKey];
      }
    });

    const userOrdersRef = collection(firestore, 'users', user.uid, 'orders');
    await addDoc(userOrdersRef, orderData);
  }

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [id]: value }));
  }

  const handleCheckout = async () => {
    if (isFormInvalid || !user) {
        toast({
            variant: "destructive",
            title: "Formulário Incompleto",
            description: "Por favor, preencha todos os dados de entrega.",
        });
        return;
    }
    setIsProcessing(true);

    try {
        const response = await fetch(PAYMENT_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: finalTotal,
                customer: {
                    name: shippingInfo.name,
                    cpf: shippingInfo.cpf,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Falha ao gerar cobrança Pix.');
        }

        const pixResult = await response.json();
        
        await createOrderInFirestore();
        
        setPixData(pixResult);
        setPixModalOpen(true);
        clearCart();
        
    } catch (error: any) {
        console.error("Erro durante o checkout:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Finalizar a Compra",
            description: error.message || "Não foi possível processar seu pedido. Tente novamente.",
        });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleCopyPixPayload = () => {
    if (pixData?.payload) {
        navigator.clipboard.writeText(pixData.payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: 'Código Pix copiado!' });
    }
  }

  if (cartItems.length === 0 && !isUserLoading) {
    return null;
  }

  return (
    <>
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Checkout</h1>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
            <div className="space-y-8">
                <Card>
                <CardHeader>
                    <CardTitle>1. Informações de Entrega e Contato</CardTitle>
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
                            <Label htmlFor="cpf">CPF</Label>
                            <Input id="cpf" value={shippingInfo.cpf} onChange={handleInfoChange} required placeholder="000.000.000-00"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input id="address" value={shippingInfo.address} onChange={handleInfoChange} required placeholder="Rua, Av, etc. e número" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="complemento">Complemento (Opcional)</Label>
                            <Input id="complemento" value={shippingInfo.complemento} onChange={handleInfoChange} placeholder="Apto, bloco, casa, etc." />
                        </div>
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

                <Card>
                <CardHeader>
                    <CardTitle>2. Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.421 21.943c-1.285 0-2.39-.421-3.27-1.284C3.27 19.796 2.85 18.69 2.85 17.405V10.15c0-1.285.42-2.39 1.284-3.27.857-.88 1.963-1.321 3.27-1.321H16.58c1.285 0 2.39.44 3.27 1.32.88.88 1.321 1.986 1.321 3.27v7.255c0 1.285-.44 2.39-1.32 3.27-.88.857-1.986 1.284-3.27 1.284H7.42Zm-.17-14.314c-.81 0-1.49.25-2.037.768-.546.518-.81 1.164-.81 1.964v7.255c0 .8.264 1.447.81 1.964.546.518 1.226.768 2.036.768H16.58c.81 0 1.49-.25 2.037-.768.546-.517.81-1.164.81-1.964V10.15c0-.8-.264-1.446-.81-1.964-.546-.518-1.226-.768-2.036-.768H7.25Zm6.39 12.01c-1.357 0-2.5-.473-3.428-1.42-1.01-1.01-1.524-2.22-1.524-3.633 0-1.357.495-2.547 1.488-3.57.993-1.024 2.172-1.536 3.537-1.536 1.357 0 2.524.488 3.5 1.464.976.976 1.464 2.172 1.464 3.57 0 1.413-.488 2.619-1.464 3.633-.976.994-2.143 1.488-3.5 1.488Zm0-1.63c.893 0 1.66-.312 2.298-.936.638-.624.948-1.38.948-2.273s-.31-1.66-.948-2.298c-.638-.638-1.405-.948-2.298-.948-.893 0-1.66.31-2.298.948-.638.638-.957 1.405-.957 2.298s.32 1.65.957 2.274c.638.624 1.405.935 2.298.935Zm-6.526-7.854c.482 0 .88.164 1.192.495.31.33.473.71.473 1.131a1.53 1.53 0 0 1-.495 1.181c-.33.31-.728.474-1.18.474-.482 0-.88-.164-1.192-.474-.31-.31-.474-.71-.474-1.18 0-.422.164-.8.495-1.132.33-.33.71-.495 1.18-.495Z" fill="currentColor"></path>
                            </svg>
                            <span className="font-semibold">Pix</span>
                        </div>
                        <div className="h-5 w-5 rounded-full border-2 border-primary bg-background ring-4 ring-transparent flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                    </div>
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
                <Button size="lg" className="w-full h-12 text-lg" onClick={handleCheckout} disabled={isFormInvalid || isProcessing}>
                  {isProcessing ? 'Processando...' : `Pagar com Pix R$ ${finalTotal.toFixed(2).replace('.', ',')}`}
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
    <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Pague com Pix</DialogTitle>
            <DialogDescription>
                Abra o app do seu banco e escaneie o QR Code ou use o código Copia e Cola.
            </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-4">
                {pixData?.qrcode && (
                    <Image 
                        src={pixData.qrcode} 
                        alt="PIX QR Code" 
                        width={250} 
                        height={250}
                        className="rounded-lg border p-2"
                    />
                )}
                <div className="w-full space-y-2">
                    <Label htmlFor="pix-payload">Pix Copia e Cola</Label>
                    <div className="relative">
                        <Input 
                            id="pix-payload"
                            value={pixData?.payload || ''}
                            readOnly
                            className="pr-10 h-11"
                        />
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleCopyPixPayload}
                        >
                            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Clipboard className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
             <Button asChild onClick={() => router.push('/minha-conta')}>
                <Link href="/minha-conta">Confirmar Pagamento e Ir para Meus Pedidos</Link>
            </Button>
        </DialogContent>
    </Dialog>
    </>
  );
}
