
"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import AddToCartButton from "./add-to-cart-button";
import { QualityBadge } from "./quality-badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const fixImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  return url;
};

export function ProductCard({ product }: ProductCardProps) {
  const firstVariant = product.variants?.[0];
  const secondVariant = product.variants?.[1];
  
  const firstImage = fixImageUrl(firstVariant?.images?.[0]);
  const secondImage = fixImageUrl(secondVariant?.images?.[0] ?? firstImage);

  const [isHovered, setIsHovered] = useState(false);
  
  const hasMultipleVariants = !!secondVariant && !!secondImage && firstImage !== secondImage;

  return (
    <Card 
      className="flex h-full transform flex-col overflow-hidden rounded-lg border-0 shadow-sm transition-transform duration-300 hover:shadow-lg hover:-translate-y-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/produtos/${product.id}`} className="flex h-full flex-col">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full">
            {product.quality && (
                <div className="absolute right-2 top-2 z-20">
                    <QualityBadge quality={product.quality} size="sm" />
                </div>
            )}
            
            {firstImage && (
              <>
                {/* Main Image */}
                <Image
                  src={firstImage}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    isHovered && hasMultipleVariants ? "opacity-0" : "opacity-100"
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Hover Image */}
                {secondImage && (
                  <Image
                    src={secondImage}
                    alt={`${product.name} - segunda cor`}
                    fill
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      isHovered && hasMultipleVariants ? "opacity-100" : "opacity-0"
                    )}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                )}
              </>
            )}
            
            {!firstImage && (
               <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex items-end justify-between p-4 pt-0">
        <div className="flex flex-col items-start">
            {product.oldPrice && (
                <span className="text-xs text-muted-foreground line-through">
                R$ {product.oldPrice.toFixed(2).replace(".", ",")}
                </span>
            )}
            <span className="text-lg font-bold">
                R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
        </div>
        <AddToCartButton product={product} size="icon" />
      </CardFooter>
    </Card>
  );
}
