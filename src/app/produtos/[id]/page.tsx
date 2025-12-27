
"use client";

import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/add-to-cart-button";
import { useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product, Variant } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { QualityBadge } from "@/components/quality-badge";


const ProductPageSkeleton = () => (
  <div className="container mx-auto max-w-5xl px-4 py-12">
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
      <div>
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-16 w-16 rounded-md" />
          <Skeleton className="h-16 w-16 rounded-md" />
          <Skeleton className="h-16 w-16 rounded-md" />
        </div>
      </div>
      <div className="flex flex-col">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-4 h-8 w-1/4" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </div>
         <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-20 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
                 <Skeleton className="h-10 w-20 rounded-md" />
            </div>
        </div>
        <div className="mt-8">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  </div>
);

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { addToCart } = useCart();

  const productRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id);
  }, [firestore, id]);

  const { data: product, isLoading } = useDoc<Product>(productRef);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Set default selections once data is loaded
  useState(() => {
    if (product && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      const firstAvailableSize = product.variants[0].sizes.find(s => s.stock > 0);
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize.size);
      }
    }
  });
  
  // This effect handles changes if the product data itself changes after initial load
  // Or if the initial state setting runs before product is available
  useState(() => {
    if (product && !selectedVariant) {
      const defaultVariant = product.variants[0];
      setSelectedVariant(defaultVariant);
      if (defaultVariant) {
        const firstAvailableSize = defaultVariant.sizes.find(s => s.stock > 0);
        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize.size);
        }
      }
    }
  });


  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    // Reset size selection or pick first available
    const firstAvailableSize = variant.sizes.find(s => s.stock > 0);
    setSelectedSize(firstAvailableSize ? firstAvailableSize.size : null);
  };

  const handleAddToCart = () => {
    if (product && selectedVariant && selectedSize) {
      addToCart(product, selectedVariant, selectedSize);
    }
  };
  
  const isAddToCartDisabled = !selectedSize || (selectedVariant?.sizes.find(s => s.size === selectedSize)?.stock || 0) === 0;

  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    notFound();
  }

  const imagesToShow = selectedVariant ? selectedVariant.images : (product.variants[0]?.images || []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {imagesToShow.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                    <Image
                      src={img}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
             {imagesToShow.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
             <h1 className="font-headline text-3xl font-bold md:text-4xl">
                {product.name}
            </h1>
            <QualityBadge quality={product.quality} />
          </div>
          
          <p className="mt-4 text-3xl font-bold">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </p>
          <div className="mt-6">
            <p className="text-muted-foreground">{product.longDescription}</p>
          </div>
          
           <div className="mt-8">
            <h3 className="mb-2 text-sm font-semibold">Cor: <span className="font-normal">{selectedVariant?.color}</span></h3>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-all",
                    selectedVariant?.id === variant.id ? "border-primary scale-110" : "border-transparent"
                  )}
                   style={{ backgroundColor: variant.colorHex }}
                   title={variant.color}
                >
                  <span className="sr-only">{variant.color}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
             <h3 className="mb-2 text-sm font-semibold">Tamanho:</h3>
             <div className="flex flex-wrap gap-2">
              {selectedVariant?.sizes.sort((a,b) => a.size.localeCompare(b.size, undefined, { numeric: true })).map(({ size, stock }) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  onClick={() => setSelectedSize(size)}
                  disabled={stock === 0}
                  className={cn(
                    stock === 0 && "cursor-not-allowed bg-secondary text-muted-foreground line-through"
                  )}
                >
                  {size}
                </Button>
              ))}
             </div>
          </div>


          <div className="mt-8">
             <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={isAddToCartDisabled}>
                {isAddToCartDisabled ? (selectedVariant?.sizes.every(s => s.stock === 0) ? "Esgotado" : "Selecione um tamanho") : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
