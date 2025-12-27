
"use client";

import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product, Variant } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { QualityBadge } from "@/components/quality-badge";
import Link from "next/link";
import { ColorSwatch } from "@/components/color-swatch";


const ProductPageSkeleton = () => (
  <div className="container mx-auto max-w-5xl px-4 py-12">
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
      <div>
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="mt-4 grid grid-cols-5 gap-2">
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="aspect-square w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-col">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-4 h-8 w-1/3" />
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
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariant) {
      const defaultVariant = product.variants[0];
      setSelectedVariant(defaultVariant);
      
      const firstAvailableSize = defaultVariant.sizes.find(s => s.stock > 0);
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize.size);
      }
    }
  }, [product, selectedVariant]);
  
  useEffect(() => {
    if (!carouselApi) return;
    
    setCurrentSlide(carouselApi.selectedScrollSnap());

    const handleSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);


  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    carouselApi?.scrollTo(0, true);
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

  if (isLoading || !id) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
        <div className="container mx-auto px-4 py-12 text-center h-96 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold">Produto não encontrado</h1>
            <p className="text-muted-foreground">O produto que você está procurando não existe ou foi removido.</p>
            <Button asChild className="mt-8">
                <Link href="/produtos">Voltar para a loja</Link>
            </Button>
        </div>
    )
  }

  const allImages = selectedVariant?.images ?? [];
  const categoryTitle = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  const subCategoryTitle = product.subCategory ? ' / ' + product.subCategory.charAt(0).toUpperCase() + product.subCategory.slice(1) : '';

  const sortedSizes = useMemo(() => {
    if (!selectedVariant?.sizes) return [];
    
    const sizeOrder: Record<string, number> = { 'P': 1, 'M': 2, 'G': 3, 'GG': 4 };
    
    return [...selectedVariant.sizes].sort((a, b) => {
        const aIsNumeric = !isNaN(parseFloat(a.size));
        const bIsNumeric = !isNaN(parseFloat(b.size));

        if (aIsNumeric && bIsNumeric) {
            return parseFloat(a.size) - parseFloat(b.size);
        }
        if (!aIsNumeric && !bIsNumeric) {
            return (sizeOrder[a.size.toUpperCase()] || 99) - (sizeOrder[b.size.toUpperCase()] || 99);
        }
        // Keep numeric and non-numeric sizes grouped
        return aIsNumeric ? -1 : 1;
    });
  }, [selectedVariant?.sizes]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        
        {/* Image Gallery */}
        <div className="grid grid-cols-1 gap-4">
            <Carousel 
              setApi={setCarouselApi} 
              className="w-full"
              opts={{
                loop: true,
              }}
            >
              <CarouselContent>
                {allImages.length > 0 ? (
                  allImages.map((img, index) => (
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
                  ))
                ) : (
                  <CarouselItem>
                    <div className="flex h-full aspect-square w-full items-center justify-center rounded-lg bg-secondary">
                        <span className="text-muted-foreground">Sem imagem</span>
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
               {allImages.length > 1 && (
                  <>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                  </>
                )}
            </Carousel>

            {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {allImages.map((img, index) => (
                        <button
                            key={index}
                            className={cn(
                                "relative aspect-square w-full overflow-hidden rounded-md transition-all",
                                currentSlide === index ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
                            )}
                            onClick={() => carouselApi?.scrollTo(index)}
                        >
                            <Image
                                src={img}
                                alt={`${product.name} - Miniatura ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
             <div>
                <p className="text-sm text-muted-foreground">{categoryTitle}{subCategoryTitle}</p>
                <h1 className="font-headline text-3xl font-bold md:text-4xl">
                    {product.name}
                </h1>
             </div>
            <QualityBadge quality={product.quality} />
          </div>
          
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-bold">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </p>
             {product.oldPrice && (
                <p className="text-xl text-muted-foreground line-through">
                  R$ {product.oldPrice.toFixed(2).replace(".", ",")}
                </p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold">Descrição</h3>
            <p className="mt-2 text-muted-foreground">{product.longDescription}</p>
          </div>
          
           <div className="mt-8">
            <h3 className="mb-2 text-sm font-semibold">Cor: <span className="font-normal">{selectedVariant?.color}</span></h3>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  className={cn(
                    "relative rounded-full transition-all",
                    selectedVariant?.id === variant.id ? "scale-110 ring-2 ring-offset-2 ring-primary" : ""
                  )}
                >
                  <ColorSwatch
                    colorHex={variant.colorHex}
                    title={variant.color}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
             <h3 className="mb-2 text-sm font-semibold">Tamanho:</h3>
             <div className="flex flex-wrap gap-2">
              {sortedSizes.map(({ size, stock }) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  onClick={() => setSelectedSize(size)}
                  disabled={stock === 0}
                  className={cn(
                    "w-16",
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
