
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartSheetContent } from "@/components/cart-sheet";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { cartItems } = useCart();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Seu Carrinho</h1>
      <CartSheetContent showEmptyState />
      {cartItems.length === 0 && (
         <div className="text-center mt-8">
            <Button asChild>
                <Link href="/produtos">Continuar Comprando</Link>
            </Button>
         </div>
      )}
    </div>
  );
}
