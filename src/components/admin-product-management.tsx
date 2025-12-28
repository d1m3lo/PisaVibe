
'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Firestore,
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
import { PlusCircle, Edit, Trash2, X, Palette } from 'lucide-react';
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

type ProductWithId = Product & { firestoreId: string };

const categoryMappings = {
  masculino: {
    'calcados': ['Casual', 'Chinelo', 'Streetwear', 'Sneakers'],
    'roupas': ['Camisetas', 'Calças', 'Shorts', 'Polos', 'Streetwear'],
    'acessorios': ['Bonés', 'Mochilas', 'Relógios'],
    'perfumes': [],
  },
  feminino: {
    'calcados': ['Casual', 'Sandálias', 'Chinelo', 'Streetwear', 'Sneakers'],
    'roupas': ['Camisetas', 'Vestidos', 'Calças & Leggings', 'Streetwear'],
    'acessorios': ['Bonés', 'Bolsas', 'Mochilas'],
    'perfumes': [],
  },
  unissex: {
    'calcados': ['Casual', 'Chinelo', 'Streetwear', 'Sneakers'],
    'roupas': ['Camisetas', 'Streetwear'],
    'acessorios': ['Bonés', 'Mochilas'],
    'perfumes': [],
  }
};

const allSizes = {
    roupas: ['P', 'M', 'G', 'GG'],
    calcados: [], // Será preenchido dinamicamente
    acessorios: ['U'],
    perfumes: ['U']
};

