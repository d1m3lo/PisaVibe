
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
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
import { Star, Trash2, PlusCircle, Search, MessageSquare, Loader2, User, Sparkles, Check, ChevronsUpDown, Zap, Eraser, X, ShieldCheck } from 'lucide-react';
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
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

type ProductWithId = Product & { firestoreId: string };

const FEMALE_NAMES = ["Mariana", "Fernanda", "Camila", "Juliana", "Patricia", "Bruna", "Aline", "Beatriz", "Letícia", "Isabela", "Carolina", "Vanessa", "Larissa", "Renata", "Tatiane", "Amanda", "Beatriz", "Gabriela", "Rafaela", "Bianca", "Jessica", "Debora", "Priscila", "Luciana", "Monica", "Silvana", "Sandra", "Andreia", "Paula", "Carla", "Nicole", "Tainá", "Vitória", "Yasmin"];
const MALE_NAMES = ["Lucas", "Rafael", "Bruno", "Carlos", "Gabriel", "Matheus", "Felipe", "Thiago", "Gustavo", "Daniel", "André", "Marcelo", "Vinícius", "Fabrício", "Leandro", "Rodrigo", "Diego", "Eduardo", "Leonardo", "Hugo", "Ricardo", "Fernando", "Alexandre", "Roberto", "Marcos", "Antonio", "João", "Paulo", "Sergio", "Luiz", "Fabio", "Igor", "Murilo", "Enzo"];
const SURNAMES = ["Souza", "Santos", "Rodrigues", "Alves", "Lima", "Carvalho", "Martins", "Oliveira", "Costa", "Almeida", "Ferreira", "Ribeiro", "Barbosa", "Rocha", "Mendes", "Vieira", "Teixeira", "Gomes", "Moreira", "Nascimento", "Pereira", "Silva", "Gonçalves", "Araújo", "Cardoso", "Freitas", "Machado", "Dias", "Castro", "Nunes", "Monteiro", "Lopes", "Pinto", "Cardoso"];

const PHRASE_POOL = {
  calcados: [
    "Muito confortável no pé", "Dá pra usar o dia todo", "Macio demais", "Amortecimento ótimo", "Extremamente confortável",
    "Mais bonito pessoalmente", "Estiloso demais", "Combina com tudo", "Design moderno", "A cor é idêntica",
    "Tamanho ficou perfeito", "Numeração exata", "Ficou certinho", "Caiu muito bem"
  ],
  roupas: [
    "O tecido é muito bom", "Material de qualidade", "Veste super bem", "Tecido macio", "Não desbota",
    "Caimento perfeito", "Ficou ótimo em mim", "Tamanho veio certinho", "Modelagem muito boa",
    "Peça muito bonita", "Visual moderno", "Estou usando direto", "Dá um estilo legal"
  ],
  acessorios: [
    "Material bem resistente", "Acabamento impecável", "Superou as expectativas", "Muito bem feito",
    "Lindo demais", "Dá um toque especial", "Exatamente como queria", "Muito estiloso"
  ],
  perfumes: [
    "Cheiro maravilhoso", "Fragrância agradável", "Aroma marcante", "Cheiro incrível",
    "Fixação excelente", "Dura o dia todo", "Projeção muito boa", "Fixa muito bem"
  ],
  geral: [
    "Entrega super rápida", "Chegou antes do prazo", "Bem embalado", "Veio tudo certinho", "Entrega nota 10",
    "Gostei bastante", "Valeu muito a pena", "Muito satisfeito", "Recomendo a loja", "Top demais", "Curti muito"
  ]
};

