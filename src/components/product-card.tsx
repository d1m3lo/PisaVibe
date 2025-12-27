import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex h-full transform flex-col overflow-hidden rounded-lg border-0 shadow-sm transition-transform duration-300 hover:shadow-lg hover:-translate-y-2">
      <Link href={`/produtos/${product.id}`} className="flex h-full flex-col">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="text-lg font-bold">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span>{product.rating}</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
