
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
import { doc, onSnapshot } from "firebase/firestore";
import { fixImageUrl } from "@/lib/utils";
import { Loader2, Copy } from "lucide-react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

export default function CheckoutContent() {
  const { user } = useUser();
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [pixData, setPixData] = useState<any>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
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

  /* ===============================
     MERCADO PAGO INIT
  =============================== */
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (key) initMercadoPago(key, { locale: "pt-BR" });
  }, []);

  /* ===============================
     ESCUTA STATUS DO PIX
  =============================== */
  useEffect(() => {
    if (!pixPaymentId || !firestore) return;

    const ref = doc(firestore, "orders", pixPaymentId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.status === "approved") {
        toast({
          title: "Pagamento aprovado 🎉",
          description: "Seu pedido foi confirmado.",
        });

        clearCart();
        router.push("/minha-conta/pedidos");
      }
    });

    return () => unsub();
  }, [pixPaymentId, firestore, clearCart, router, toast]);

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

  /* ===============================
     PIX
  =============================== */
  const handlePixPayment = async () => {
    if (!validateForm() || !user) return;

    setIsGeneratingPix(true);

    try {
      const res = await fetch(
        "https://us-central1-studio-4155277971-b1669.cloudfunctions.net/createPixPayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: cartTotal,
            email: shippingInfo.email,
            userId: user.uid,
            items: cartItems,
            shippingInfo,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPixPaymentId(String(data.payment_id));
      setPixData(data);

      toast({ title: "PIX gerado com sucesso" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PIX",
        description: err.message,
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  /* ===============================
     CARTÃO (MERCADO PAGO)
  =============================== */
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
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.map((item, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <Image
                src={fixImageUrl(item.variant.images[0])}
                alt=""
                width={60}
                height={60}
              />
              <div>
                <p>{item.product.name}</p>
                <p>R$ {item.product.price}</p>
              </div>
            </div>
          ))}

          <Separator className="my-4" />
          <p className="font-bold mb-4">Total: R$ {cartTotal}</p>

          <Button className="w-full mb-3" onClick={handlePixPayment}>
            {isGeneratingPix ? <Loader2 className="animate-spin" /> : "Pagar com PIX"}
          </Button>

          <Button className="w-full mb-3" variant="outline" onClick={handleCardPayment}>
            Pagar com Cartão
          </Button>

          {preferenceId && <Wallet initialization={{ preferenceId }} />}

          {pixData && (
            <div className="mt-6 text-center">
              <Image
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="PIX"
                width={200}
                height={200}
                className="mx-auto"
              />
              <Input value={pixData.qr_code} readOnly className="mt-3" />
              <Button
                size="sm"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(pixData.qr_code)}
              >
                <Copy size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
