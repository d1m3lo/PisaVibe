
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

    // 1. Filter by search query first
    if (searchQuery) {
      products = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    // 2. Check for special tags (Lançamentos/Ofertas)
    const tag = category && (category === 'lancamentos' || category === 'ofertas') ? category : null;
    if (tag) {
      products = products.filter(p => p.tags?.includes(tag));
    }

    // 3. Filter by gender
    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unissex');
    }
    
    // 4. Filter by category or subcategory
    // This part handles filtering after tags and gender have been applied.
    if (tag) { // If we are in a "Lançamentos" or "Ofertas" page
        if (subCategory) {
            const normalizedSubCategory = subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            products = products.filter(p => {
                 // Check if the type matches a main category (for Perfumes)
                if (p.category === normalizedSubCategory) return true;
                // Or if it matches a subcategory
                if (!p.subCategory) return false;
                const normalizedProductSubCategory = p.subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return normalizedProductSubCategory === normalizedSubCategory;
            });
        }
    } else { // If not a special tag page, filter by main category
        if (category) {
            products = products.filter(p => p.category === category);
        }
        if (subCategory) {
            const normalizedSubCategory = subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
             products = products.filter(p => {
                if (!p.subCategory) return false;
                const normalizedProductSubCategory = p.subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return normalizedProductSubCategory === normalizedSubCategory;
            });
        }
    }

    return products;

  }, [productsData, searchQuery, category, subCategory, gender]);


  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const formatTitlePart = (part: string | null) => {
    if (!part) return '';
    const formatted = part.toLowerCase();
    if (formatted === 'lancamentos') return 'Lançamentos';
    if (formatted === 'calcados' || formatted === 'calçados') return 'Calçados';
    if (formatted === 'acessorios' || formatted === 'acessórios') return 'Acessórios';
    if (formatted === 'bones' || formatted === 'bonés') return 'Bonés';
    if (formatted === 'relogios' || formatted === 'relógios') return 'Relógios';
    if (formatted === 'calcas' || formatted === 'calças') return 'Calças';
    if (formatted === 'sandalias' || formatted === 'sandálias') return 'Sandálias';
    return capitalize(formatted);
  };

  const title = useMemo(() => {
    if (searchQuery) {
        return `Busca por: "${searchQuery}"`;
    }

    const tag = category && (category === 'lancamentos' || category === 'ofertas') ? category : null;
    
    const titleParts: string[] = [];

    if (tag) {
        titleParts.push(formatTitlePart(tag));
    }
    if (gender) {
        titleParts.push(formatTitlePart(gender));
    }
    if (!tag && category) {
        titleParts.push(formatTitlePart(category));
    }
    
    // For tags, 'tipo' can be a category (like perfumes) or a sub-category.
    if (tag && subCategory) {
       titleParts.push(formatTitlePart(subCategory));
    } else if (!tag && subCategory) { // For regular pages, 'tipo' is always a sub-category.
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
