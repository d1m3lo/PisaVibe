"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import type { Product } from "@/lib/types";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddToCartButton({ product, ...props }: { product: Product } & React.ComponentProps<typeof Button>) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Basic logic: add the first variant and first available size
    const firstVariant = product.variants[0];
    if (!firstVariant) {
        toast({ variant: "destructive", title: "Produto indisponível", description: "Este produto não possui variantes de cor." });
        return;
    }

    const firstAvailableSize = firstVariant.sizes.find(s => s.stock > 0);
    if (!firstAvailableSize) {
        toast({ variant: "destructive", title: "Produto esgotado", description: "Não há tamanhos disponíveis para esta cor." });
        return;
    }

    addToCart(product, firstVariant, firstAvailableSize.size);
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