const allTags = [
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'destaques', label: 'Destaques' },
    { id: 'ofertas', label: 'Ofertas' },
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
    price: product?.price || '',
    oldPrice: product?.oldPrice || '',
    longDescription: product?.longDescription || '',
    gender: product?.gender || 'masculino',
    category: product?.category || 'calcados',
    subCategory: product?.subCategory || '',
    variants: product?.variants || [{ id: Date.now().toString(), color: '', colorHex: '#000000', images: [''], sizes: [] }],
    status: product?.status || 'ativo',
    tags: product?.tags || [],
    quality: product?.quality || 'Select',
    origin: product?.origin || '',
  });

  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeRange, setSizeRange] = useState('');


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
    
    // Se a categoria não for calçados, usa o padrão. Se for, espera a geração.
    if(formData.category !== 'calcados') {
        setAvailableSizes(allSizes[formData.category as keyof typeof allSizes] || []);
    } else {
        // Se já houver tamanhos no produto sendo editado, popule a lista
        const allVariantSizes = product?.variants.flatMap(v => v.sizes.map(s => s.size)) || [];
        const uniqueSizes = [...new Set(allVariantSizes)].sort((a,b) => Number(a) - Number(b));
        if (uniqueSizes.length > 0) {
            setAvailableSizes(uniqueSizes);
        } else {
            setAvailableSizes([]);
        }
    }


  }, [formData.gender, formData.category, product]);

  const handleGenerateSizes = () => {
    const [start, end] = sizeRange.split('-').map(Number);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
        const newSizes = [];
        for (let i = start; i <= end; i++) {
            newSizes.push(String(i));
        }
        setAvailableSizes(newSizes);
    } else {
        alert("Formato inválido. Use algo como '34-45'.");
    }
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
  
  const handleImageChange = (variantId: string, index: number, value: string) => {
    const newVariants = formData.variants.map(v => {
      if (v.id === variantId) {
        const newImages = [...v.images];
        newImages[index] = value;
        return { ...v, images: newImages };
      }
      return v;
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };
  
  const addImageInput = (variantId: string) => {
     const newVariants = formData.variants.map(v => {
      if (v.id === variantId) {
        return { ...v, images: [...v.images, ''] };
      }
      return v;
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };
  
  const removeImageInput = (variantId: string, index: number) => {
    const newVariants = formData.variants.map(v => {
      if (v.id === variantId) {
         const newImages = v.images.filter((_, i) => i !== index);
         return { ...v, images: newImages };
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
        { id: Date.now().toString(), color: '', colorHex: '#000000', images: [''], sizes: [] },
      ],
    }));
  };

  const removeVariant = (variantId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
    }));
  };

  const handleSizeStockChange = (variantId: string, size: string, stock: number) => {
    const newVariants = formData.variants.map(v => {
        if (v.id === variantId) {
            const existingSize = v.sizes.find(s => s.size === size);
            let newSizes: SizeInfo[];
            if (existingSize) {
                newSizes = v.sizes.map(s => s.size === size ? { ...s, stock: Math.max(0, stock) } : s);
            } else {
                newSizes = [...v.sizes, { size, stock: Math.max(0, stock) }];
            }
            return { ...v, sizes: newSizes };
        }
        return v;
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalVariants = formData.variants.map(v => ({
      ...v,
      images: v.images.filter(Boolean)
    }));

    if (finalVariants.some(v => v.images.length === 0)) {
        alert("Cada variante de cor deve ter pelo menos uma imagem.");
        return;
    }

    const productData: Omit<ProductWithId, 'firestoreId'> = {
      id: product?.id || new Date().getTime().toString(),
      name: formData.name,
      brand: formData.brand,
      price: parseFloat(String(formData.price)) || 0,
      oldPrice: parseFloat(String(formData.oldPrice)) || undefined,
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
      origin: formData.origin,
    };
    await onSave(productData);
    onClose();
  };

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input id="price" type="number" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="oldPrice">Preço Antigo (Opcional)</Label>
                <Input id="oldPrice" type="number" value={formData.oldPrice} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="longDescription">Descrição</Label>
            <Textarea id="longDescription" value={formData.longDescription} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">Origem (Admin)</Label>
            <Input id="origin" value={formData.origin} onChange={handleChange} placeholder="URL ou nome do fornecedor"/>
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
                {subCategoryOptions.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="subCategory">Subcategoria</Label>
                        <Select value={formData.subCategory} onValueChange={(value) => handleSelectChange('subCategory', value)}>
                        <SelectTrigger id="subCategory">
                            <SelectValue placeholder="Selecione a subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {subCategoryOptions.map(sub => (
                                <SelectItem key={sub} value={sub.toLowerCase()}>{sub}</SelectItem>
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

          </div>

          <div className="space-y-4">
            <Label>Variantes de Cor</Label>
            <Accordion type="multiple" className="w-full" defaultValue={formData.variants.map(v => v.id)}>
              {formData.variants.map((variant, vIndex) => (
                <AccordionItem key={variant.id} value={variant.id} className="border rounded-md">
                   <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex items-center gap-4">
                            <ColorSwatch colorHex={variant.colorHex} />
                            <span className="font-semibold">{variant.color || "Nova Cor"}</span>
                        </div>
                   </AccordionTrigger>
                   <AccordionContent className="p-4 pt-0">
                     <div className="space-y-4">
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

                        <div className="space-y-3">
                          <Label>Links das Imagens para esta Cor</Label>
                          {variant.images.map((image, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder={`URL da Imagem ${index + 1}`}
                                value={image}
                                onChange={(e) => handleImageChange(variant.id, index, e.target.value)}
                                required={index === 0}
                              />
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
                        
                         <div className="space-y-3">
                                <Label>Tamanhos e Estoque</Label>
                                {formData.category === 'calcados' && (
                                    <div className="flex items-end gap-2 rounded-md border p-3">
                                        <div className="flex-grow space-y-1">
                                            <Label htmlFor="size-range" className="text-xs">Intervalo de Tamanhos</Label>
                                            <Input 
                                                id="size-range"
                                                placeholder="Ex: 34-45"
                                                value={sizeRange}
                                                onChange={(e) => setSizeRange(e.target.value)}
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
                                    formData.category !== 'calcados' && <p className="text-sm text-muted-foreground">Selecione uma categoria para ver os tamanhos.</p>
                                )}
                            </div>


                         {formData.variants.length > 1 && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(variant.id)} className="mt-4">
                                Remover Variante de Cor
                            </Button>
                         )}
                     </div>
                   </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="mt-4">
                <Palette className="mr-2 h-4 w-4" /> Adicionar Variante de Cor
            </Button>
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithId | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const unsubscribe = onSnapshot(
      collection(firestore, 'products'),
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

  const handleSave = async (productData: Omit<ProductWithId, 'firestoreId'>) => {
    if (!firestore) return;
    try {
      if (editingProduct) {
        const docRef = doc(firestore, 'products', editingProduct.firestoreId);
        await updateDoc(docRef, productData);
        toast({ title: 'Sucesso!', description: 'Produto atualizado.' });
      } else {
        await addDoc(collection(firestore, 'products'), productData);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Produtos</CardTitle>
          <CardDescription>Adicione, edite ou remova produtos da sua loja.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          if (!isOpen) closeForm();
          else setIsFormOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openFormToCreate}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.firestoreId}>
                <TableCell>
                  {product.variants?.[0]?.images?.[0] ? (
                    <Image src={product.variants[0].images[0]} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                      ?
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.brand || 'N/A'}</TableCell>
                <TableCell>
                  R$ {product.price.toFixed(2).replace('.', ',')}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
