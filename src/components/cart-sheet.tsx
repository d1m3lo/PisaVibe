"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "./ui/scroll-area";

export function CartSheetContent({ showEmptyState = false }: { showEmptyState?: boolean }) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (cartItems.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 font-headline text-2xl font-bold">
          Seu carrinho está vazio
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione produtos para vê-los aqui.
        </p>
        <SheetClose asChild>
          <Button asChild className="mt-6">
            <Link href="/produtos">Continuar Comprando</Link>
          </Button>
        </SheetClose>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 pr-6">
          {cartItems.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-start gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
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
                  className="text-sm font-semibold hover:underline"
                >
                  {product.name}
                </Link>
                <p className="mt-1 font-bold text-sm">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </p>
                 <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-7 w-7"
                onClick={() => removeFromCart(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto pr-6">
        <Separator className="my-4" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
          </div>
           <div className="flex justify-between text-sm">
            <span>Frete</span>
            <span className="text-green-600">Grátis</span>
          </div>
          <Separator />
           <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <SheetClose asChild>
             <Button asChild size="lg" className="w-full">
                <Link href="/checkout">Finalizar Compra</Link>
              </Button>
          </SheetClose>
        </SheetFooter>
      </div>
    </div>
  );
}

export function CartSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Seu Carrinho</SheetTitle>
        </SheetHeader>
        <CartSheetContent showEmptyState />
      </SheetContent>
    </Sheet>
  );
}
