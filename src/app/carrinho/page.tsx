"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto flex h-[60vh] flex-col items-center justify-center text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 font-headline text-3xl font-bold">
          Seu carrinho está vazio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Parece que você ainda não adicionou nenhum produto.
        </p>
        <Button asChild className="mt-6">
          <Link href="/produtos">Continuar Comprando</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Seu Carrinho</h1>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-6">
            {cartItems.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <Link
                    href={`/produtos/${product.id}`}
                    className="font-semibold hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {product.category}
                  </p>
                  <p className="mt-1 font-bold">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(product.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span className="text-green-600">Grátis</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">Finalizar Compra</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