const INFORMAL_PHRASES = ["Top", "Curti", "Valeu", "Mto bom", "Gostei", "Recomendo dms", "Show"];

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

  const buildUniqueComment = (category: string, gender: string, isFemaleProduct: boolean, existingReviews: Review[], usedInBatch: Set<string>) => {
    const cat = (category as keyof typeof PHRASE_POOL) || 'calcados';
    const pool = PHRASE_POOL[cat] || PHRASE_POOL.calcados;
    
    const generateFragment = () => {
        const roll = Math.random();
        let parts = [];
        if (roll < 0.3) {
            parts.push(pool[Math.floor(Math.random() * pool.length)]);
        } else if (roll < 0.7) {
            parts.push(pool[Math.floor(Math.random() * pool.length)]);
            parts.push(PHRASE_POOL.geral[Math.floor(Math.random() * PHRASE_POOL.geral.length)]);
        } else {
            parts.push(INFORMAL_PHRASES[Math.floor(Math.random() * INFORMAL_PHRASES.length)]);
            parts.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        if (gender === 'male' && isFemaleProduct && Math.random() > 0.5) {
            const gift = ["Presente pra esposa", "Minha namorada adorou", "Comprei pra dar de presente"];
            parts.unshift(gift[Math.floor(Math.random() * gift.length)]);
        }

        return parts.filter(Boolean).join(". ");
    };

    let comment = "";
    let attempts = 0;
    do {
        comment = generateFragment();
        attempts++;
    } while ((usedInBatch.has(comment) || existingReviews.some(r => r.comment === comment)) && attempts < 20);

    return comment;
  };

  const generateSmartReview = (product: Product, usedNames: Set<string>, usedInBatch: Set<string>): Review => {
    const gender = Math.random() > 0.5 ? 'female' : 'male';
    const baseNames = gender === 'female' ? FEMALE_NAMES : MALE_NAMES;
    
    let name = "";
    do {
        name = `${baseNames[Math.floor(Math.random() * baseNames.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const starRoll = Math.random() * 100;
    let rating = 5;
    if (starRoll < 2) rating = 2;
    else if (starRoll < 10) rating = 3;
    else if (starRoll < 30) rating = 4;

    const existingReviews = Array.isArray(product.reviews) ? product.reviews : [];
    const comment = buildUniqueComment(product.category, gender, product.gender === 'feminino', existingReviews, usedInBatch);
    usedInBatch.add(comment);

    return {
      id: "auto_" + Math.random().toString(36).substr(2, 9),
      userName: name,
      rating,
      comment,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      isAutoGenerated: true,
      status: 'approved'
    };
  };

  const handleBulkGenerate = async () => {
    if (!firestore || activeProducts.length === 0) return;
    setIsGeneratingBulk(true);
    setBulkProgress(0);

    const countToGenerate = bulkConfig.productCount === 'all' 
      ? activeProducts.length 
      : Math.min(parseInt(bulkConfig.productCount), activeProducts.length);
    
    const selectedBatch = [...activeProducts].sort(() => 0.5 - Math.random()).slice(0, countToGenerate);
    const usedNames = new Set<string>();
    const usedInBatch = new Set<string>();
    let completed = 0;

    try {
      for (const product of selectedBatch) {
        let reviewsPerProd = bulkConfig.reviewsPerProduct === 'auto' 
            ? Math.floor(Math.random() * 4) + 2 
            : parseInt(bulkConfig.reviewsPerProduct);

        const newReviews: Review[] = [];
        for (let j = 0; j < reviewsPerProd; j++) {
          newReviews.push(generateSmartReview(product, usedNames, usedInBatch));
        }

        const productRef = doc(firestore, 'products', product.firestoreId);
        await updateDoc(productRef, { reviews: arrayUnion(...newReviews) });
        
        completed++;
        setBulkProgress(Math.round((completed / selectedBatch.length) * 100));
      }

      toast({ title: 'Sucesso!', description: `Avaliações geradas para ${selectedBatch.length} produtos.` });
      setIsBulkModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro na geração' });
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!firestore || products.length === 0) return;
    setIsDeletingBulk(true);
    try {
      for (const product of products) {
        const currentReviews = Array.isArray(product.reviews) ? product.reviews : [];
        let updatedReviews = deleteType === 'auto' 
            ? currentReviews.filter(r => !r.isAutoGenerated) 
            : [];

        if (updatedReviews.length !== currentReviews.length) {
          await updateDoc(doc(firestore, 'products', product.firestoreId), { reviews: updatedReviews });
        }
      }
      toast({ title: 'Limpeza concluída!' });
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao apagar' });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleApproveReview = async (firestoreId: string, reviewId: string) => {
    if (!firestore) return;
    try {
        const product = products.find(p => p.firestoreId === firestoreId);
        if (!product || !Array.isArray(product.reviews)) return;

        const updatedReviews = product.reviews.map(r => 
            r.id === reviewId ? { ...r, status: 'approved' } : r
        );

        await updateDoc(doc(firestore, 'products', firestoreId), {
            reviews: updatedReviews
        });
        toast({ title: "Avaliação aprovada!" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Erro ao aprovar" });
    }
  };

  const handleDeleteReview = async (firestoreId: string, reviewId: string) => {
    if (!firestore) return;
    try {
        const product = products.find(p => p.firestoreId === firestoreId);
        if (!product || !Array.isArray(product.reviews)) return;

        const updatedReviews = product.reviews.filter(r => r.id !== reviewId);

        await updateDoc(doc(firestore, 'products', firestoreId), {
            reviews: updatedReviews
        });
        toast({ title: "Avaliação removida." });
    } catch (error) {
        toast({ variant: 'destructive', title: "Erro ao remover." });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Gerenciamento de Avaliações</CardTitle>
              <CardDescription>Crie prova social realista e modere depoimentos de clientes.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive border-destructive">
                    <Eraser className="h-4 w-4" /> Limpar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Limpeza de Avaliações</DialogTitle>
                    <DialogDescription>Remova depoimentos em massa.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Label>O que deseja apagar?</Label>
                    <Select value={deleteType} onValueChange={(v: any) => setDeleteType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Apenas as geradas automaticamente</SelectItem>
                        <SelectItem value="all">TODAS as avaliações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                      {isDeletingBulk ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirmar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Gerar em Massa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Geração em Massa</DialogTitle>
                    <DialogDescription>Crie prova social instantânea.</DialogDescription>
                  </DialogHeader>
                  {isGeneratingBulk ? (
                    <div className="py-8 space-y-4 text-center">
                      <p className="font-medium">Gerando... {bulkProgress}%</p>
                      <Progress value={bulkProgress} className="h-2" />
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      <div className="space-y-3">
                        <Label>Produtos ativos</Label>
                        <Select value={bulkConfig.productCount} onValueChange={(val) => setBulkModalConfig(prev => ({...prev, productCount: val}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[50, 100, 200, 300, 400].map(n => <SelectItem key={n} value={n.toString()}>{n} produtos</SelectItem>)}
                            <SelectItem value="all">Todos ativos ({activeProducts.length})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label>Avaliações por produto</Label>
                        <Select value={bulkConfig.reviewsPerProduct} onValueChange={(val) => setBulkModalConfig(prev => ({...prev, reviewsPerProduct: val}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automático (2-5)</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    {!isGeneratingBulk && <Button onClick={handleBulkGenerate}>Iniciar Geração</Button>}
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
                <TableHead>Pendentes</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ) : filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).map((product) => {
                const reviews = Array.isArray(product.reviews) ? product.reviews : [];
                const pending = reviews.filter(r => r.status === 'pending').length;
                return (
                  <React.Fragment key={product.firestoreId}>
                    <TableRow>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{reviews.length}</TableCell>
                      <TableCell>
                        {pending > 0 ? <Badge variant="destructive">{pending}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProductId(selectedProductId === product.firestoreId ? '' : product.firestoreId)}>
                          {selectedProductId === product.firestoreId ? 'Fechar' : 'Gerenciar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {selectedProductId === product.firestoreId && (
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={4} className="p-4">
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <div key={review.id} className="flex items-start gap-4 p-3 bg-background rounded-lg border shadow-sm">
                                <Avatar className="h-8 w-8"><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm">{review.userName}</p>
                                      {review.status === 'pending' && <Badge variant="outline" className="bg-amber-50">Pendente</Badge>}
                                      {review.isAutoGenerated && <Badge variant="outline" className="opacity-50">AUTO</Badge>}
                                    </div>
                                    <div className="flex gap-1">
                                      {review.status === 'pending' && (
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleApproveReview(product.firestoreId, review.id)}>
                                              <ShieldCheck className="h-4 w-4" />
                                          </Button>
                                      )}
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteReview(product.firestoreId, review.id)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 my-1">
                                      {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                                      ))}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{review.comment}</p>
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
