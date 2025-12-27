
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const heroImages = PlaceHolderImages.filter(img => img.id.startsWith('hero-'));
  const heroImage = heroImages[0];

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
      <section className="relative h-[50vh] w-full text-white sm:h-[60vh] md:h-[70vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center justify-center">
            <h1 className="font-headline text-5xl font-bold tracking-tighter text-white md:text-7xl lg:text-8xl">
              PISA VIBE
            </h1>
            <p className="mt-4 max-w-lg text-lg text-gray-200 md:text-xl">
              O seu estilo começa aqui. Tênis e roupas com a atitude que você
              procura.
            </p>
            <Button asChild size="lg" variant="outline" className="mt-8 border-white bg-transparent text-white hover:bg-white hover:text-black">
              <Link href="/produtos">Ver Coleção</Link>
            </Button>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform">
            <div className="flex space-x-2">
              {heroImages.length > 1 ? (
                heroImages.map((_, index) => (
                  <button key={index} className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}></button>
                ))
              ) : (
                 <button className="h-3 w-3 rounded-full bg-white"></button>
              )}
            </div>
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
