import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import AddToCartButton from "./add-to-cart-button";
import { QualityBadge } from "./quality-badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const firstVariant = product.variants?.[0];
  const firstImage = firstVariant?.images?.[0];

  return (
    <Card className="flex h-full transform flex-col overflow-hidden rounded-lg border-0 shadow-sm transition-transform duration-300 hover:shadow-lg hover:-translate-y-2">
      <Link href={`/produtos/${product.id}`} className="flex h-full flex-col">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full">
            {product.quality && (
                <div className="absolute right-2 top-2 z-10">
                    <QualityBadge quality={product.quality} size="sm" />
                </div>
            )}
            {firstImage ? (
              <Image
                src={firstImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
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
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="text-lg font-bold">
          R$ {product.price.toFixed(2).replace(".", ",")}
        </div>
        <AddToCartButton product={product} size="icon" />
      </CardFooter>
    </Card>
  );
}
