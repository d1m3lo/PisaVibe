
'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

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

export default function ProductFilters({ products }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSizes = useMemo(() => searchParams.get('tamanho')?.split(',') || [], [searchParams]);
  const [minPrice, setMinPrice] = useState(searchParams.get('preco_min') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('preco_max') || '');
  
  const selectedCategory = searchParams.get('categoria');
  const selectedGender = searchParams.get('genero');
  const selectedSubCategory = searchParams.get('tipo');

  const availableSizes = useMemo(() => {
    const sizeMap = new Map<string, number>();
    
    let productsToFilter = [...products];

    // Se uma categoria estiver selecionada, filtre os tamanhos para essa categoria
    if (selectedCategory) {
        productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }
    
    productsToFilter.forEach(product => {
      product.variants.forEach(variant => {
        variant.sizes.forEach(sizeInfo => {
          if (sizeInfo.stock > 0) {
            sizeMap.set(sizeInfo.size, (sizeMap.get(sizeInfo.size) || 0) + 1);
          }
        });
      });
    });

    return Array.from(sizeMap.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => {
        const numA = parseInt(a.size);
        const numB = parseInt(b.size);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA) && isNaN(numB)) return -1;
        if (isNaN(numA) && !isNaN(numB)) return 1;
        return a.size.localeCompare(b.size);
      });
  }, [products, selectedCategory]);

  const availableSubCategories = useMemo(() => {
    const subCategoryMap = new Map<string, number>();
    
    let productsToFilter = [...products];

    if (selectedGender) {
        productsToFilter = productsToFilter.filter(p => p.gender === selectedGender || p.gender === 'unissex');
    }
    
    if (selectedCategory) {
        productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }
    
    productsToFilter.forEach(product => {
      if (product.subCategory) {
        subCategoryMap.set(product.subCategory, (subCategoryMap.get(product.subCategory) || 0) + 1);
      }
    });

    return Array.from(subCategoryMap.entries()).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));
  }, [products, selectedCategory, selectedGender]);

  const handleFilterChange = (key: string, value: string | null) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const currentValue = current.get(key);

    // Se o valor clicado já for o selecionado, desmarque-o. Caso contrário, selecione-o.
    if (value !== null && currentValue === value) {
      current.delete(key);
    } else if (value !== null) {
      current.set(key, value);
    } else {
      current.delete(key);
    }
    
    // Reset sub-category if gender or category changes
    if (key === 'genero' || key === 'categoria') {
        current.delete('tipo');
    }
    
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    const newSizes = new Set(selectedSizes);
    if (checked) {
      newSizes.add(size);
    } else {
      newSizes.delete(size);
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
  
  const handlePriceChange = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if(minPrice) current.set('preco_min', minPrice); else current.delete('preco_min');
    if(maxPrice) current.set('preco_max', maxPrice); else current.delete('preco_max');
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };
  
  const clearFilters = () => {
    router.push(pathname);
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = searchParams.toString().length > 0;
  
  const genders = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'unissex', label: 'Unissex' },
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
                                onCheckedChange={() => handleFilterChange('genero', value)}
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
                                checked={selectedCategory === value}
                                onCheckedChange={() => handleFilterChange('categoria', value)}
                            />
                            <Label htmlFor={`cat-${value}`} className="cursor-pointer w-full">{label}</Label>
                        </div>
                    ))}
                </div>
            </FilterSection>

            {availableSubCategories.length > 0 && (
            <FilterSection title="Subcategorias">
                <div className="space-y-3">
                {availableSubCategories.map(({ name, count }) => (
                    <div key={name} className="flex items-center space-x-2">
                        <Checkbox
                            id={`subcat-${name}`}
                            checked={selectedSubCategory === name.toLowerCase()}
                            onCheckedChange={() => handleFilterChange('tipo', name.toLowerCase())}
                        />
                        <Label htmlFor={`subcat-${name}`} className="cursor-pointer w-full flex justify-between items-center">
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
                        onCheckedChange={(checked) => handleSizeChange(size, !!checked)}
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
            <div className="flex items-center gap-2">
                <Input 
                type="number" 
                placeholder="De" 
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                onBlur={handlePriceChange}
                onKeyDown={e => e.key === 'Enter' && handlePriceChange()}
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                type="number" 
                placeholder="Até" 
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                onBlur={handlePriceChange}
                onKeyDown={e => e.key === 'Enter' && handlePriceChange()}
                />
            </div>
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
