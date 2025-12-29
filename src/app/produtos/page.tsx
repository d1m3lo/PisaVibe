
"use client";

import { ProductCard } from "@/components/product-card";
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const category = searchParams.get("categoria");
  const subCategory = searchParams.get("tipo");
  const gender = searchParams.get("genero");
  const searchQuery = searchParams.get("q");

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('status', '==', 'ativo'));
  }, [firestore]);

  const { data: productsData, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    
    let products = [...productsData];

    if (searchQuery) {
      products = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (category && category !== 'lancamentos' && category !== 'ofertas') {
        products = products.filter(p => p.category === category);
    }
    
    if (subCategory) {
        const normalizedSubCategory = subCategory
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        products = products.filter(p => {
          if (!p.subCategory) return false;
          const normalizedProductSubCategory = p.subCategory
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          return normalizedProductSubCategory === normalizedSubCategory || p.category === normalizedSubCategory;
        });
    }
    
    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unissex');
    }

    if (category && (category === 'lancamentos' || category === 'ofertas')) {
      products = products.filter(p => p.tags?.includes(category));
    }

    return products;

  }, [productsData, searchQuery, category, subCategory, gender]);


  let title = "Todos os Produtos";

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const formatTitlePart = (part: string) => {
    const formatted = part.toLowerCase();
    if (formatted === 'calcados' || formatted === 'calçados') return 'Calçados';
    if (formatted === 'acessorios' || formatted === 'acessórios') return 'Acessórios';
    if (formatted === 'bones' || formatted === 'bonés') return 'Bonés';
    if (formatted === 'relogios' || formatted === 'relógios') return 'Relógios';
    if (formatted === 'calcas' || formatted === 'calças') return 'Calças';
    return capitalize(formatted);
  };


  if (searchQuery) {
    title = `Busca por: "${searchQuery}"`;
  } else if (gender) {
    const titleParts = [];
    titleParts.push(formatTitlePart(gender));
    if (category) titleParts.push(formatTitlePart(category));
    if (subCategory) titleParts.push(formatTitlePart(subCategory));
    title = titleParts.join(' - ');
  } else if (category === 'lancamentos' || category === 'ofertas') {
    title = capitalize(category);
  } else if (category) {
    title = formatTitlePart(category);
  }


  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="font-headline text-4xl font-bold">
          {title}
        </h1>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
}
