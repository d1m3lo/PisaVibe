
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, getCartItemId } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fixImageUrl } from "@/lib/utils";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex h-[50vh] flex-col items-center justify-center text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-6 font-headline text-3xl font-bold">
            Seu carrinho está vazio
          </h1>
          <p className="mt-2 text-muted-foreground">
            Adicione produtos para vê-los aqui.
          </p>
          <Button asChild className="mt-8">
            <Link href="/produtos">Continuar Comprando</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getDisplayImage = (item: typeof cartItems[0]) => {
    if (item.product.subCategory === 'mochilas' && item.selectedImage) {
        return fixImageUrl(item.selectedImage);
    }
    return fixImageUrl(item.variant.images[0]);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Seu Carrinho</h1>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <div className="flex flex-col gap-5">
              {cartItems.map((item) => {
                const cartItemId = getCartItemId(item.product, item.variant, item.size, item.selectedImage);
                return (
                  <div key={cartItemId} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={getDisplayImage(item)}
                        alt={item.displayName || item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <Link
                        href={`/produtos/${item.product.id}`}
                        className="font-semibold hover:underline"
                      >
                        {item.displayName || item.product.name}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                          {item.variant.color}
                          {item.product.subCategory !== 'mochilas' && ` / ${item.size}`}
                        </div>
                      <p className="mt-1 font-bold text-base">
                        R$ {item.product.price.toFixed(2).replace(".", ",")}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => removeFromCart(cartItemId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle>Resumo da Compra</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                        </div>
                    </div>
                     <div className="mt-6 flex flex-col gap-3">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/checkout">Finalizar Compra</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/produtos">Continuar Comprando</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
