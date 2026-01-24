"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import AddToCartButton from "./add-to-cart-button";
import { QualityBadge } from "./quality-badge";
import { useState } from "react";
import { cn, fixImageUrl } from "@/lib/utils";
import { Globe } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ColorSwatch } from "./color-swatch";
import { SecuritySeal } from "./security-seal";

interface ProductCardProps {
  product: Product;
}

const ImportedProductBadge = () => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                 <div className="z-20">
                    <Badge variant="outline" className="select-none items-center gap-1 border-red-300 bg-red-600/90 px-2.5 py-1 text-xs text-white shadow-md transition-transform duration-200 hover:-translate-y-1">
                        <Globe className="h-3 w-3" />
                        <span className="font-bold uppercase tracking-wider">Importado</span>
                    </Badge>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Este é um produto de origem internacional.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
)

export function ProductCard({ product }: ProductCardProps) {
  const firstVariant = product.variants?.[0];
  const secondVariant = product.variants?.[1];
  
  const firstImage = fixImageUrl(firstVariant?.images?.[0]);
  const secondImage = fixImageUrl(secondVariant?.images?.[0] ?? firstImage);

  const [isHovered, setIsHovered] = useState(false);
  
  const hasMultipleVariants = !!secondVariant && !!secondImage && firstImage !== secondImage;

  const price = firstVariant?.price ?? 0;
  const oldPrice = firstVariant?.oldPrice;

  return (
    <Card 
      className="flex h-full transform flex-col rounded-lg border-0 shadow-sm transition-transform duration-300 hover:shadow-lg hover:-translate-y-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/produtos/${product.id}`} className="flex h-full flex-col">
        <CardHeader className="p-0 relative">
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
              {product.isImported && <ImportedProductBadge />}
          </div>
          <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-2">
            <QualityBadge quality={product.quality} size="sm" />
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
            
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
          {product.variants && product.variants.length > 1 && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                {product.variants.slice(0, 5).map((variant) => (
                  <ColorSwatch
                    key={variant.id}
                    colorHex={variant.colorHex}
                    title={variant.color}
                    className="h-5 w-5"
                  />
                ))}
                {product.variants.length > 5 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
                    +{product.variants.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="flex items-end justify-between p-4 pt-0">
        <div className="flex flex-col items-start">
            {oldPrice && oldPrice > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                R$ {oldPrice.toFixed(2).replace(".", ",")}
                </span>
            )}
            <span className="text-lg font-bold">
                R$ {price.toFixed(2).replace(".", ",")}
            </span>
            <SecuritySeal variant="compact" className="mt-2" />
        </div>
        <AddToCartButton product={product} size="icon" />
      </CardFooter>
    </Card>
  );
}
