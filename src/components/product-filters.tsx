
'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, SlidersHorizontal, ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FilterSection = ({ title, children }: FilterSectionProps) => (
  <div className="py-6 border-b">
    <h3 className="mb-4 text-lg font-semibold">{title}</h3>
    {children}
  </div>
);

interface ProductFiltersProps {
  products: Product[];
}

const priceRanges = [
    { label: "Até R$ 100", min: "0", max: "100" },
    { label: "R$ 100 - R$ 200", min: "100", max: "200" },
    { label: "R$ 200 - R$ 300", min: "200", max: "300" },
    { label: "R$ 300 - R$ 400", min: "300", max: "400" },
    { label: "Acima de R$ 400", min: "400", max: undefined },
];

export default function ProductFilters({ products }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSizes = useMemo(() => searchParams.get('tamanho')?.split(',') || [], [searchParams]);
  const minPrice = searchParams.get('preco_min');
  const maxPrice = searchParams.get('preco_max');
  
  const selectedCategories = useMemo(() => searchParams.get('categoria')?.split(',') || [], [searchParams]);
  const selectedGender = searchParams.get('genero');
  const selectedSubCategories = useMemo(() => searchParams.get('tipo')?.split(',') || [], [searchParams]);

  const handleMultiFilterChange = (key: string, value: string) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    const currentValues = currentParams.get(key)?.split(',') || [];
    const newValues = new Set(currentValues);

    if (newValues.has(value)) {
      newValues.delete(value);
    } else {
      newValues.add(value);
    }

    const valuesArray = Array.from(newValues);
    if (valuesArray.length > 0) {
      currentParams.set(key, valuesArray.join(','));
    } else {
      currentParams.delete(key);
    }

    const search = currentParams.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  const handleGenderChange = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const currentValue = current.get('genero');

    if (currentValue === value) {
      current.delete('genero');
    } else {
      current.set('genero', value);
    }
    
    current.delete('categoria');
    current.delete('tipo');
    
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  }

  const availableSizes = useMemo(() => {
    const sizeMap = new Map<string, number>();
    
    let productsToFilter = [...products];

    // Filter by category if any are selected
    if (selectedCategories.length > 0) {
        productsToFilter = productsToFilter.filter(p => selectedCategories.some(sc => p.category === sc || p.tags?.includes(sc)));
    }
    
    productsToFilter.forEach(product => {
      product.variants.forEach(variant => {
        variant.sizes.forEach(sizeInfo => {
          if (sizeInfo.stock > 0) {
            // If any selected category is 'roupas', only show non-numeric sizes
            const isRoupasSelected = selectedCategories.includes('roupas');
            if (isRoupasSelected && !isNaN(parseFloat(sizeInfo.size))) {
                return;
            }
             if (selectedCategories.includes('calcados') && isNaN(parseFloat(sizeInfo.size))) {
                return;
            }
            sizeMap.set(sizeInfo.size, (sizeMap.get(sizeInfo.size) || 0) + 1);
          }
        });
      });
    });

    return Array.from(sizeMap.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => {
        const sizeOrder: Record<string, number> = { 'P': 1, 'M': 2, 'G': 3, 'GG': 4, 'G1': 5, 'G2': 6, 'G3': 7 };
        const aIsLetter = isNaN(parseFloat(a.size)) && sizeOrder[a.size.toUpperCase()];
        const bIsLetter = isNaN(parseFloat(b.size)) && sizeOrder[b.size.toUpperCase()];
        
        if (aIsLetter && bIsLetter) {
            return (sizeOrder[a.size.toUpperCase()] || 99) - (sizeOrder[b.size.toUpperCase()] || 99);
        }
        
        const numA = parseInt(a.size);
        const numB = parseInt(b.size);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

        if (aIsLetter) return 1;
        if (bIsLetter) return -1;
        return a.size.localeCompare(b.size);
      });
  }, [products, selectedCategories]);

  const availableSubCategories = useMemo(() => {
    const subCategoryMap = new Map<string, number>();
    
    let productsToFilter = [...products];

    if (selectedGender) {
        productsToFilter = productsToFilter.filter(p => p.gender === selectedGender || p.gender === 'unissex');
    }
    
    if (selectedCategories.length > 0) {
        productsToFilter = productsToFilter.filter(p => selectedCategories.some(sc => p.category === sc || p.tags?.includes(sc)));
    }
    
    productsToFilter.forEach(product => {
      if (product.subCategory) {
        subCategoryMap.set(product.subCategory, (subCategoryMap.get(product.subCategory) || 0) + 1);
      }
    });

    return Array.from(subCategoryMap.entries()).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count, value: name.toLowerCase() }));
  }, [products, selectedCategories, selectedGender]);

  const handleSizeChange = (size: string) => {
    const newSizes = new Set(selectedSizes);
    if (newSizes.has(size)) {
        newSizes.delete(size);
    } else {
        newSizes.add(size);
    }
    const sizesArray = Array.from(newSizes);
    
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if(sizesArray.length > 0) {
      current.set('tamanho', sizesArray.join(','));
    } else {
      current.delete('tamanho');
    }
    
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };
  
   const handlePriceChange = (value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        const [min, max] = value.split('-');

        if (min === minPrice && max === maxPrice) {
             current.delete('preco_min');
             current.delete('preco_max');
        } else {
            current.set('preco_min', min);
            if (max) {
                current.set('preco_max', max);
            } else {
                current.delete('preco_max');
            }
        }
        
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };
  
  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = searchParams.toString().length > 0;
  
  const genders = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
  ];
  
  const categories = [
    { value: 'calcados', label: 'Calçados' },
    { value: 'roupas', label: 'Roupas' },
    { value: 'acessorios', label: 'Acessórios' },
    { value: 'perfumes', label: 'Perfumes' },
  ]

  const filtersContent = (
    <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Filtrar por</h2>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive">
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                    </Button>
                )}
            </div>
            
            <FilterSection title="Gênero">
                <div className="space-y-3">
                    {genders.map(({ value, label }) => (
                       <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                                id={`gender-${value}`}
                                checked={selectedGender === value}
                                onCheckedChange={() => handleGenderChange(value)}
                            />
                            <Label htmlFor={`gender-${value}`} className="cursor-pointer w-full">{label}</Label>
                        </div>
                    ))}
                </div>
            </FilterSection>

             <FilterSection title="Categorias Principais">
                <div className="space-y-3">
                    {categories.map(({ value, label }) => (
                         <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                                id={`cat-${value}`}
                                checked={selectedCategories.includes(value)}
                                onCheckedChange={() => handleMultiFilterChange('categoria', value)}
                            />
                            <Label htmlFor={`cat-${value}`} className="cursor-pointer w-full">{label}</Label>
                        </div>
                    ))}
                </div>
            </FilterSection>

            {availableSubCategories.length > 0 && (
            <FilterSection title="Subcategorias">
                <div className="space-y-3">
                {availableSubCategories.map(({ name, count, value }) => (
                    <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                            id={`subcat-${value}`}
                            checked={selectedSubCategories.includes(value)}
                            onCheckedChange={() => handleMultiFilterChange('tipo', value)}
                        />
                        <Label htmlFor={`subcat-${value}`} className="cursor-pointer w-full flex justify-between items-center">
                            <span>{name}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                        </Label>
                    </div>
                ))}
                </div>
            </FilterSection>
            )}
            
            {availableSizes.length > 0 && (
            <FilterSection title="Tamanho">
                <div className="grid grid-cols-3 gap-3">
                {availableSizes.map(({ size, count }) => (
                    <div key={size} className="flex items-center">
                    <Checkbox
                        id={`size-${size}`}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleSizeChange(size)}
                    />
                    <Label htmlFor={`size-${size}`} className="ml-2 cursor-pointer flex-grow">
                        {size} <span className="text-muted-foreground text-xs">({count})</span>
                    </Label>
                    </div>
                ))}
                </div>
            </FilterSection>
            )}
            
            <FilterSection title="Preço">
              <RadioGroup
                value={
                  maxPrice ? `${minPrice}-${maxPrice}` : minPrice ? `${minPrice}-` : ''
                }
                onValueChange={handlePriceChange}
              >
                {priceRanges.map((range) => (
                  <div key={range.label} className="flex items-center space-x-2">
                    <RadioGroupItem value={`${range.min}-${range.max || ''}`} id={range.label} />
                    <Label htmlFor={range.label} className="cursor-pointer">
                      {range.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FilterSection>
        </div>
    </ScrollArea>
  );

  return (
    <>
      <div className="hidden lg:block sticky top-24">{filtersContent}</div>
      <div className="lg:hidden mb-6">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filtros
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="py-4">{filtersContent}</div>
            </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
