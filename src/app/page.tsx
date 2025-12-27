import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/products';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Recommendations from '@/components/recommendations';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-1');
  const lancamentos = products.slice(0, 4);
  const destaques = products.slice(4, 8);
  const ofertas = products.slice(2, 6);

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
          <h1 className="font-headline text-5xl font-bold tracking-tighter text-white md:text-7xl lg:text-8xl">
            PISA VIBE
          </h1>
          <p className="mt-4 max-w-lg text-lg text-gray-200 md:text-xl">
            O seu estilo começa aqui. Tênis e roupas com a atitude que você
            procura.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/produtos">Ver Coleção</Link>
          </Button>
        </div>
      </section>

      <section id="lancamentos" className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              Lançamentos
            </h2>
            <Link href="/produtos?categoria=lancamentos" className="text-sm font-medium text-primary hover:underline">
              Ver mais
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {lancamentos.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="destaques" className="w-full bg-secondary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              Destaques
            </h2>
             <Link href="/produtos" className="text-sm font-medium text-primary hover:underline">
              Ver mais
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="ofertas" className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
           <div className="mb-10 flex items-baseline justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              Ofertas
            </h2>
            <Link href="/produtos?categoria=ofertas" className="text-sm font-medium text-primary hover:underline">
              Ver mais
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ofertas.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <Recommendations />
    </div>
  );
}
