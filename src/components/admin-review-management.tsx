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
import { Star, Trash2, PlusCircle, Search, MessageSquare, Loader2, User, Sparkles, Check, ChevronsUpDown, Zap, Eraser, AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const FEMALE_NAMES = ["Mariana", "Fernanda", "Camila", "Juliana", "Patricia", "Bruna", "Aline", "Beatriz", "Letícia", "Isabela", "Carolina", "Vanessa", "Larissa", "Renata", "Tatiane", "Amanda", "Beatriz", "Gabriela", "Rafaela", "Bianca", "Jessica", "Debora", "Priscila", "Luciana", "Monica", "Silvana", "Sandra", "Andreia", "Paula", "Carla", "Nicole", "Tainá", "Vitória", "Yasmin"];
const MALE_NAMES = ["Lucas", "Rafael", "Bruno", "Carlos", "Gabriel", "Matheus", "Felipe", "Thiago", "Gustavo", "Daniel", "André", "Marcelo", "Vinícius", "Fabrício", "Leandro", "Rodrigo", "Diego", "Eduardo", "Leonardo", "Hugo", "Ricardo", "Fernando", "Alexandre", "Roberto", "Marcos", "Antonio", "João", "Paulo", "Sergio", "Luiz", "Fabio", "Igor", "Murilo", "Enzo"];
const SURNAMES = ["Souza", "Santos", "Rodrigues", "Alves", "Lima", "Carvalho", "Martins", "Oliveira", "Costa", "Almeida", "Ferreira", "Ribeiro", "Barbosa", "Rocha", "Mendes", "Vieira", "Teixeira", "Gomes", "Moreira", "Nascimento", "Pereira", "Silva", "Gonçalves", "Araújo", "Cardoso", "Freitas", "Machado", "Dias", "Castro", "Nunes", "Monteiro", "Lopes", "Pinto", "Cardoso"];

const COMMENT_PARTS = {
  calcados: {
    features: ["bem confortável", "tamanho certinho", "muito macio", "estiloso demais", "leve no pé", "acabamento ótimo"],
    satisfaction: ["gostei muito", "valeu cada centavo", "superou as expectativas", "surpreso com a qualidade", "recomendo"],
    context: ["pra usar no dia a dia", "pra academia", "pra sair a noite", "pra trabalhar", "presente pro meu filho"]
  },
  roupas: {
    features: ["tecido muito bom", "caimento perfeito", "não desbotou", "costura bem feita", "fresquinho", "confortável"],
    satisfaction: ["ficou ótimo no corpo", "cor igual a da foto", "amei a peça", "comprarei mais vezes", "muito satisfeito"],
    context: ["ficou certinho o tamanho", "combina com tudo", "chegou bem embalado", "entrega rápida", "qualidade garantida"]
  },
  acessorios: {
    features: ["muito bonito", "material resistente", "detalhes impecáveis", "bem prático", "design moderno"],
    satisfaction: ["chegou tudo certo", "ótimo custo benefício", "recomendo a loja", "muito satisfeito", "top"],
    context: ["veio bem protegido", "uso todo dia", "surpreendeu no acabamento", "site confiável", "dentro do prazo"]
  },
  perfumes: {
    features: ["cheiro maravilhoso", "fixação excelente", "projeção muito boa", "fragrância marcante", "original"],
    satisfaction: ["meu novo favorito", "vale muito a pena", "recomendo demais", "chegou lacrado", "perfeito"],
    context: ["todo mundo pergunta qual é", "dura o dia todo", "ótimo para presentear", "entrega super rápida", "nota 10"]
  }
};

const HUMAN_PHRASES = [
  "chegou certinho", "gostei bastante", "muito bom valeu", "entrega rapida", "material top", "veio bem embalado", "recomendo dms",
  "Top demais", "Curti o estilo", "Valeu a compra", "Bem bonito pessoalmente", "Ficou perfeito", "Chegou antes do prazo",
  "Qualidade nota 10", "Gostei muito", "Tudo ok aqui", "Recomendo a loja", "Primeira compra de muitas", "Muito satisfeito"
];

export default function AdminReviewManagement() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkConfig, setBulkModalConfig] = useState({
    productCount: '50',
    reviewsPerProduct: 'auto',
  });
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [deleteType, setDeleteType] = useState<'all' | 'auto'>('auto');

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

  const generateSmartReview = (product: Product, usedNames: Set<string>, usedComments: Set<string>): Review => {
    const isFemaleProduct = product.gender === 'feminino';
    const isMaleProduct = product.gender === 'masculino';
    
    let gender: 'female' | 'male' = 'female';
    if (isFemaleProduct) {
      gender = Math.random() > 0.1 ? 'female' : 'male';
    } else if (isMaleProduct) {
      gender = Math.random() > 0.1 ? 'male' : 'female';
    } else {
      gender = Math.random() > 0.5 ? 'female' : 'male';
    }

    let name = "";
    let nameAttempts = 0;
    do {
      const baseNames = gender === 'female' ? FEMALE_NAMES : MALE_NAMES;
      const firstName = baseNames[Math.floor(Math.random() * baseNames.length)];
      const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
      name = `${firstName} ${lastName}`;
      nameAttempts++;
    } while (usedNames.has(name) && nameAttempts < 100);
    usedNames.add(name);

    const starRoll = Math.random() * 100;
    let rating = 5;
    if (starRoll < 2) rating = 2;
    else if (starRoll < 10) rating = 3;
    else if (starRoll < 30) rating = 4;
    else rating = 5;

    let comment = "";
    const lengthRoll = Math.random();
    const cat = (product.category as keyof typeof COMMENT_PARTS) || 'calcados';
    const parts = COMMENT_PARTS[cat] || COMMENT_PARTS.calcados;

    let attempts = 0;
    do {
      if (lengthRoll < 0.3) {
        // CURTO (30%)
        comment = HUMAN_PHRASES[Math.floor(Math.random() * HUMAN_PHRASES.length)];
      } else if (lengthRoll < 0.8) {
        // MÉDIO (50%)
        const f = parts.features[Math.floor(Math.random() * parts.features.length)];
        const s = parts.satisfaction[Math.floor(Math.random() * parts.satisfaction.length)];
        comment = Math.random() > 0.5 ? `${f}, ${s}.` : `${s}, ${f}.`;
      } else {
        // LONGO (20%)
        const f = parts.features[Math.floor(Math.random() * parts.features.length)];
        const s = parts.satisfaction[Math.floor(Math.random() * parts.satisfaction.length)];
        const c = parts.context[Math.floor(Math.random() * parts.context.length)];
        comment = `${f}. ${s}, ${c}.`;
      }

      // Contexto especial para homens comprando produtos femininos
      if (gender === 'male' && isFemaleProduct) {
        const giftPhrases = ["Minha esposa gostou muito", "Peguei de presente pra patroa", "Minha namorada amou", "Comprei pra presentear e ela adorou"];
        const gift = giftPhrases[Math.floor(Math.random() * giftPhrases.length)];
        comment = `${gift}. ${comment}`;
      }

      // Humanização ocasional (minúsculo ou sem ponto)
      if (Math.random() > 0.8) comment = comment.toLowerCase().replace(/[.!]/g, '');

      attempts++;
    } while ((usedComments.has(comment) || product.reviews?.some(r => r.comment === comment)) && attempts < 20);
    
    usedComments.add(comment);

    return {
      id: "auto_" + Math.random().toString(36).substr(2, 9),
      userName: name,
      rating,
      comment: comment,
      date: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000).toISOString(),
      isAutoGenerated: true
    };
  };

  const handleBulkGenerate = async () => {
    if (!firestore || activeProducts.length === 0) return;
    
    setIsGeneratingBulk(true);
    setBulkProgress(0);

    const countToGenerate = bulkConfig.productCount === 'all' 
      ? activeProducts.length 
      : Math.min(parseInt(bulkConfig.productCount), activeProducts.length);
    
    const shuffledProducts = [...activeProducts].sort(() => 0.5 - Math.random());
    const selectedBatch = shuffledProducts.slice(0, countToGenerate);

    const usedNames = new Set<string>();
    const usedComments = new Set<string>();
    let completed = 0;

    try {
      const chunkSize = 10;
      for (let i = 0; i < selectedBatch.length; i += chunkSize) {
        const chunk = selectedBatch.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (product) => {
          let reviewsPerProd = 1;
          if (bulkConfig.reviewsPerProduct === 'auto') {
            const roll = Math.random();
            if (roll < 0.4) reviewsPerProd = 2;
            else if (roll < 0.7) reviewsPerProd = 3;
            else if (roll < 0.9) reviewsPerProd = 4;
            else reviewsPerProd = 5;
          } else {
            reviewsPerProd = parseInt(bulkConfig.reviewsPerProduct);
          }

          const newReviews: Review[] = [];
          for (let j = 0; j < reviewsPerProd; j++) {
            newReviews.push(generateSmartReview(product, usedNames, usedComments));
          }

          const productRef = doc(firestore, 'products', product.firestoreId);
          await updateDoc(productRef, {
            reviews: arrayUnion(...newReviews)
          });
          
          completed++;
          setBulkProgress(Math.round((completed / selectedBatch.length) * 100));
        }));
      }

      toast({ title: 'Sucesso!', description: `Avaliações geradas sem repetição.` });
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error("Bulk generation error:", error);
      toast({ variant: 'destructive', title: 'Erro na geração' });
    } finally {
      setIsGeneratingBulk(false);
      setBulkProgress(0);
    }
  };

  const handleBulkDelete = async () => {
    if (!firestore || products.length === 0) return;
    setIsDeletingBulk(true);
    
    let totalCleaned = 0;
    try {
      const chunkSize = 20;
      const productsWithReviews = products.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0);

      for (let i = 0; i < productsWithReviews.length; i += chunkSize) {
        const chunk = productsWithReviews.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (product) => {
          let updatedReviews = [];
          if (deleteType === 'auto') {
            updatedReviews = product.reviews?.filter(r => !r.isAutoGenerated) || [];
          } else {
            updatedReviews = [];
          }

          if (updatedReviews.length !== product.reviews?.length) {
            const productRef = doc(firestore, 'products', product.firestoreId);
            await updateDoc(productRef, { reviews: updatedReviews });
            totalCleaned++;
          }
        }));
      }

      toast({ title: 'Limpeza concluída!', description: `${totalCleaned} produtos limpos.` });
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao apagar' });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleGenerateComment = () => {
    if (!selectedProductId) {
      toast({ variant: 'destructive', title: 'Selecione um produto primeiro' });
      return;
    }
    const tempUsedN = new Set<string>();
    const tempUsedC = new Set<string>();
    const review = generateSmartReview(selectedProduct!, tempUsedN, tempUsedC);
    setFormData(prev => ({ ...prev, comment: review.comment }));
  };

  const handleAddReview = async () => {
    if (!firestore || !selectedProductId) return;
    setIsAddingReview(true);

    try {
      const newReview: Review = {
        id: "manual_" + Date.now().toString(),
        userName: formData.userName,
        rating: parseInt(formData.rating),
        comment: formData.comment,
        date: new Date().toISOString(),
        isAutoGenerated: false
      };

      const productRef = doc(firestore, 'products', selectedProductId);
      await updateDoc(productRef, {
        reviews: arrayUnion(newReview)
      });

      toast({ title: 'Sucesso!', description: 'Avaliação adicionada.' });
      setFormData({ userName: '', rating: '5', comment: '' });
      setSelectedProductId('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar' });
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
              <CardDescription>Crie prova social realista e positiva para sua loja.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10">
                    <Eraser className="h-4 w-4" />
                    Limpar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Limpeza de Avaliações</DialogTitle>
                    <DialogDescription>Remova depoimentos de forma segura.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>O que deseja apagar?</Label>
                      <Select value={deleteType} onValueChange={(v: any) => setDeleteType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Apenas as geradas automaticamente</SelectItem>
                          <SelectItem value="all">TODAS as avaliações (Cuidado!)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                    <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                      {isDeletingBulk ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Confirmar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    Gerar em Massa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Geração Inteligente</DialogTitle>
                    <DialogDescription>Crie centenas de avaliações exclusivas e positivas em segundos.</DialogDescription>
                  </DialogHeader>
                  
                  {isGeneratingBulk ? (
                    <div className="py-8 space-y-4 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="font-medium">Gerando... {bulkProgress}%</p>
                      <Progress value={bulkProgress} className="h-2" />
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      <div className="space-y-3">
                        <Label>Para quantos produtos ativos?</Label>
                        <Select value={bulkConfig.productCount} onValueChange={(val) => setBulkModalConfig(prev => ({...prev, productCount: val}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50 produtos</SelectItem>
                            <SelectItem value="100">100 produtos</SelectItem>
                            <SelectItem value="200">200 produtos</SelectItem>
                            <SelectItem value="400">400 produtos</SelectItem>
                            <SelectItem value="all">Todos ativos ({activeProducts.length})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label>Quantidade de avaliações</Label>
                        <Select value={bulkConfig.reviewsPerProduct} onValueChange={(val) => setBulkModalConfig(prev => ({...prev, reviewsPerProduct: val}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automático (2 a 5 por produto)</SelectItem>
                            <SelectItem value="1">1 por produto</SelectItem>
                            <SelectItem value="3">3 por produto</SelectItem>
                            <SelectItem value="5">5 por produto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    {!isGeneratingBulk && (
                      <>
                        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                        <Button onClick={handleBulkGenerate}>Iniciar Geração</Button>
                      </>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog onOpenChange={(open) => { if(!open) setIsProductSelectorOpen(false); }}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Nova Avaliação</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Avaliação Manual</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4 text-left">
                    <div className="space-y-2 relative">
                      <Label>Produto</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                        onClick={() => setIsProductSelectorOpen(!isProductSelectorOpen)}
                      >
                        <span className="truncate pr-4">
                          {selectedProductId ? products.find((p) => p.firestoreId === selectedProductId)?.name : "Escolha..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                      {isProductSelectorOpen && (
                        <div className="absolute top-full left-0 z-50 w-full mt-1 border bg-popover text-popover-foreground shadow-md rounded-md overflow-hidden">
                          <div className="p-2 border-b">
                            <Input placeholder="Buscar..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="h-8" />
                          </div>
                          <ScrollArea className="h-[200px]">
                            <div className="p-1">
                              {activeProductsForSelection.map((p) => (
                                <button
                                  key={p.firestoreId}
                                  className={cn("flex w-full items-center px-2 py-2 text-sm rounded-sm hover:bg-accent text-left", selectedProductId === p.firestoreId && "bg-accent")}
                                  onClick={() => { setSelectedProductId(p.firestoreId); setIsProductSelectorOpen(false); }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedProductId === p.firestoreId ? "opacity-100" : "opacity-0")} />
                                  <span className="truncate">{p.name}</span>
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Input value={formData.userName} onChange={e => setFormData(prev => ({...prev, userName: e.target.value}))} placeholder="Nome do cliente" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Comentário</Label>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={handleGenerateComment} disabled={!selectedProductId}>
                          <Sparkles className="h-3 w-3 mr-1" /> Gerar Sugestão
                        </Button>
                      </div>
                      <Textarea value={formData.comment} onChange={e => setFormData(prev => ({...prev, comment: e.target.value}))} placeholder="Escreva o comentário..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleAddReview} disabled={isAddingReview || !selectedProductId}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filtrar por produto..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Média</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4}><div className="h-8 w-full bg-secondary animate-pulse rounded" /></TableCell></TableRow>
              ) : filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).map((product) => {
                const productReviews = Array.isArray(product.reviews) ? product.reviews : [];
                const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length || 0;
                return (
                  <React.Fragment key={product.firestoreId}>
                    <TableRow>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{productReviews.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span>{avg.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProductId(selectedProductId === product.firestoreId ? '' : product.firestoreId)}>
                          {selectedProductId === product.firestoreId ? 'Fechar' : 'Ver Detalhes'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {selectedProductId === product.firestoreId && (
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={4} className="p-4">
                          <div className="space-y-4">
                            {productReviews.map((review) => (
                              <div key={review.id} className="flex items-start gap-4 p-3 bg-background rounded-lg border shadow-sm">
                                <Avatar className="h-8 w-8 border"><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm">{review.userName}</p>
                                      {review.isAutoGenerated && <span className="text-[9px] bg-secondary px-1 rounded opacity-60">AUTO</span>}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteReview(product.firestoreId, review)}><Trash2 className="h-4 w-4" /></Button>
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
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}