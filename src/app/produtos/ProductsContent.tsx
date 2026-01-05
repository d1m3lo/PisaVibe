
"use client";

import { ProductCard } from "@/components/product-card";
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function ProductsContent() {
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
        const normalizedSearchQuery = searchQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return products.filter(p => 
            p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearchQuery)
        );
    }

    if (category === 'importados') {
        products = products.filter(p => p.isImported === true);
    } else if (category === 'ofertas' || category === 'lancamentos') {
        products = products.filter(p => p.tags?.includes(category));
    } else if (category) {
        products = products.filter(p => p.category === category);
    }


    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unissex');
    }

    if (subCategory) {
        const normalizedSubCategory = subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        products = products.filter(p => {
            // Handle cases where 'tipo' might be a main category like 'perfumes'
            if (p.category === normalizedSubCategory) return true;
            
            // Handle regular subcategories
            if (!p.subCategory) return false;
            const normalizedProductSubCategory = p.subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedProductSubCategory === normalizedSubCategory;
        });
    }

    return products;

  }, [productsData, searchQuery, category, subCategory, gender]);


  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const formatTitlePart = (part: string | null): string => {
    if (!part) return '';
    
    const specialCases: Record<string, string> = {
        'lancamentos': 'Lançamentos',
        'ofertas': 'Ofertas',
        'importados': 'IMPORTADOS',
        'calcados': 'Calçados',
        'calçados': 'Calçados',
        'acessorios': 'Acessórios',
        'acessórios': 'Acessórios',
        'bones': 'Bonés',
        'bonés': 'Bonés',
        'relogios': 'Relógios',
        'relógios': 'Relógios',
        'calcas': 'Calças',
        'calças': 'Calças',
        'sandalias': 'Sandálias',
        'sandálias': 'Sandálias',
    };

    const lowerPart = part.toLowerCase();
    return specialCases[lowerPart] || capitalize(lowerPart);
};

  const title = useMemo(() => {
    if (searchQuery) {
        return `Busca por: "${searchQuery}"`;
    }

    const titleParts: string[] = [];
    const isSpecialCategory = category === 'ofertas' || category === 'lancamentos' || category === 'importados';
    
    if (isSpecialCategory) {
        titleParts.push(formatTitlePart(category));
    }
     if (gender) {
        titleParts.push(formatTitlePart(gender));
    }
    if (category && !isSpecialCategory) {
        titleParts.push(formatTitlePart(category));
    }
     if (subCategory) {
        titleParts.push(formatTitlePart(subCategory));
    }
    
    if (titleParts.length > 0) {
        return titleParts.join(' - ');
    }

    return "Todos os Produtos";
  }, [searchQuery, category, gender, subCategory]);
  


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
