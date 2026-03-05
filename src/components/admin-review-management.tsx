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
  orderBy,
  writeBatch
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
import { Star, Trash2, PlusCircle, Search, MessageSquare, Loader2, User, Sparkles, Check, ChevronsUpDown, Zap } from 'lucide-react';
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
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

type ProductWithId = Product & { firestoreId: string };

const BRAZILIAN_NAMES = [
  "Lucas Silva", "Mariana Costa", "Carlos Oliveira", "Fernanda Santos", "Rafael Souza", 
  "Juliana Pereira", "Bruno Ferreira", "Camila Rodrigues", "Gabriel Almeida", "Beatriz Lima",
  "Thiago Gomes", "Letícia Barbosa", "Felipe Martins", "Amanda Rocha", "Rodrigo Carvalho",
  "Patrícia Ribeiro", "Gustavo Rezende", "Isabela Castro", "Daniel Moraes", "Larissa Vieira",
  "André Luiz", "Renata Souza", "Marcelo Augusto", "Carolina Mendes", "Vinícius Jr",
  "Paula Tejando", "Fabrício Lopes", "Vanessa Dias", "Leandro Lima", "Tatiane Ramos"
];

const COMMENT_TEMPLATES = {
  calcados: [
    "O tênis é sensacional, muito mais bonito pessoalmente.",
    "Super confortável para o dia a dia, recomendo!",
    "Qualidade do material me surpreendeu bastante.",
    "Pisei e senti a diferença no amortecimento, nota 10.",
    "Chegou muito rápido e veio bem embalado.",
    "O tamanho veio certinho, segui a tabela de medidas.",
    "A cor é idêntica ao que vi no site.",
    "Um dos melhores calçados que já comprei ultimamente."
  ],
  roupas: [
    "O tecido é muito premium e o caimento ficou perfeito.",
    "Veste super bem, a modelagem é muito moderna.",
    "Camiseta top, não desbotou após a primeira lavagem.",
    "O material é bem fresco e confortável.",
    "Ficou ótimo no corpo, exatamente o que eu esperava.",
    "Acabamento impecável em cada detalhe.",
    "Gostei muito da qualidade da estampa.",
    "Valeu cada centavo, a peça é linda."
  ],
  acessorios: [
    "Produto muito bem feito, acabamento de primeira.",
    "Dá um up total no visual, gostei demais.",
    "Super prático e estiloso, uso todo dia.",
    "Excelente material, parece que vai durar muito.",
    "Detalhes que fazem a diferença, muito satisfeito.",
    "Chegou antes do prazo e em perfeitas condições.",
    "Ótimo custo-benefício para quem busca estilo.",
    "Design moderno e material resistente."
  ],
  perfumes: [
    "Fragrância marcante e muito agradável.",
    "Fixação excelente na minha pele, durou o dia todo.",
    "O cheiro é viciante, todo mundo pergunta qual é.",
    "Veio lacrado e bem protegido na caixa.",
    "Projeção na medida certa, muito elegante.",
    "Amei o perfume, virou meu favorito.",
    "Entrega rápida e produto 100% original.",
    "Perfume sofisticado, perfeito para ocasiões especiais."
  ],
  general: [
    "Produto excelente e a entrega foi super rápida.",
    "Primeira vez comprando e achei o site muito confiável.",
    "Pelo preço valeu muito a pena o investimento.",
    "Fiel à descrição e fotos do site.",
    "Atendimento da loja nota 10.",
    "Material muito bom, recomendo a todos.",
    "Superou minhas expectativas em todos os sentidos.",
    "Com certeza comprarei novamente outros modelos."
  ]
};

