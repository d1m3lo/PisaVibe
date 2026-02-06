
"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "./ui/button";
import type { Product, Variant } from "@/lib/types";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product, variant, ...props }: { product: Product; variant?: Variant } & React.ComponentProps<typeof Button>) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        toast({
            variant: "destructive",
            title: "Acesso Necessário",
            description: "Para adicionar produtos ao carrinho, por favor, faça o login ou crie sua conta.",
        });
        return;
    }

    // Use passed variant or default to first one
    const variantToAdd = variant || product.variants[0];
    if (!variantToAdd) {
        toast({ variant: "destructive", title: "Produto indisponível", description: "Este produto não possui variantes de cor." });
        return;
    }

    const firstAvailableSize = variantToAdd.sizes.find(s => s.stock > 0);
    if (!firstAvailableSize) {
        toast({ variant: "destructive", title: "Produto esgotado", description: "Não há tamanhos disponíveis para esta cor." });
        return;
    }

    // Pass the image of the selected variant to the cart
    addToCart(product, variantToAdd, firstAvailableSize.size, 1, variantToAdd.images?.[0]);
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
