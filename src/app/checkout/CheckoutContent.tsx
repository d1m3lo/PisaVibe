
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
import type { Coupon } from "@/lib/types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { fixImageUrl } from "@/lib/utils";
import { Loader2, Copy } from "lucide-react";

export default function CheckoutContent() {
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
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const [pixData, setPixData] = useState<{
    qrCodeBase64: string;
    payload: string;
  } | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

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

  useEffect(() => {
    if (!isUserLoading && cartItems.length === 0) {
      router.push("/");
    }

    if (user && !shippingInfo.email) {
      setShippingInfo((prev) => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      }));
    }
  }, [cartItems.length, router, isUserLoading, user, shippingInfo.email]);
  
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const zipCode = e.target.value.replace(/\D/g, "");
    if (zipCode.length !== 8) {
      return;
    }
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setShippingInfo((prev) => ({
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
  };

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "percentage") {
      return cartTotal * (appliedCoupon.discountValue / 100);
    }
    return appliedCoupon.discountValue;
  }, [appliedCoupon, cartTotal]);

  const finalTotal = useMemo(() => {
    const total = cartTotal - discountAmount;
    return total < 0 ? 0 : total;
  }, [cartTotal, discountAmount]);

  const isShippingFormInvalid =
    !shippingInfo.name ||
    !shippingInfo.email ||
    !shippingInfo.zipCode ||
    !shippingInfo.street ||
    !shippingInfo.number ||
    !shippingInfo.neighborhood ||
    !shippingInfo.city ||
    !shippingInfo.state;

  const validateShippingForm = () => {
    if (isShippingFormInvalid) {
      toast({
        variant: "destructive",
        title: "Formulário incompleto",
        description: "Preencha todos os dados de entrega antes de prosseguir.",
      });
      shippingFormRef.current?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    return true;
  };
  
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage("Por favor, insira um código.");
            return;
        }
        if (!firestore) return;
        
        setIsApplyingCoupon(true);
        setCouponMessage("");
        setAppliedCoupon(null);

        const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.toUpperCase()));
        
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setCouponMessage("Cupom inválido ou expirado.");
                toast({ variant: 'destructive', title: 'Cupom inválido' });
                return;
            }

            const couponDoc = querySnapshot.docs[0];
            const couponData = couponDoc.data() as Coupon;

            if (!couponData.isActive || (couponData.expiryDate && new Date(couponData.expiryDate) < new Date())) {
                setCouponMessage("Este cupom não está mais ativo.");
                 toast({ variant: 'destructive', title: 'Cupom expirado' });
                return;
            }
            
            setAppliedCoupon({ ...couponData, id: couponDoc.id });
            toast({ title: "Cupom aplicado com sucesso!" });

        } catch (error) {
            console.error("Error applying coupon:", error);
            setCouponMessage("Erro ao aplicar o cupom.");
             toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível aplicar o cupom.' });
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const createMercadoPagoPreference = async () => {
      if (!validateShippingForm()) return;
      setIsProcessing(true);

      const itemsForMP = cartItems.map(item => ({
        id: item.product.id,
        title: item.displayName || item.product.name,
        description: `${item.variant.color} / ${item.size}`,
        picture_url: fixImageUrl(item.variant.images[0]),
        quantity: item.quantity,
        unit_price: item.product.price
      }));

      try {
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsForMP, shippingInfo, coupon: appliedCoupon })
        });
        
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar preferência de pagamento');
        }

        setPreferenceId(data.preferenceId);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro no Pagamento', description: error.message });
      } finally {
        setIsProcessing(false);
      }
    };
    
  const handlePixPayment = async () => {
    if (!validateShippingForm()) return;

    setIsGeneratingPix(true);
    setPixData(null);

    try {
      const response = await fetch(
        "https://us-central1-studio-4155277971-b1669.cloudfunctions.net/createPixPayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(finalTotal.toFixed(2)),
            email: shippingInfo.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar PIX");
      }

      setPixData({
        qrCodeBase64: data.qr_code_base64,
        payload: data.qr_code,
      });

      toast({
        title: "PIX gerado com sucesso",
        description: "Escaneie o QR Code ou copie o código.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no PIX",
        description: error.message,
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Código PIX copiado!" });
  };
  
    if (cartItems.length === 0 && !isUserLoading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold">Seu carrinho está vazio.</h1>
                <Button asChild className="mt-4">
                    <Link href="/produtos">Voltar para a loja</Link>
                </Button>
            </div>
        );
    }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Checkout</h1>
      
       <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div ref={shippingFormRef} className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Informações de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input name="name" value={shippingInfo.name} onChange={handleShippingChange} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input name="email" type="email" value={shippingInfo.email} onChange={handleShippingChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input name="phone" type="tel" value={shippingInfo.phone} onChange={handleShippingChange} placeholder="(XX) XXXXX-XXXX" />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="zipCode">CEP</Label>
                                <Input name="zipCode" value={shippingInfo.zipCode} onChange={handleShippingChange} onBlur={handleZipCodeBlur} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="street">Rua</Label>
                                <Input name="street" value={shippingInfo.street} onChange={handleShippingChange} required />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="number">Número</Label>
                                <Input name="number" value={shippingInfo.number} onChange={handleShippingChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="complement">Complemento</Label>
                                <Input name="complement" value={shippingInfo.complement} onChange={handleShippingChange} placeholder="Apto, Bloco" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input name="neighborhood" value={shippingInfo.neighborhood} onChange={handleShippingChange} required />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input name="city" value={shippingInfo.city} onChange={handleShippingChange} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="state">Estado</Label>
                                <Input name="state" value={shippingInfo.state} onChange={handleShippingChange} required />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Resumo do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {cartItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <Image
                                        src={fixImageUrl(item.variant.images[0])}
                                        alt={item.product.name}
                                        width={64}
                                        height={64}
                                        className="rounded-md border object-cover"
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.displayName || item.product.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.quantity} x R$ {item.product.price.toFixed(2).replace('.',',')}
                                        </p>
                                    </div>
                                    <p className="font-semibold">
                                        R$ {(item.product.price * item.quantity).toFixed(2).replace('.',',')}
                                    </p>
                                </div>
                            ))}
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="coupon">Cupom de Desconto</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="coupon" 
                                        placeholder="INSIRA SEU CUPOM"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={isApplyingCoupon}
                                    />
                                    <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
                                        {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                                    </Button>
                                </div>
                                {couponMessage && <p className="text-sm text-destructive">{couponMessage}</p>}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>R$ {cartTotal.toFixed(2).replace('.',',')}</span>
                                </div>
                                {appliedCoupon && (
                                     <div className="flex justify-between text-green-600">
                                        <span className="text-muted-foreground">Desconto ({appliedCoupon.code})</span>
                                        <span>- R$ {discountAmount.toFixed(2).replace('.',',')}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>R$ {finalTotal.toFixed(2).replace('.',',')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                          <Button
                              size="lg"
                              className="w-full h-12 text-lg"
                              onClick={createMercadoPagoPreference}
                              disabled={isProcessing || !!preferenceId}
                          >
                            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {isProcessing ? "Processando..." : "Pagar com Cartão"}
                          </Button>
                          
                           <Button
                              size="lg"
                              variant="outline"
                              className="w-full mt-4"
                              onClick={handlePixPayment}
                              disabled={isGeneratingPix || !!pixData}
                            >
                              {isGeneratingPix ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                              {isGeneratingPix ? "Gerando PIX..." : "Pagar com PIX"}
                            </Button>

                          {pixData && (
                            <Card className="mt-6">
                              <CardHeader>
                                <CardTitle>Pague com PIX</CardTitle>
                              </CardHeader>
                              <CardContent className="flex flex-col items-center gap-4">
                                <Image
                                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                                  alt="PIX"
                                  width={200}
                                  height={200}
                                />
                                <div className="w-full relative">
                                  <Input value={pixData.payload} readOnly />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-1 top-1/2 -translate-y-1/2"
                                    onClick={() => copyToClipboard(pixData.payload)}
                                  >
                                    <Copy />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                    </CardContent>
                </Card>
            </div>
      </div>
    </div>
  );
}

    