export default function AdminReviewManagement() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  
  // Bulk Generation States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkConfig, setBulkModalConfig] = useState({
    productCount: '50',
    reviewsPerProduct: '3',
  });
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const { toast } = useToast();
  const firestore = useFirestore();

  const [formData, setFormData] = useState({
    userName: '',
    rating: '5',
    comment: '',
  });

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const q = query(collection(firestore, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        firestoreId: doc.id,
        ...(doc.data() as Product),
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

  const activeProducts = useMemo(() => {
    return products.filter(p => p.status === 'ativo');
  }, [products]);

  const activeProductsForSelection = useMemo(() => {
    return activeProducts.filter(p => 
      p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
      p.brand?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [activeProducts, productSearchTerm]);

  const selectedProduct = useMemo(() => 
    products.find(p => p.firestoreId === selectedProductId), 
  [products, selectedProductId]);

  const generateRandomReview = (category: string = 'general') => {
    const name = BRAZILIAN_NAMES[Math.floor(Math.random() * BRAZILIAN_NAMES.length)];
    const rating = Math.random() > 0.3 ? 5 : 4; // 70% 5 stars, 30% 4 stars
    
    const categoryOptions = (COMMENT_TEMPLATES as any)[category] || COMMENT_TEMPLATES.general;
    const generalOptions = COMMENT_TEMPLATES.general;
    
    // Mix category-specific and general templates
    const allOptions = [...categoryOptions, ...generalOptions];
    const comment = allOptions[Math.floor(Math.random() * allOptions.length)];

    return {
      id: Math.random().toString(36).substr(2, 9),
      userName: name,
      rating,
      comment,
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
    };
  };

  const handleBulkGenerate = async () => {
    if (!firestore || activeProducts.length === 0) return;
    
    setIsGeneratingBulk(true);
    setBulkProgress(0);

    const countToGenerate = bulkConfig.productCount === 'all' 
      ? activeProducts.length 
      : Math.min(parseInt(bulkConfig.productCount), activeProducts.length);
    
    const reviewsPerProd = parseInt(bulkConfig.reviewsPerProduct);

    // Shuffle active products to pick random ones
    const shuffledProducts = [...activeProducts].sort(() => 0.5 - Math.random());
    const selectedBatch = shuffledProducts.slice(0, countToGenerate);

    let completed = 0;

    try {
      // Process in smaller batches to avoid Firestore limits and keep UI responsive
      const chunkSize = 10;
      for (let i = 0; i < selectedBatch.length; i += chunkSize) {
        const chunk = selectedBatch.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (product) => {
          const newReviews: Review[] = [];
          for (let j = 0; j < reviewsPerProd; j++) {
            newReviews.push(generateRandomReview(product.category));
          }

          const productRef = doc(firestore, 'products', product.firestoreId);
          await updateDoc(productRef, {
            reviews: arrayUnion(...newReviews)
          });
          
          completed++;
          setBulkProgress(Math.round((completed / selectedBatch.length) * 100));
        }));
      }

      toast({
        title: 'Sucesso!',
        description: `Avaliações geradas com sucesso para ${selectedBatch.length} produtos.`,
      });
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error("Bulk generation error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro na geração',
        description: 'Ocorreu um erro ao gerar as avaliações em massa.',
      });
    } finally {
      setIsGeneratingBulk(false);
      setBulkProgress(0);
    }
  };

  const handleGenerateComment = () => {
    if (!selectedProductId) {
      toast({ variant: 'destructive', title: 'Selecione um produto primeiro' });
      return;
    }
    const review = generateRandomReview(selectedProduct?.category);
    setFormData(prev => ({ ...prev, comment: review.comment }));
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

  const handleDeleteReview = async (firestoreId: string, review: Review) => {
    if (!firestore) return;
    try {
      const productRef = doc(firestore, 'products', firestoreId);
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
              <CardDescription>Gerencie a prova social dos seus produtos ativos.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    Gerar em Massa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Geração de Avaliações em Massa</DialogTitle>
                    <DialogDescription>
                      Crie depoimentos realistas automaticamente para vários produtos ativos de uma vez.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {isGeneratingBulk ? (
                    <div className="py-8 space-y-4 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="font-medium">Gerando avaliações... {bulkProgress}%</p>
                      <Progress value={bulkProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">Isso pode levar alguns minutos dependendo da quantidade.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      <div className="space-y-3">
                        <Label>Quantidade de Produtos Ativos</Label>
                        <Select 
                          value={bulkConfig.productCount} 
                          onValueChange={(val) => setBulkModalConfig(prev => ({...prev, productCount: val}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="20">20 produtos aleatórios</SelectItem>
                            <SelectItem value="50">50 produtos aleatórios</SelectItem>
                            <SelectItem value="100">100 produtos aleatórios</SelectItem>
                            <SelectItem value="200">200 produtos aleatórios</SelectItem>
                            <SelectItem value="all">Todos os produtos ativos ({activeProducts.length})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Avaliações por Produto</Label>
                        <Select 
                          value={bulkConfig.reviewsPerProduct} 
                          onValueChange={(val) => setBulkModalConfig(prev => ({...prev, reviewsPerProduct: val}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 avaliação por produto</SelectItem>
                            <SelectItem value="3">3 avaliações por produto</SelectItem>
                            <SelectItem value="5">5 avaliações por produto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-lg bg-secondary/50 p-4 border text-sm space-y-2">
                        <p className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> Como funciona?</p>
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                          <li>Seleciona apenas produtos com status <strong>"ativo"</strong>.</li>
                          <li>Gera nomes brasileiros comuns aleatoriamente.</li>
                          <li>Cria comentários baseados na categoria do produto.</li>
                          <li>Distribui notas entre 4 e 5 estrelas.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    {!isGeneratingBulk && (
                      <>
                        <DialogClose asChild>
                          <Button variant="ghost">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleBulkGenerate} className="gap-2">
                          Iniciar Geração
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog onOpenChange={(open) => { if(!open) setIsProductSelectorOpen(false); }}>
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
                    <div className="space-y-2 relative">
                      <Label>Selecione o Produto (Somente Ativos)</Label>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                          onClick={() => setIsProductSelectorOpen(!isProductSelectorOpen)}
                        >
                          <span className="truncate pr-4">
                            {selectedProductId
                              ? products.find((p) => p.firestoreId === selectedProductId)?.name
                              : "Escolha um produto..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>

                        {isProductSelectorOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-[40]" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsProductSelectorOpen(false);
                              }} 
                            />
                            <div 
                              className="absolute top-full left-0 z-[50] w-full mt-1 border bg-popover text-popover-foreground shadow-md rounded-md animate-in fade-in-0 zoom-in-95 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <input
                                    placeholder="Buscar produto..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="w-full bg-transparent pl-8 h-9 outline-none text-sm"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <ScrollArea className="h-[200px]">
                                <div className="p-1">
                                  {activeProductsForSelection.length > 0 ? (
                                    activeProductsForSelection.map((p) => (
                                      <button
                                        key={p.firestoreId}
                                        type="button"
                                        className={cn(
                                          "flex w-full items-center px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors",
                                          selectedProductId === p.firestoreId && "bg-accent"
                                        )}
                                        onClick={() => {
                                          setSelectedProductId(p.firestoreId);
                                          setIsProductSelectorOpen(false);
                                          setProductSearchTerm('');
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            selectedProductId === p.firestoreId ? "opacity-100" : "opacity-0"
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
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do Cliente</Label>
                      <Input 
                        placeholder="Ex: João Silva" 
                        value={formData.userName}
                        onChange={e => setFormData(prev => ({...prev, userName: e.target.value}))}
                      />
                    </div>
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
                          Sugerir texto
                        </Button>
                      </div>
                      <Textarea 
                        placeholder="O que o cliente achou?" 
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
                <TableHead>Status</TableHead>
                <TableHead>Total de Avaliações</TableHead>
                <TableHead>Média</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><div className="h-8 w-full bg-secondary animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).length > 0 ? (
                filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).map((product) => {
                  const productReviews = Array.isArray(product.reviews) ? product.reviews : [];
                  const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) || 0;
                  const score = productReviews.length ? (avg / productReviews.length).toFixed(1) : 0;
                  return (
                    <React.Fragment key={product.firestoreId}>
                      <TableRow>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                            product.status === 'ativo' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {product.status}
                          </span>
                        </TableCell>
                        <TableCell>{productReviews.length}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span>{score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedProductId(selectedProductId === product.firestoreId ? '' : product.firestoreId)}>
                            {selectedProductId === product.firestoreId ? 'Fechar' : 'Ver Avaliações'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {selectedProductId === product.firestoreId && (
                        <TableRow className="bg-secondary/20">
                          <TableCell colSpan={5} className="p-4">
                            <div className="space-y-4">
                              {productReviews.map((review) => (
                                <div key={review.id} className="flex items-start gap-4 p-3 bg-background rounded-lg border shadow-sm">
                                  <Avatar className="h-8 w-8 border">
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
                                            <AlertDialogAction onClick={() => handleDeleteReview(product.firestoreId, review)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
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
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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