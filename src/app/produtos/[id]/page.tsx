import { products } from "@/lib/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Star, Truck } from "lucide-react";
import AddToCartButton from "@/components/add-to-cart-button";

type ProductPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ProductPageProps) {
  const product = products.find((p) => p.id === params.id);
  if (!product) {
    return {
      title: "Produto não encontrado",
    };
  }
  return {
    title: `${product.name} - PISA VIBE`,
    description: product.description,
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {product.images.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                    <Image
                      src={img}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
        <div className="flex flex-col">
          <h1 className="font-headline text-3xl font-bold md:text-4xl">
            {product.name}
          </h1>
          
          <p className="mt-4 text-3xl font-bold">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </p>
          <div className="mt-6">
            <p className="text-muted-foreground">{product.longDescription}</p>
          </div>
          <div className="mt-8">
             <AddToCartButton product={product} />
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-5 w-5" />
            <span>Frete grátis para todo o Brasil.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
