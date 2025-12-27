
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/products';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const heroImages = PlaceHolderImages.filter(img => img.id.startsWith('hero-'));
  const heroImage = heroImages[0];
  
  const allLancamentos = products.filter(p => p.tags?.includes('lancamentos'));
  const allDestaques = products;
  const allOfertas = products.filter(p => p.tags?.includes('ofertas'));

  const [lancamentosExpanded, setLancamentosExpanded] = useState(false);
  const [destaquesExpanded, setDestaquesExpanded] = useState(false);
  const [ofertasExpanded, setOfertasExpanded] = useState(false);

  const lancamentosRef = useRef<HTMLDivElement>(null);
  const destaquesRef = useRef<HTMLDivElement>(null);
  const ofertasRef = useRef<HTMLDivElement>(null);

  const handleToggle = (
    section: 'lancamentos' | 'destaques' | 'ofertas', 
    setExpanded: React.Dispatch<React.SetStateAction<boolean>>,
    isExpanded: boolean
  ) => {
    setExpanded(!isExpanded);
    if (isExpanded) {
        const element = {
            'lancamentos': lancamentosRef.current,
            'destaques': destaquesRef.current,
            'ofertas': ofertasRef.current,
        }[section];
        
        // Use a timeout to allow the state to update and items to collapse before scrolling
        setTimeout(() => {
             element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };


  const lancamentos = lancamentosExpanded ? allLancamentos : allLancamentos.slice(0, 4);
  const destaques = destaquesExpanded ? allDestaques : allDestaques.slice(0, 8);
  const ofertas = ofertasExpanded ? allOfertas : allOfertas.slice(0, 4);

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

      <section id="lancamentos" ref={lancamentosRef} className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              Lançamentos
            </h2>
            {allLancamentos.length > 4 && (
              <button onClick={() => handleToggle('lancamentos', setLancamentosExpanded, lancamentosExpanded)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <span>{lancamentosExpanded ? "Ver menos" : "Ver mais"}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", lancamentosExpanded && "rotate-180")} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {lancamentos.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="destaques" ref={destaquesRef} className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              Destaques
            </h2>
             {allDestaques.length > 8 && (
              <button onClick={() => handleToggle('destaques', setDestaquesExpanded, destaquesExpanded)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <span>{destaquesExpanded ? "Ver menos" : "Ver mais"}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", destaquesExpanded && "rotate-180")} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="ofertas" ref={ofertasRef} className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
           <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              Ofertas
            </h2>
            {allOfertas.length > 4 && (
              <button onClick={() => handleToggle('ofertas', setOfertasExpanded, ofertasExpanded)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <span>{ofertasExpanded ? "Ver menos" : "Ver mais"}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", ofertasExpanded && "rotate-180")} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ofertas.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
