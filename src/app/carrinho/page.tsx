
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { CartSheetContent } from "@/components/cart-sheet";

export default function CartPage() {

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-headline text-4xl font-bold">Seu Carrinho</h1>
      <CartSheetContent showEmptyState />
    </div>
  );
}
