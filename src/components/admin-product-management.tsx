
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Firestore,
  query,
  orderBy,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Product, Variant, SizeInfo } from '@/lib/types';
import { PlusCircle, Edit, Trash2, X, Palette, Image as ImageIcon, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Checkbox } from './ui/checkbox';
import { QualityBadge } from './quality-badge';
import { ColorSwatch } from './color-swatch';
import { fixImageUrl } from '@/lib/utils';

type ProductWithId = Product & { firestoreId: string };

const categoryMappings = {
  masculino: {
    'calcados': ['Casual', 'Chinelo', 'Streetwear', 'Sneakers'],
    'roupas': ['Camisetas', 'Moletom', 'Bermudas', 'Calças', 'Polos', 'Streetwear', 'Casual'],
    'acessorios': ['Bonés', 'Relógios', 'Bag'],
    'perfumes': [],
  },
  feminino: {
    'calcados': ['Casual', 'Sandálias', 'Chinelo', 'Streetwear', 'Sneakers'],
    'roupas': ['Vestidos', 'Moletom', 'Calças', 'Streetwear', 'Casual'],
    'acessorios': ['Bolsas', 'Relógios', 'Bag'],
    'perfumes': [],
  },
  unissex: {
    'calcados': ['Casual', 'Chinelo', 'Streetwear', 'Sneakers'],
    'roupas': ['Camisetas', 'Moletom', 'Streetwear'],
    'acessorios': ['Bonés', 'Bag'],
    'perfumes': [],
  }
};

const allSizes = {
    roupas: ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'],
    calcados: [], // Será preenchido dinamicamente
    acessorios: ['U'],
    perfumes: ['U']
};

const allTags = [
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'destaques', label: 'Destaques' },
    { id: 'ofertas', label: 'Ofertas' },
    { id: 'importados', label: 'Importados' },
]

