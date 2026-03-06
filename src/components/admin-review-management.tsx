
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
import { Star, Trash2, PlusCircle, Search, MessageSquare, Loader2, User, Sparkles, Check, ChevronsUpDown, Zap, Eraser, AlertTriangle } from 'lucide-react';
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

// LISTAS AMPLIADAS PARA EVITAR REPETIÇÃO
const FEMALE_NAMES = ["Mariana", "Fernanda", "Camila", "Juliana", "Patricia", "Bruna", "Aline", "Beatriz", "Letícia", "Isabela", "Carolina", "Vanessa", "Larissa", "Renata", "Tatiane", "Amanda", "Beatriz", "Gabriela", "Rafaela", "Bianca"];
const MALE_NAMES = ["Lucas", "Rafael", "Bruno", "Carlos", "Gabriel", "Matheus", "Felipe", "Thiago", "Gustavo", "Daniel", "André", "Marcelo", "Vinícius", "Fabrício", "Leandro", "Rodrigo", "Diego", "Eduardo", "Leonardo", "Hugo"];
const SURNAMES = ["Souza", "Santos", "Rodrigues", "Alves", "Lima", "Carvalho", "Martins", "Oliveira", "Costa", "Almeida", "Ferreira", "Ribeiro", "Barbosa", "Rocha", "Mendes", "Vieira", "Teixeira", "Gomes", "Moreira", "Nascimento"];

