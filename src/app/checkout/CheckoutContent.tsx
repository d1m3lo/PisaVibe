
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";
import { fixImageUrl } from "@/lib/utils";
import { Loader2, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

type PixStatus = 'idle' | 'generated' | 'pending_verification' | 'confirmed' | 'error';

export default function CheckoutContent() {
  const { user } = useUser();
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [pixData, setPixData] = useState<any>(null);
  const [pixStatus, setPixStatus] = useState<PixStatus>('idle');
  const [showVerification, setShowVerification] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

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

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (key) initMercadoPago(key, { locale: "pt-BR" });
  }, []);
  
   useEffect(() => {
    if (pixStatus === 'generated') {
      const timer = setTimeout(() => {
        setShowVerification(true);
      }, 8000); // 8 segundos
      return () => clearTimeout(timer);
    }
  }, [pixStatus]);


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

  const handlePixPayment = async () => {
    if (!validateForm() || !user) return;

    setIsGeneratingPix(true);
    setShowVerification(false);
    setPixStatus('idle');

    try {
      const res = await fetch(
        "https://us-central1-studio-4155277971-b1669.cloudfunctions.net/createPixPayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: cartTotal,
            email: shippingInfo.email,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      setPixData(data);
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
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
      return;
    }

    setPixStatus('pending_verification');
    
    try {
      await addDoc(collection(firestore, 'unverified-orders'), {
        userId: user.uid,
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
          price: item.product.price,
          imageUrl: fixImageUrl(item.selectedImage || item.variant.images[0])
        })),
        totalAmount: cartTotal,
        shippingAddress: `${shippingInfo.street}, ${shippingInfo.number}, ${shippingInfo.neighborhood}, ${shippingInfo.city}, ${shippingInfo.state}`,
        paymentMethod: 'pix',
        status: 'Pagamento em análise',
        createdAt: new Date().toISOString(),
        paymentId: pixData.payment_id,
      });

      clearCart();
      
    } catch (error) {
       console.error("Erro ao enviar para verificação:", error);
       setPixStatus('error');
       toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar o pagamento para análise." });
    }
  };

  const handleCardPayment = async () => {
    if (!validateForm() || !user) return;

    const res = await fetch("/api/mercadopago/preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems,
        amount: cartTotal,
        email: shippingInfo.email,
        shippingInfo,
      }),
    });

    const data = await res.json();
    setPreferenceId(data.preferenceId);
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
          {cartItems.map((item, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <Image
                src={fixImageUrl(item.variant.images[0])}
                alt={item.displayName || item.product.name}
                width={60}
                height={60}
              />
              <div>
                <p className="font-semibold">{item.displayName || item.product.name}</p>
                <p className="text-sm text-muted-foreground">R$ {item.product.price.toFixed(2).replace('.',',')}</p>
              </div>
            </div>
          ))}

          <Separator className="my-4" />
          <p className="font-bold mb-4 text-lg">Total: R$ {cartTotal.toFixed(2).replace('.',',')}</p>

          <Button className="w-full mb-3" onClick={handlePixPayment} disabled={isGeneratingPix || pixStatus !== 'idle'}>
            {isGeneratingPix ? <Loader2 className="animate-spin" /> : "Pagar com PIX"}
          </Button>

          <Button className="w-full mb-3" variant="outline" onClick={handleCardPayment} disabled={pixStatus !== 'idle'}>
            Pagar com Cartão
          </Button>

          {preferenceId && <Wallet initialization={{ preferenceId }} />}

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
                {showVerification && (
                    <div className="mt-6 p-4 bg-secondary rounded-lg animate-in fade-in-50">
                        <p className="font-semibold">O pagamento já foi efetuado?</p>
                        <div className="mt-3 flex justify-center gap-4">
                            <Button onClick={handleConfirmPixVerification}>Sim</Button>
                            <Button variant="outline" onClick={() => setShowVerification(false)}>Não</Button>
                        </div>
                    </div>
                )}
            </div>
          )}
          
           {pixStatus === 'pending_verification' && (
             <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                <CheckCircle className="mx-auto h-10 w-10 mb-3" />
                <h3 className="font-bold text-lg">Pagamento em análise</h3>
                <p className="text-sm">Fique tranquilo, assim que confirmarmos o Pix você será notificado. Seu dinheiro está em boas mãos.</p>
            </div>
           )}

            {pixStatus === 'error' && (
                 <div className="mt-6 text-center animate-in fade-in-50 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <AlertCircle className="mx-auto h-10 w-10 mb-3" />
                    <h3 className="font-bold text-lg">Ocorreu um erro</h3>
                    <p className="text-sm">Não foi possível processar seu pagamento. Por favor, tente novamente.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