const ProductForm = ({
  product,
  onSave,
  onClose,
}: {
  product?: ProductWithId | null;
  onSave: (p: Omit<ProductWithId, 'firestoreId'>) => Promise<void>;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    longDescription: product?.longDescription || '',
    gender: product?.gender || 'masculino',
    category: product?.category || 'calcados',
    subCategory: product?.subCategory || '',
    variants: product?.variants || [{ id: Date.now().toString(), color: '', colorHex: '#000000', price: '' as any, oldPrice: '' as any, images: [''], imageNames: [], sizes: [] }],
    status: product?.status || 'ativo',
    tags: product?.tags || [],
    quality: product?.quality || 'Select',
    isImported: product?.isImported || false,
    showSizeChart: product?.showSizeChart || false,
    origin: product?.origin || '',
    hasGift: product?.hasGift || false,
  });

  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeRange, setSizeRange] = useState('');

  const sortSizes = (sizes: string[]) => {
    return sizes.sort((a, b) => {
        // Handle "U" size to always be at the end
        if (a === 'U') return 1;
        if (b === 'U') return -1;

        // Handle letter sizes
        const sizeOrder: Record<string, number> = { 'P': 1, 'M': 2, 'G': 3, 'GG': 4, 'G1': 5, 'G2': 6, 'G3': 7 };
        const aIsLetter = isNaN(parseFloat(a)) && sizeOrder[a.toUpperCase()];
        const bIsLetter = isNaN(parseFloat(b)) && sizeOrder[b.toUpperCase()];
        if (aIsLetter && bIsLetter) {
            return (sizeOrder[a.toUpperCase()] || 99) - (sizeOrder[b.toUpperCase()] || 99);
        }
        if (aIsLetter) return 1;
        if (bIsLetter) return -1;
        
        // Handle numeric and combined numeric sizes (e.g., "34", "33/34")
        const getFirstNumber = (s: string) => parseFloat(s.split('/')[0]);
        const numA = getFirstNumber(a);
        const numB = getFirstNumber(b);

        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        
        // Fallback for any other cases
        return a.localeCompare(b);
    });
  };


  useEffect(() => {
    const gender = formData.gender as keyof typeof categoryMappings;
    const category = formData.category as keyof typeof categoryMappings[typeof gender];
    const mappings = categoryMappings[gender];

    if (mappings && category in mappings) {
      setSubCategoryOptions((mappings as any)[category]);
    } else {
      setSubCategoryOptions([]);
    }

    if (product?.gender !== formData.gender || product?.category !== formData.category) {
      setFormData(prev => ({ ...prev, subCategory: '' }));
    }
    
    let initialSizes: string[] = [];
    if (formData.category === 'roupas') {
      initialSizes = allSizes.roupas;
    } else if (['acessorios', 'perfumes'].includes(formData.category)) {
      initialSizes = allSizes[formData.category as 'acessorios' | 'perfumes'];
    }

    const allVariantSizes = formData.variants.flatMap(v => v.sizes.map(s => s.size));
    const uniqueExistingSizes = [...new Set(allVariantSizes)];

    const combinedSizes = [...new Set([...initialSizes, ...uniqueExistingSizes])];
    setAvailableSizes(sortSizes(combinedSizes));


  }, [formData.gender, formData.category, product]);

  const handleGenerateSizes = () => {
    if (!sizeRange) return;
    let newGeneratedSizes: string[] = [];
    
    if (sizeRange.includes(',') || sizeRange.includes('/')) {
        // Handle comma-separated or combined sizes (e.g., "33/34, 35/36")
        newGeneratedSizes = sizeRange.split(',').map(s => s.trim()).filter(Boolean);
    } else if (sizeRange.includes('-')) {
        const [start, end] = sizeRange.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
                newGeneratedSizes.push(String(i));
            }
        } else {
            alert("Formato de intervalo inválido. Use '34-45'. Para tamanhos combinados, use vírgula: '33/34, 35/36'.");
        }
    } else if (!isNaN(Number(sizeRange))) {
        // Handle single number input
        newGeneratedSizes.push(sizeRange);
    } else {
         // Handle single letter size input
        newGeneratedSizes.push(sizeRange);
    }
    
    setAvailableSizes(prev => sortSizes([...new Set([...prev, ...newGeneratedSizes])]));
    setSizeRange('');
  };


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [id]: type === 'number' ? parseFloat(value) || '' : value 
    }));
  };

  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleTagChange = (tagId: string, checked: boolean) => {
    setFormData(prev => {
        const newTags = checked 
            ? [...prev.tags, tagId]
            : prev.tags.filter(t => t !== tagId);
        return { ...prev, tags: newTags };
    });
  }

  const handleVariantChange = <T extends keyof Variant>(
    variantId: string,
    field: T,
    value: Variant[T]
  ) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v =>
        v.id === variantId ? { ...v, [field]: value } : v
      ),
    }));
  };
  
  const handleImageChange = (variantId: string, index: number, field: 'url' | 'name', value: string) => {
    const newVariants = formData.variants.map(v => {
      if (v.id === variantId) {
        const newImages = [...v.images];
        const newImageNames = [...(v.imageNames || [])];
        if (field === 'url') {
            newImages[index] = value;
        } else {
            newImageNames[index] = value;
        }
        return { ...v, images: newImages, imageNames: newImageNames };
      }
      return v;
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };
  
  const addImageInput = (variantId: string) => {
     const newVariants = formData.variants.map(v => {
      if (v.id === variantId) {
        const newImageNames = v.imageNames ? [...v.imageNames, ''] : Array(v.images.length + 1).fill('');
        return { ...v, images: [...v.images, ''], imageNames: newImageNames };
      }
      return v;
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };
  
  const removeImageInput = (variantId: string, index: number) => {
    const newVariants = formData.variants.map(v => {
      if (v.id === variantId) {
         const newImages = v.images.filter((_, i) => i !== index);
         const newImageNames = v.imageNames?.filter((_, i) => i !== index);
         return { ...v, images: newImages, imageNames: newImageNames };
      }
      return v;
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { id: Date.now().toString(), color: '', colorHex: '#000000', price: '' as any, oldPrice: '' as any, images: [''], imageNames: [], sizes: [] }],
    }));
  };

  const removeVariant = (variantId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
    }));
  };

  const handleSizeStockChange = (variantId: string, size: string, stock: number) => {
    const newStock = Math.max(0, stock);
    
    setFormData(prev => {
        const newVariants = prev.variants.map(v => {
            if (v.id === variantId) {
                const existingSizeIndex = v.sizes.findIndex(s => s.size === size);
                let newSizes: SizeInfo[];
                
                if (existingSizeIndex > -1) {
                    newSizes = v.sizes.map((s, index) => 
                        index === existingSizeIndex ? { ...s, stock: newStock } : s
                    );
                } else {
                    newSizes = [...v.sizes, { size, stock: newStock }];
                }
                
                return { ...v, sizes: newSizes };
            }
            return v;
        });
        return { ...prev, variants: newVariants };
    });
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalVariants = formData.variants.map(v => {
      const variant: Partial<Variant> = {
        ...v,
        images: v.images.filter(Boolean),
        price: parseFloat(String(v.price)) || 0,
        sizes: availableSizes
          .map(size => {
            const foundSize = v.sizes.find(s => s.size === size);
            return { size, stock: foundSize?.stock ?? 0 };
          })
          .filter(s => s.stock >= 0)
      };
      
      const oldPriceValue = parseFloat(String(v.oldPrice));
        if (!isNaN(oldPriceValue) && oldPriceValue > 0) {
        variant.oldPrice = oldPriceValue;
      }


      if (formData.category === 'perfumes' || formData.subCategory === 'mochilas' || formData.category === 'acessorios') {
          const singleSize = variant.sizes?.find(s => s.size === 'U');
          variant.sizes = [{ size: 'U', stock: singleSize?.stock || 0 }];
      }

      if (formData.subCategory === 'mochilas') {
        variant.imageNames = v.imageNames;
      } else {
        delete variant.imageNames;
      }

      return variant as Variant;
    });

    if (finalVariants.some(v => v.images.length === 0)) {
        alert("Cada variante de cor deve ter pelo menos uma imagem.");
        return;
    }
    
    const productData: Omit<ProductWithId, 'firestoreId'> = {
      id: product?.id || new Date().getTime().toString(),
      name: formData.name,
      brand: formData.brand,
      description: formData.longDescription.substring(0, 100),
      longDescription: formData.longDescription,
      gender: formData.gender as Product['gender'],
      category: formData.category as Product['category'],
      subCategory: formData.subCategory,
      variants: finalVariants,
      status: formData.status as Product['status'],
      rating: product?.rating || 0,
      reviews: product?.reviews || 0,
      tags: formData.tags,
      quality: formData.quality as Product['quality'],
      isImported: formData.isImported,
      showSizeChart: formData.showSizeChart,
      origin: formData.origin,
      hasGift: formData.hasGift,
    };
    
    // Remove price from top-level product data if it exists from old structure
    if ('price' in productData) {
      delete (productData as any).price;
    }
    if ('oldPrice' in productData) {
      delete (productData as any).oldPrice;
    }

    await onSave(productData);
    onClose();
  };

  const isPerfume = formData.category === 'perfumes';
  const isBackpack = formData.subCategory === 'mochilas';
  const isSizeGeneratorVisible = ['calcados', 'roupas'].includes(formData.category);


  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="h-[70vh] pr-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" value={formData.brand} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longDescription">Descrição</Label>
            <Textarea id="longDescription" value={formData.longDescription} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">Origem (Admin)</Label>
            <Input id="origin" value={formData.origin} onChange={handleChange} placeholder="Nome do site/fornecedor"/>
          </div>
          
           <div className="space-y-4">
              <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="unissex">Unissex</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calcados">Calçados</SelectItem>
                        <SelectItem value="roupas">Roupas</SelectItem>
                        <SelectItem value="acessorios">Acessórios</SelectItem>
                        <SelectItem value="perfumes">Perfumes</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                {subCategoryOptions.length > 0 && !isPerfume && (
                    <div className="space-y-2">
                        <Label htmlFor="subCategory">Subcategoria</Label>
                        <Select value={formData.subCategory} onValueChange={(value) => handleSelectChange('subCategory', value)}>
                        <SelectTrigger id="subCategory">
                            <SelectValue placeholder="Selecione a subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {subCategoryOptions.map(sub => (
                                <SelectItem key={sub} value={sub.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}>{sub}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="quality">Nível de Qualidade</Label>
                    <Select value={formData.quality} onValueChange={(value) => handleSelectChange('quality', value)}>
                      <SelectTrigger id="quality">
                        <SelectValue placeholder="Selecione a qualidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Essential">Essential</SelectItem>
                        <SelectItem value="Select">Select</SelectItem>
                        <SelectItem value="Elite">Elite</SelectItem>
                        <SelectItem value="Ultra">Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label>Tags da Home</Label>
                    <div className="flex flex-wrap items-center gap-4">
                        {allTags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`tag-${tag.id}`}
                                checked={formData.tags.includes(tag.id)}
                                onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
                            />
                            <Label htmlFor={`tag-${tag.id}`} className="font-normal">{tag.label}</Label>
                        </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="isImported"
                        checked={formData.isImported}
                        onCheckedChange={(checked) => setFormData(prev => ({...prev, isImported: !!checked}))}
                    />
                    <Label htmlFor="isImported">Produto Importado</Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="showSizeChart"
                        checked={formData.showSizeChart}
                        onCheckedChange={(checked) => setFormData(prev => ({...prev, showSizeChart: !!checked}))}
                    />
                    <Label htmlFor="showSizeChart">Exibir Tabela de Medidas</Label>
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="hasGift"
                        checked={formData.hasGift}
                        onCheckedChange={(checked) => setFormData(prev => ({...prev, hasGift: !!checked}))}
                    />
                    <Label htmlFor="hasGift">Oferecer Pulseira de Brinde</Label>
                </div>

          </div>

          <div className="space-y-4">
            <Label>{isPerfume ? 'Imagens e Estoque' : 'Variantes de Cor'}</Label>
            <Accordion type="multiple" className="w-full" defaultValue={formData.variants.map(v => v.id)}>
              {formData.variants.map((variant, vIndex) => {
                if (isPerfume && vIndex > 0) return null; // Show only one variant for perfumes
                return (
                <AccordionItem key={variant.id} value={variant.id} className="border rounded-md">
                   <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex items-center gap-4">
                            {!isPerfume && <ColorSwatch colorHex={variant.colorHex} />}
                            <span className="font-semibold">{isPerfume ? 'Imagens e Estoque' : (variant.color || "Nova Cor")}</span>
                        </div>
                   </AccordionTrigger>
                   <AccordionContent className="p-4 pt-0">
                     <div className="space-y-4">
                        {(!isPerfume || isBackpack) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label>Nome da Cor</Label>
                                  <Input 
                                      placeholder="Ex: Preto, Branco, Azul" 
                                      value={variant.color}
                                      onChange={(e) => handleVariantChange(variant.id, 'color', e.target.value)}
                                      required
                                  />
                              </div>
                              <div className="space-y-2">
                                  <Label>Cor Hexadecimal</Label>
                                  <div className="flex items-center gap-2">
                                      <Input 
                                          type="color" 
                                          value={variant.colorHex.split('/')[0].trim()}
                                          onChange={(e) => {
                                              const colors = variant.colorHex.split('/');
                                              colors[0] = e.target.value;
                                              handleVariantChange(variant.id, 'colorHex', colors.join(' / '))
                                          }}
                                          className="p-1 h-10 w-10 shrink-0"
                                      />
                                      <Input 
                                          placeholder="#000000 ou #000000 / #FFFFFF"
                                          value={variant.colorHex}
                                          onChange={(e) => handleVariantChange(variant.id, 'colorHex', e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`price-${variant.id}`}>Preço</Label>
                                <Input id={`price-${variant.id}`} type="number" value={variant.price ?? ''} onChange={e => handleVariantChange(variant.id, 'price', parseFloat(e.target.value) || 0)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`oldPrice-${variant.id}`}>Preço Antigo (Opcional)</Label>
                                <Input id={`oldPrice-${variant.id}`} type="number" value={variant.oldPrice ?? ''} onChange={e => handleVariantChange(variant.id, 'oldPrice', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>

                        <div className="space-y-3">
                          <Label>{isBackpack ? 'Imagens da Variação' : 'Links das Imagens'}</Label>
                          {variant.images.map((image, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex-grow space-y-1">
                                <Input
                                    placeholder={`URL da Imagem ${index + 1}`}
                                    value={image}
                                    onChange={(e) => handleImageChange(variant.id, index, 'url', e.target.value)}
                                    required={index === 0}
                                />
                                {isBackpack && (
                                    <Input
                                        placeholder="Nome da variação (Ex: Mochila Stitch)"
                                        value={variant.imageNames?.[index] || ''}
                                        onChange={(e) => handleImageChange(variant.id, index, 'name', e.target.value)}
                                    />
                                )}
                              </div>
                              {variant.images.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeImageInput(variant.id, index)} className="text-destructive">
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addImageInput(variant.id)}>
                            Adicionar Imagem
                          </Button>
                        </div>
                        
                        {(isPerfume || isBackpack || formData.category === 'acessorios') ? (
                           <div className="space-y-2">
                                <Label htmlFor={`stock-${variant.id}-U`}>Estoque</Label>
                                <Input 
                                    id={`stock-${variant.id}-U`}
                                    type="number"
                                    placeholder="Estoque"
                                    value={variant.sizes.find(s => s.size === 'U')?.stock ?? ''}
                                    onChange={(e) => handleSizeStockChange(variant.id, 'U', parseInt(e.target.value, 10) || 0)}
                                    min="0"
                                    required
                                />
                            </div>
                        ) : (
                         <div className="space-y-3">
                                <Label>Tamanhos e Estoque</Label>
                                {isSizeGeneratorVisible && (
                                    <div className="flex items-end gap-2 rounded-md border p-3">
                                        <div className="flex-grow space-y-1">
                                            <Label htmlFor="size-range" className="text-xs">Gerador de Tamanhos</Label>
                                            <Input 
                                                id="size-range"
                                                placeholder="Ex: 34-45 ou P,M,G ou 33/34,35/36"
                                                value={sizeRange}
                                                onChange={(e) => setSizeRange(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateSizes(); } }}
                                            />
                                        </div>
                                        <Button type="button" onClick={handleGenerateSizes}>Gerar</Button>
                                    </div>
                                )}

                                {availableSizes.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {availableSizes.map(size => {
                                            const sizeInfo = variant.sizes.find(s => s.size === size);
                                            return (
                                                <div key={size} className="space-y-1">
                                                    <Label htmlFor={`stock-${variant.id}-${size}`}>{size}</Label>
                                                    <Input 
                                                        id={`stock-${variant.id}-${size}`}
                                                        type="number"
                                                        placeholder="Estoque"
                                                        value={sizeInfo?.stock ?? ''}
                                                        onChange={(e) => handleSizeStockChange(variant.id, size, parseInt(e.target.value, 10) || 0)}
                                                        min="0"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    !isSizeGeneratorVisible && <p className="text-sm text-muted-foreground">Selecione uma categoria para ver os tamanhos.</p>
                                )}
                            </div>
                          )}

                         {!isPerfume && formData.variants.length > 1 && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(variant.id)} className="mt-4">
                                Remover Variante de Cor
                            </Button>
                         )}
                     </div>
                   </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>

            {!isPerfume && (
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="mt-4">
                  <Palette className="mr-2 h-4 w-4" /> Adicionar Variante de Cor
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="pt-6">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
};

export default function ProductManagement() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithId | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...(doc.data() as Product),
        })).filter(p => p.name && p.variants); // Basic data validation
        
        setProducts(productsData);
      },
      (error) => {
        console.error("Error fetching products:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar produtos',
          description: 'Não foi possível carregar os produtos do banco de dados.',
        });
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
        return products;
    }
    const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return products.filter(p => {
        const productName = p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const productBrand = p.brand?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || '';
        return productName.includes(normalizedSearchTerm) || productBrand.includes(normalizedSearchTerm);
    });
  }, [products, searchTerm]);

  const handleSave = async (productData: Omit<ProductWithId, 'firestoreId'>) => {
    if (!firestore) return;
    
    const cleanProductData = { ...productData };

    try {
      if (editingProduct) {
        const docRef = doc(firestore, 'products', editingProduct.firestoreId);
        await updateDoc(docRef, cleanProductData);
        toast({ title: 'Sucesso!', description: 'Produto atualizado.' });
      } else {
        await addDoc(collection(firestore, 'products'), cleanProductData);
        toast({ title: 'Sucesso!', description: 'Produto criado.' });
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível salvar o produto.',
      });
      // Re-throw to prevent form from closing on error
      throw error;
    }
  };

  const handleDelete = async (firestoreId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'products', firestoreId));
      toast({
        title: 'Produto Removido!',
        description: 'O produto foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível remover o produto.',
      });
    }
  };

  const openFormToEdit = (product: ProductWithId) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const openFormToCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Gerenciamento de Produtos</CardTitle>
              <CardDescription>Adicione, edite ou remova produtos da sua loja.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar produto ou marca..."
                        className="pl-8 sm:w-auto"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                  if (!isOpen) closeForm();
                  else setIsFormOpen(true);
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={openFormToCreate}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? 'Editar' : 'Adicionar'} Produto</DialogTitle>
                    </DialogHeader>
                    <ProductForm 
                      product={editingProduct} 
                      onSave={handleSave} 
                      onClose={closeForm} 
                    />
                  </DialogContent>
                </Dialog>
            </div>
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const firstVariant = product.variants?.[0];
              const imageUrl = fixImageUrl(firstVariant?.images?.[0]);
              const price = firstVariant?.price ?? 0;
              
              return (
              <TableRow key={product.firestoreId}>
                <TableCell>
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                   {product.origin || 'N/A'}
                </TableCell>
                <TableCell>
                  R$ {price.toFixed(2).replace('.', ',')}
                </TableCell>
                <TableCell>
                  <QualityBadge quality={product.quality} size="sm" />
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openFormToEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Isso irá remover permanentemente o produto do seu banco de dados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(product.firestoreId)} className="bg-destructive hover:bg-destructive/90">
                          Sim, remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
         {filteredProducts.length === 0 && !products.length && (
            <div className="text-center p-8 text-muted-foreground">
                Nenhum produto encontrado.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
