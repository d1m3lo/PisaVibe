
"use client";

import { ProductCard } from "@/components/product-card";
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Query, and } from 'firebase/firestore';
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
    
    let filters = [where('status', '==', 'ativo')];

    if (category && category !== 'lancamentos' && category !== 'ofertas') {
        filters.push(where('category', '==', category));
    }
    
    if (subCategory) {
        filters.push(where('subCategory', '==', subCategory));
    }
    
    const q = collection(firestore, 'products');
    
    if (filters.length > 1) {
      // @ts-ignore - Firestore 'and' typing can be complex with dynamic filters
      return query(q, and(...filters));
    } else if (filters.length === 1) {
      return query(q, filters[0]);
    }

    return query(q); // Fallback to query all active products if no filters
    
  }, [firestore, category, subCategory]);

  const { data: productsData, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    
    let products = [...productsData];

    // Client-side filtering for complex cases
    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unissex');
    }
    
    if (category && (category === 'lancamentos' || category === 'ofertas')) {
      products = products.filter(p => p.tags?.includes(category));
    }

    if (searchQuery) {
      products = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return products;

  }, [productsData, searchQuery, gender, category]);


  let title = "Todos os Produtos";
  if (searchQuery) {
    title = `Busca por: "${searchQuery}"`;
  } else {
    let titleParts = [];
    if (gender) titleParts.push(gender.charAt(0).toUpperCase() + gender.slice(1));
    if (category) {
        let categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        if (categoryTitle.toLowerCase() === 'calcados' || categoryTitle.toLowerCase() === 'calçados') categoryTitle = 'Calçados';
        if (categoryTitle.toLowerCase() === 'lancamentos') categoryTitle = 'Lançamentos';
        titleParts.push(categoryTitle);
    }
    if (subCategory) {
       let subCategoryTitle = subCategory.charAt(0).toUpperCase() + subCategory.slice(1);
       if (subCategoryTitle.toLowerCase() === 'calcados' || subCategoryTitle.toLowerCase() === 'calçados') subCategoryTitle = 'Calçados';
       titleParts.push(subCategoryTitle);
    }
    if (titleParts.length > 0) title = titleParts.join(' - ');
  }


  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="font-headline text-4xl font-bold">
          {title}
        </h1>
        {/* Sorting functionality can be added here */}
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
