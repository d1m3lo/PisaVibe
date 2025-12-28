
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useRef, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

function ProductSection({ title, allProducts, defaultVisible = 4, tag }: { title: string; allProducts: Product[]; defaultVisible?: number; tag: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (isExpanded) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setIsExpanded(false), 300);
    } else {
      setIsExpanded(true);
      setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const displayedProducts = isExpanded ? allProducts : allProducts.slice(0, defaultVisible);

  return (
    <section id={tag} ref={sectionRef} className="w-full bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="font-headline text-3xl font-bold md:text-4xl">
            {title}
          </h2>
          {allProducts.length > defaultVisible && (
            <button onClick={handleToggle} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <span>{isExpanded ? "Ver menos" : "Ver mais"}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {displayedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSectionSkeleton({ title }: { title: string }) {
  return (
     <section className="w-full bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 font-headline text-3xl font-bold md:text-4xl">
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const manualBanners = [
    {
      title: 'PISA VIBE',
      subtitle: 'O seu estilo começa aqui. Tênis e roupas com a atitude que você procura.',
      buttonText: 'Ver Coleção',
      buttonLink: '/produtos',
      imageUrl: 'https://www.crepslocker.com/cdn/shop/articles/Banner_1100x.jpg?v=1674257438'
    },
    {
      title: 'NOVA COLEÇÃO',
      subtitle: 'Conheça os lançamentos que acabaram de chegar.',
      buttonText: 'Ver Lançamentos',
      buttonLink: '/produtos?categoria=lancamentos',
      imageUrl: 'https://images.unsplash.com/photo-1646122408163-42332de7b4fa?q=80&w=1541&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      title: 'OFERTAS IMPERDÍVEIS',
      subtitle: 'Produtos selecionados com até 50% de desconto. Aproveite!',
      buttonText: 'Ver Ofertas',
      buttonLink: '/produtos?categoria=ofertas',
      imageUrl: 'https://images.unsplash.com/photo-1656164061663-3dc536192fcb?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
  ];
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 10000, stopOnInteraction: true })
  );

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    const handleSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on("select", handleSelect);
    return () => carouselApi.off("select", handleSelect);
  }, [carouselApi]);

  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('status', '==', 'ativo'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const lancamentos = useMemo(() => products?.filter(p => p.tags?.includes('lancamentos')) || [], [products]);
  const destaques = useMemo(() => products || [], [products]);
  const ofertas = useMemo(() => products?.filter(p => p.tags?.includes('ofertas')) || [], [products]);

  return (
    <div className="flex flex-col">
      <section className="relative w-full">
         <Carousel 
            setApi={setCarouselApi} 
            opts={{ loop: true }}
            plugins={[autoplayPlugin.current]}
            onMouseEnter={autoplayPlugin.current.stop}
            onMouseLeave={autoplayPlugin.current.reset}
          >
          <CarouselContent>
            {manualBanners.map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[50vh] w-full text-white sm:h-[60vh] md:h-[70vh]">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">
                    <h1 className="font-headline text-5xl font-bold tracking-tighter text-white md:text-7xl lg:text-8xl">
                      {banner.title}
                    </h1>
                    <p className="mt-4 max-w-lg text-lg text-gray-200 md:text-xl">
                      {banner.subtitle}
                    </p>
                    <Button asChild size="lg" variant="outline" className="mt-8 border-white bg-transparent text-white hover:bg-white hover:text-black">
                      <Link href={banner.buttonLink}>{banner.buttonText}</Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex bg-transparent border-white/50 text-white hover:bg-white/10 hover:border-white" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex bg-transparent border-white/50 text-white hover:bg-white/10 hover:border-white" />
        </Carousel>
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 transform">
          <div className="flex space-x-2">
            {manualBanners.map((_, index) => (
              <button 
                key={index} 
                className={cn("h-2 w-2 rounded-full transition-colors", currentSlide === index ? 'bg-white' : 'bg-white/50')}
                onClick={() => carouselApi?.scrollTo(index)}
                aria-label={`Ir para o slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <>
          <ProductSectionSkeleton title="Lançamentos" />
          <ProductSectionSkeleton title="Destaques" />
          <ProductSectionSkeleton title="Ofertas" />
        </>
      ) : (
        <>
          {lancamentos.length > 0 && <ProductSection title="Lançamentos" allProducts={lancamentos} tag="lancamentos" />}
          {destaques.length > 0 && <ProductSection title="Destaques" allProducts={destaques} tag="destaques" />}
          {ofertas.length > 0 && <ProductSection title="Ofertas" allProducts={ofertas} tag="ofertas" />}
        </>
      )}
    </div>
  );
}
