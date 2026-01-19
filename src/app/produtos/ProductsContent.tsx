
"use client";

import { ProductCard } from "@/components/product-card";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import ProductFilters from "@/components/product-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const categories = searchParams.get("categoria")?.split(',');
  const subCategories = searchParams.get("tipo")?.split(',');
  const gender = searchParams.get("genero");
  const searchQuery = searchParams.get("q");
  const sizeFilter = searchParams.get("tamanho");
  const minPrice = searchParams.get("preco_min");
  const maxPrice = searchParams.get("preco_max");
  const brandFilter = searchParams.get("marca");
  const sort = searchParams.get("sort");

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
        products = products.filter(p => {
            const productName = p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const productBrand = p.brand?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || '';
            return productName.includes(normalizedSearchQuery) || productBrand.includes(normalizedSearchQuery);
        });
    }
    
    if (categories && categories.length > 0) {
        const specialCats = categories.filter(c => ['ofertas', 'lancamentos', 'importados'].includes(c));
        const regularCats = categories.filter(c => !['ofertas', 'lancamentos', 'importados'].includes(c));
        
        products = products.filter(p => {
            const regularMatch = regularCats.length === 0 || regularCats.includes(p.category);
            
            const specialMatch = specialCats.length === 0 || specialCats.some(sc => {
                if (sc === 'importados') return p.isImported === true;
                return p.tags?.includes(sc);
            });
            
            return regularMatch && specialMatch;
        });
    }

    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unissex');
    }
    
    if (brandFilter) {
      products = products.filter(p => p.brand?.toLowerCase() === brandFilter.toLowerCase());
    }

    if (subCategories && subCategories.length > 0) {
        const normalizedSubCategories = subCategories.map(sc => sc.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        products = products.filter(p => {
            if (!p.subCategory) return false;
            const normalizedProductSubCategory = p.subCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedSubCategories.includes(normalizedProductSubCategory);
        });
    }
    
    // Size filter
    if (sizeFilter) {
      const sizes = sizeFilter.split(',');
      products = products.filter(p => 
        p.variants.some(v => v.sizes.some(s => sizes.includes(s.size) && s.stock > 0))
      );
    }

    // Price filter
    if (minPrice) {
      products = products.filter(p => p.variants.some(v => v.price >= Number(minPrice)));
    }
    if (maxPrice) {
      products = products.filter(p => p.variants.some(v => v.price <= Number(maxPrice)));
    }
    
    // Sorting logic
    if (sort) {
      products.sort((a, b) => {
        const priceA = a.variants[0]?.price ?? 0;
        const priceB = b.variants[0]?.price ?? 0;
        
        if (sort === 'price_asc') {
          return priceA - priceB;
        }
        if (sort === 'price_desc') {
          return priceB - priceA;
        }
        return 0;
      });
    }


    return products;

  }, [productsData, searchQuery, categories, subCategories, gender, brandFilter, sizeFilter, minPrice, maxPrice, sort]);


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
    const specialCats = categories?.filter(c => ['lancamentos', 'ofertas', 'importados'].includes(c)) || [];
    const regularCats = categories?.filter(c => !['lancamentos', 'ofertas', 'importados'].includes(c)) || [];

    if (specialCats.length > 0) {
      // Order for special pages: Special Cat -> Gender -> Regular Cat
      titleParts.push(specialCats.map(formatTitlePart).join(' / '));
      if (gender) {
        titleParts.push(formatTitlePart(gender));
      }
      if (regularCats.length > 0) {
        titleParts.push(regularCats.map(formatTitlePart).join(' / '));
      }
    } else {
      // Default order: Gender -> Regular Cat
      if (gender) {
        titleParts.push(formatTitlePart(gender));
      }
      if (regularCats.length > 0) {
        titleParts.push(regularCats.map(formatTitlePart).join(' / '));
      }
    }
    
    // Add subcategories and brand at the end for both cases
    if (subCategories && subCategories.length > 0) {
      titleParts.push(subCategories.map(formatTitlePart).join(' / '));
    }

    if (brandFilter) {
      titleParts.push(formatTitlePart(brandFilter));
    }
    
    if (titleParts.length > 0) {
      return titleParts.join(' - ');
    }

    return "Todos os Produtos";
  }, [searchQuery, categories, gender, subCategories, brandFilter]);
  
  const handleSortChange = (value: string) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === "relevance") {
      currentParams.delete("sort");
    } else {
      currentParams.set("sort", value);
    }
    const search = currentParams.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };


  return (
    <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <h1 className="font-headline text-4xl font-bold">
            {title}
            </h1>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
                <Select value={sort || 'relevance'} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="price_asc">Menor Preço</SelectItem>
                        <SelectItem value="price_desc">Maior Preço</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            <aside className="lg:col-span-1">
                <ProductFilters products={productsData || []} />
            </aside>
            <main className="lg:col-span-3">
                 {isLoading ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
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
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-xl text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
}
