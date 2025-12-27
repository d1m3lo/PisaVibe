"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import type { Product } from "@/lib/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  return (
    <Button size="lg" className="w-full" onClick={() => addToCart(product)}>
      Adicionar ao Carrinho
    </Button>
  );
}