const COMMENT_TEMPLATES = {
  calcados: {
    short: ["Muito confortável!", "Gostei muito do tênis.", "Ficou perfeito no pé.", "Bem estiloso.", "Qualidade top."],
    medium: ["O tênis é sensacional, muito mais bonito pessoalmente.", "Super confortável para o dia a dia, recomendo!", "Caiu muito bem no pé, tamanho certinho.", "Material muito bom, parece ser bem resistente.", "Excelente acabamento, superou minhas expectativas."],
    long: ["Comprei para treinar e me surpreendi, o amortecimento é ótimo e o design é muito moderno.", "Sempre tive receio de comprar calçado online mas esse aqui veio perfeito, segui a tabela de medidas e não teve erro.", "Melhor custo benefício que encontrei ultimamente, a qualidade do material é de primeira e chegou muito rápido."]
  },
  roupas: {
    short: ["Veste muito bem.", "Tecido excelente.", "Amei a peça!", "Qualidade incrível.", "Muito bonita."],
    medium: ["O tecido é muito premium e o caimento ficou perfeito.", "Camiseta top, não desbotou após a primeira lavagem.", "O material é bem fresco e confortável para o dia a dia.", "Ficou ótimo no corpo, exatamente o que eu esperava.", "Acabamento impecável em cada detalhe da costura."],
    long: ["A modelagem é bem moderna e o tecido é muito macio, dá pra ver que é de boa qualidade logo de cara. Recomendo muito!", "Comprei sem muita expectativa e me surpreendi demais, o caimento é impecável e a cor é igualzinha a do site.", "Peça essencial no guarda-roupa, combina com tudo e o conforto é o ponto alto. Valeu cada centavo do investimento."]
  },
  acessorios: {
    short: ["Muito bem feito.", "Gostei bastante.", "Ótimo material.", "Estiloso demais.", "Prático e bonito."],
    medium: ["Produto muito bem acabado, os detalhes fazem a diferença.", "Dá um up total no visual, gostei demais da compra.", "Excelente material, parece que vai durar muito tempo.", "Chegou antes do prazo e em perfeitas condições.", "Design moderno e material bem resistente, recomendo."],
    long: ["Procurei muito por um acessório assim e esse aqui atendeu todas as necessidades, qualidade premium e design autêntico.", "Fiquei surpreso com o cuidado na embalagem e a qualidade do item, nota-se que é um produto diferenciado.", "Uso quase todo dia e continua como novo, o acabamento é de alto padrão e o estilo é indiscutível."]
  },
  perfumes: {
    short: ["Cheiro maravilhoso!", "Fixa muito bem.", "Fragrância top.", "Amei o perfume.", "Muito cheiroso."],
    medium: ["Fragrância marcante e muito agradável, todo mundo pergunta.", "Fixação excelente na minha pele, durou o dia todo.", "Veio lacrado e bem protegido na caixa, 100% original.", "Projeção na medida certa, muito elegante e sofisticado.", "Amei o perfume, virou meu favorito para ocasiões especiais."],
    long: ["Um dos melhores perfumes que já usei, a evolução da fragrância na pele é incrível e a fixação é surpreendente.", "Estava procurando por esse cheiro há tempos e finalmente encontrei, entrega rápida e produto impecável.", "Fragrância sofisticada que marca presença sem ser enjoativa, perfeita para quem gosta de exclusividade."]
  },
  feminino_specific: {
    short: ["Linda e confortável!", "Ficou perfeita.", "Amei os detalhes.", "Maravilhosa!", "Muito delicada."],
    medium: ["A peça é linda e o material é de muita qualidade, amei.", "Comprei para um evento e recebi muitos elogios, super recomendo.", "Ficou perfeita no corpo, a tabela de medidas ajudou muito.", "Muito mais bonita pessoalmente, os detalhes são encantadores.", "Estava ansiosa pela chegada e não me decepcionei, maravilhosa."]
  },
  male_gifting: [
    "Comprei para minha esposa e ela adorou, ficou perfeito.",
    "Peguei de presente para minha namorada e ela amou a qualidade.",
    "Minha esposa gostou muito, o tamanho deu certinho.",
    "Presente aprovado! Ela achou muito confortável e bonito.",
    "Comprei para presentear e a pessoa ficou encantada com o produto."
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

  // Bulk Delete States
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

  // FUNÇÃO DE GERAÇÃO INTELIGENTE
  const generateSmartReview = (product: Product, usedNames: Set<string>, usedComments: Set<string>): Review => {
    const isFemaleProduct = product.gender === 'feminino';
    const isMaleProduct = product.gender === 'masculino';
    
    let gender: 'female' | 'male' = 'female';
    if (isFemaleProduct) {
      gender = Math.random() > 0.1 ? 'female' : 'male'; // 90% female
    } else if (isMaleProduct) {
      gender = 'male';
    } else {
      gender = Math.random() > 0.5 ? 'female' : 'male';
    }

    // Gerar Nome Único
    let name = "";
    let attempts = 0;
    do {
      const baseNames = gender === 'female' ? FEMALE_NAMES : MALE_NAMES;
      const firstName = baseNames[Math.floor(Math.random() * baseNames.length)];
      const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
      name = `${firstName} ${lastName}`;
      attempts++;
    } while (usedNames.has(name) && attempts < 50);
    usedNames.add(name);

    // Determinar Nota
    const rating = Math.random() > 0.3 ? 5 : 4;

    // Gerar Comentário Baseado em Contexto
    let comment = "";
    const category = product.category as keyof typeof COMMENT_TEMPLATES;
    const templates = COMMENT_TEMPLATES[category] || COMMENT_TEMPLATES.calcados;
    
    const sizeType = Math.random() > 0.6 ? 'long' : (Math.random() > 0.3 ? 'medium' : 'short');
    const options = (templates as any)[sizeType] || templates.medium;

    if (gender === 'male' && isFemaleProduct) {
      // Caso especial: Homem comentando em produto feminino
      comment = COMMENT_TEMPLATES.male_gifting[Math.floor(Math.random() * COMMENT_TEMPLATES.male_gifting.length)];
    } else if (gender === 'female' && isFemaleProduct && Math.random() > 0.5) {
      // Caso especial: Comentários específicos femininos
      const femOptions = COMMENT_TEMPLATES.feminino_specific.medium;
      comment = femOptions[Math.floor(Math.random() * femOptions.length)];
    } else {
      // Comentário padrão por categoria
      comment = options[Math.floor(Math.random() * options.length)];
    }

    // Garantir que o comentário não seja duplicado no mesmo lote
    if (usedComments.has(comment)) {
      comment += " Recomendo!"; // Pequena variação para unicidade
    }
    usedComments.add(comment);

    return {
      id: "auto_" + Math.random().toString(36).substr(2, 9),
      userName: name,
      rating,
      comment,
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
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
    
    const reviewsPerProd = parseInt(bulkConfig.reviewsPerProduct);
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

      toast({ title: 'Sucesso!', description: `Avaliações geradas com sucesso.` });
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error("Bulk generation error:", error);
      toast({ variant: 'destructive', title: 'Erro na geração', description: 'Falha ao processar.' });
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

      toast({ title: 'Limpeza concluída!', description: `${totalCleaned} produtos tiveram avaliações removidas.` });
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
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
    const tempUsed = new Set<string>();
    const tempUsedC = new Set<string>();
    const review = generateSmartReview(selectedProduct!, tempUsed, tempUsedC);
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
              <CardDescription>Gerencie a prova social dos seus produtos ativos.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* MODAL APAGAR EM MASSA */}
              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10">
                    <Eraser className="h-4 w-4" />
                    Apagar Avaliações
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apagar Avaliações em Massa</DialogTitle>
                    <DialogDescription>
                      Cuidado! Esta ação removerá avaliações de todos os produtos da loja.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      Esta ação não pode ser desfeita. Recomenda-se apagar apenas as geradas automaticamente.
                    </div>
                    <div className="space-y-3">
                      <Label>O que você deseja apagar?</Label>
                      <Select value={deleteType} onValueChange={(v: any) => setDeleteType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Apenas as geradas pelo sistema</SelectItem>
                          <SelectItem value="all">TODAS as avaliações da loja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancelar</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                      {isDeletingBulk ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Confirmar Exclusão
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* MODAL GERAÇÃO EM MASSA */}
              <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    Gerar em Massa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Geração Inteligente em Massa</DialogTitle>
                    <DialogDescription>
                      Crie depoimentos realistas baseados no gênero e categoria dos produtos.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {isGeneratingBulk ? (
                    <div className="py-8 space-y-4 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="font-medium">Gerando prova social... {bulkProgress}%</p>
                      <Progress value={bulkProgress} className="h-2" />
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
                            <SelectItem value="1">1 por produto</SelectItem>
                            <SelectItem value="2">2 por produto</SelectItem>
                            <SelectItem value="3">3 por produto</SelectItem>
                            <SelectItem value="5">5 por produto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-lg bg-secondary/50 p-4 border text-xs space-y-2">
                        <p className="font-semibold flex items-center gap-2"><Sparkles className="h-3 w-3" /> Regras de Inteligência:</p>
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                          <li>Filtra apenas produtos <strong>ativos</strong>.</li>
                          <li>Garante nomes e comentários <strong>únicos</strong> no lote.</li>
                          <li>Ajusta gênero dos nomes conforme o produto (90/10).</li>
                          <li>Textos específicos por categoria (Tênis, Perfume, etc).</li>
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
                        <Button onClick={handleBulkGenerate}>
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
                  <div className="space-y-4 py-4 text-left">
                    <div className="space-y-2 relative">
                      <Label>Selecione o Produto (Ativos)</Label>
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
                            <div className="fixed inset-0 z-[40]" onClick={() => setIsProductSelectorOpen(false)} />
                            <div className="absolute top-full left-0 z-[50] w-full mt-1 border bg-popover text-popover-foreground shadow-md rounded-md overflow-hidden">
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
                                  {activeProductsForSelection.map((p) => (
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
                                      <Check className={cn("mr-2 h-4 w-4 shrink-0", selectedProductId === p.firestoreId ? "opacity-100" : "opacity-0")} />
                                      <span className="truncate">{p.name}</span>
                                    </button>
                                  ))}
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
                      <Label>Estrelas</Label>
                      <Select value={formData.rating} onValueChange={val => setFormData(prev => ({...prev, rating: val}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Estrelas</SelectItem>
                          <SelectItem value="4">4 Estrelas</SelectItem>
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
                          className="h-7 text-xs gap-1 text-primary"
                          onClick={handleGenerateComment}
                          disabled={!selectedProductId}
                        >
                          <Sparkles className="h-3 w-3" /> Sugerir texto
                        </Button>
                      </div>
                      <Textarea 
                        placeholder="Depoimento do cliente..." 
                        value={formData.comment}
                        onChange={e => setFormData(prev => ({...prev, comment: e.target.value}))}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleAddReview} disabled={isAddingReview || !selectedProductId || !formData.userName || !formData.comment}>
                      {isAddingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar
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
              placeholder="Buscar por produto..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Avaliações</TableHead>
                <TableHead>Média</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4}><div className="h-8 w-full bg-secondary animate-pulse rounded" /></TableCell></TableRow>
              ) : filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).length > 0 ? (
                filteredProductsForTable.filter(p => Array.isArray(p.reviews) && p.reviews.length > 0).map((product) => {
                  const productReviews = Array.isArray(product.reviews) ? product.reviews : [];
                  const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) || 0;
                  const score = productReviews.length ? (avg / productReviews.length).toFixed(1) : 0;
                  return (
                    <React.Fragment key={product.firestoreId}>
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
                          <Button variant="ghost" size="sm" onClick={() => setSelectedProductId(selectedProductId === product.firestoreId ? '' : product.firestoreId)}>
                            {selectedProductId === product.firestoreId ? 'Fechar' : 'Ver'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {selectedProductId === product.firestoreId && (
                        <TableRow className="bg-secondary/20">
                          <TableCell colSpan={4} className="p-4">
                            <div className="space-y-4">
                              {productReviews.map((review) => (
                                <div key={review.id} className="flex items-start gap-4 p-3 bg-background rounded-lg border shadow-sm">
                                  <Avatar className="h-8 w-8 border">
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 text-left">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{review.userName}</p>
                                        {review.isAutoGenerated && <Badge variant="outline" className="text-[10px] h-4 px-1 opacity-50">Gerado</Badge>}
                                      </div>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteReview(product.firestoreId, review)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
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
