"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import type { Product } from "@/lib/types";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({ product, ...props }: { product: Product } & React.ComponentProps<typeof Button>) {
  const { addToCart } = useCart();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  }

  if(props.size === 'icon'){
    return (
       <Button size="icon" variant="outline" onClick={handleClick} {...props}>
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">Adicionar ao Carrinho</span>
        </Button>
    )
  }

  return (
    <Button size="lg" className="w-full" onClick={handleClick} {...props}>
      Adicionar ao Carrinho
    </Button>
  );
}
