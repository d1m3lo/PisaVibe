"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product, Variant } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import AddToCartButton from "./add-to-cart-button";
import { QualityBadge } from "./quality-badge";
import { useState, useMemo } from "react";
import { cn, fixImageUrl } from "@/lib/utils";
import { Globe, Star, StarHalf } from "lucide-react";
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
  // State for the selected variant, default to the first one
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(product.variants?.[0]);
  const [isHovered, setIsHovered] = useState(false);

  // Determine images based on selected variant
  const mainImage = fixImageUrl(selectedVariant?.images?.[0]);
  const hoverImage = fixImageUrl(selectedVariant?.images?.[1]); // Use second image of the same variant for hover
  const showHoverImage = isHovered && hoverImage && hoverImage !== mainImage;

  // Determine price based on selected variant
  const price = selectedVariant?.price ?? 0;
  const oldPrice = selectedVariant?.oldPrice;
  const acrescimoCartao = selectedVariant?.acrescimoCartao ?? 20;
  const precoCartao = price + acrescimoCartao;
  
  // Calculate Reviews safely
  const { averageRating, totalReviews } = useMemo(() => {
    const productReviews = Array.isArray(product.reviews) ? product.reviews : [];
    const total = productReviews.length;
    const avg = total > 0 
      ? productReviews.reduce((acc, r) => acc + r.rating, 0) / total 
      : 0;
    return { averageRating: avg, totalReviews: total };
  }, [product.reviews]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-3 w-3 text-muted-foreground" />);
      }
    }
    return stars;
  };

  const handleColorClick = (e: React.MouseEvent, variant: Variant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variant);
  }

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
            
            {mainImage ? (
              <>
                {/* Main Image */}
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    showHoverImage ? "opacity-0" : "opacity-100"
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Hover Image */}
                {hoverImage && (
                  <Image
                    src={hoverImage}
                    alt={`${product.name} - segunda cor`}
                    fill
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      showHoverImage ? "opacity-100" : "opacity-0"
                    )}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                )}
              </>
            ) : (
               <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
          
          {/* Rating Display */}
          {totalReviews > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex items-center">
                {renderStars(averageRating)}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">({totalReviews})</span>
            </div>
          )}

          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          {product.variants && product.variants.length > 1 && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                {product.variants.slice(0, 5).map((variant) => (
                  <button key={variant.id} onClick={(e) => handleColorClick(e, variant)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <ColorSwatch
                      colorHex={variant.colorHex}
                      title={variant.color}
                      className={cn("h-5 w-5", selectedVariant?.id === variant.id && "ring-2 ring-primary ring-offset-1")}
                    />
                  </button>
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
             <span className="text-xs text-muted-foreground">no Pix ou R$ {precoCartao.toFixed(2).replace(".", ",")} no cartão</span>
            <SecuritySeal variant="compact" className="mt-2" />
        </div>
        <AddToCartButton product={product} variant={selectedVariant} size="icon" />
      </CardFooter>
    </Card>
  );
}
