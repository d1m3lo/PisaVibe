'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  orderBy
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Product, Review } from '@/lib/types';
import { Star, Trash2, PlusCircle, Search, MessageSquare, Loader2, User, Sparkles, Check, ChevronsUpDown } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

export default function AdminReviewManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const [formData, setFormData] = useState({
    userName: '',
    rating: '5',
    comment: '',
    userAvatar: '',
  });

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const q = query(collection(firestore, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, 'id'>),
      }));
      setProducts(productsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const filteredProductsForTable = useMemo(() => {
    return products.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const activeProductsForSelection = useMemo(() => {
    return products.filter(p => 
      p.status === 'ativo' && 
      (p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
       p.brand?.toLowerCase().includes(productSearchTerm.toLowerCase()))
    );
  }, [products, productSearchTerm]);

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedProductId), 
  [products, selectedProductId]);

  const handleGenerateComment = () => {
    if (!selectedProductId) {
      toast({ variant: 'destructive', title: 'Selecione um produto primeiro' });
      return;
    }

    const category = selectedProduct?.category || 'calcados';
    
    const comments: Record<string, string[]> = {
      calcados: [
        "Tênis muito confortável, superou minhas expectativas. Entrega rápida!",
        "Gostei muito desse tênis, bem confortável e bonito.",
        "Qualidade impecável, calça muito bem. Recomendo!",
        "Muito satisfeito com a compra, o tênis é idêntico à foto.",
        "Pisei e senti a diferença, amortecimento nota 10."
      ],
      roupas: [
        "Camiseta muito boa, tecido confortável e veste bem.",
        "O caimento ficou perfeito, material de primeira qualidade.",
        "Muito estilosa e o tecido é bem macio. Vale cada centavo.",
        "Gostei bastante, a cor é linda e o tamanho veio certinho.",
        "Peça essencial no guarda-roupa, muito bem acabada."
      ],
      acessorios: [
        "Acessório top, dá um up no visual. Recomendo muito.",
        "Qualidade excelente e design muito moderno.",
        "Chegou direitinho, muito bonito e bem feito.",
        "Surpreendido com os detalhes, excelente acabamento.",
        "Prático e estiloso, exatamente o que eu procurava."
      ],
      perfumes: [
        "Fragrância incrível, fixação muito boa na minha pele.",
        "Amei o cheiro, muito marcante e elegante.",
        "Excelente custo-benefício, o perfume é maravilhoso.",
        "Chegou muito bem embalado, perfume original e lacrado.",
        "Fixa muito bem e projeta na medida certa. Sensacional."
      ]
    };

    const options = comments[category as keyof typeof comments] || comments.calcados;
    const randomComment = options[Math.floor(Math.random() * options.length)];
    
    setFormData(prev => ({ ...prev, comment: randomComment }));
    toast({ title: 'Comentário sugerido com sucesso!' });
  };

  const handleAddReview = async () => {
    if (!firestore || !selectedProductId) return;
    setIsAddingReview(true);

    try {
      const newReview: Review = {
        id: Date.now().toString(),
        userName: formData.userName,
        rating: parseInt(formData.rating),
        comment: formData.comment,
        userAvatar: formData.userAvatar || `https://i.pravatar.cc/150?u=${Date.now()}`,
        date: new Date().toISOString(),
      };

      const productRef = doc(firestore, 'products', selectedProductId);
      await updateDoc(productRef, {
        reviews: arrayUnion(newReview)
      });

      toast({
        title: 'Sucesso!',
        description: 'Avaliação adicionada ao produto.',
      });

      setFormData({
        userName: '',
        rating: '5',
        comment: '',
        userAvatar: '',
      });
      setSelectedProductId('');
      setProductSearchTerm('');
    } catch (error) {
      console.error("Error adding review:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar a avaliação.',
      });
    } finally {
      setIsAddingReview(false);
    }
  };

  const handleDeleteReview = async (productId: string, review: Review) => {
    if (!firestore) return;
    try {
      const productRef = doc(firestore, 'products', productId);
      await updateDoc(productRef, {
        reviews: arrayRemove(review)
      });
      toast({ title: 'Avaliação removida.' });
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({ variant: 'destructive', title: 'Erro ao remover.' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Gerenciamento de Avaliações</CardTitle>
              <CardDescription>Adicione avaliações manuais para criar prova social.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Nova Avaliação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Avaliação Manual</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Selecione o Produto (Somente Ativos)</Label>
                    <Popover open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen} modal={false}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isProductSelectorOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedProductId
                            ? products.find((p) => p.id === selectedProductId)?.name
                            : "Escolha um produto..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" 
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar produto..."
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                              className="pl-8 h-9"
                              autoFocus
                            />
                          </div>
                        </div>
                        <ScrollArea className="h-[200px]">
                          <div className="p-1">
                            {activeProductsForSelection.length > 0 ? (
                              activeProductsForSelection.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left",
                                    selectedProductId === p.id && "bg-accent"
                                  )}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedProductId(p.id);
                                    setIsProductSelectorOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProductId === p.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="truncate">{p.name}</span>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Nenhum produto ativo encontrado.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input 
                      placeholder="Ex: João Silva" 
                      value={formData.userName}
                      onChange={e => setFormData(prev => ({...prev, userName: e.target.value}))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estrelas (1-5)</Label>
                      <Select value={formData.rating} onValueChange={val => setFormData(prev => ({...prev, rating: val}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Estrelas</SelectItem>
                          <SelectItem value="4">4 Estrelas</SelectItem>
                          <SelectItem value="3">3 Estrelas</SelectItem>
                          <SelectItem value="2">2 Estrelas</SelectItem>
                          <SelectItem value="1">1 Estrela</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>URL Avatar (Opcional)</Label>
                      <Input 
                        placeholder="https://..." 
                        value={formData.userAvatar}
                        onChange={e => setFormData(prev => ({...prev, userAvatar: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Comentário</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={handleGenerateComment}
                        disabled={!selectedProductId}
                      >
                        <Sparkles className="h-3 w-3" />
                        Gerar comentário
                      </Button>
                    </div>
                    <Textarea 
                      placeholder="Escreva o que o cliente achou..." 
                      value={formData.comment}
                      onChange={e => setFormData(prev => ({...prev, comment: e.target.value}))}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleAddReview} 
                    disabled={isAddingReview || !selectedProductId || !formData.userName || !formData.comment}
                  >
                    {isAddingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Avaliação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto para ver avaliações..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Total de Avaliações</TableHead>
                <TableHead>Média</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><div className="h-8 w-full bg-secondary animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).length > 0 ? (
                filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).map((product) => {
                  const productReviews = Array.isArray(product.reviews) ? product.reviews : [];
                  const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) || 0;
                  const score = productReviews.length ? (avg / productReviews.length).toFixed(1) : 0;
                  return (
                    <React.Fragment key={product.id}>
                      <TableRow>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{productReviews.length}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span>{score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedProductId(selectedProductId === product.id ? '' : product.id)}>
                            {selectedProductId === product.id ? 'Fechar' : 'Ver Detalhes'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {selectedProductId === product.id && (
                        <TableRow className="bg-secondary/20">
                          <TableCell colSpan={4} className="p-4">
                            <div className="space-y-4">
                              {productReviews.map((review) => (
                                <div key={review.id} className="flex items-start gap-4 p-3 bg-background rounded-lg border shadow-sm">
                                  <Avatar className="h-8 w-8 border">
                                    <AvatarImage src={review.userAvatar} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-semibold text-sm">{review.userName}</p>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteReview(product.id, review)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                    <div className="flex gap-0.5 my-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                                      ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    Nenhum produto com avaliações encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}