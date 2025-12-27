
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
import { db } from '@/firebase/config';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/types';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';
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

type ProductWithId = Product & { firestoreId: string };

const ProductForm = ({
  product,
  onSave,
  onClose,
}: {
  product?: ProductWithId | null;
  onSave: (p: Omit<ProductWithId, 'firestoreId'>) => void;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    longDescription: product?.longDescription || '',
    gender: product?.gender || 'unissex',
    category: product?.category || 'roupas',
    images: product?.images?.length ? product.images : [''],
    status: product?.status || 'ativo',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof typeof formData, value: string) => {
     setFormData((prev) => ({ ...prev, [id]: value }));
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageInput = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageInput = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const images = formData.images.filter(Boolean); // Filter out empty strings

    if (images.length === 0) {
        // Maybe show a toast message here
        alert("Por favor, adicione pelo menos uma imagem.");
        return;
    }

    const productData: Omit<ProductWithId, 'firestoreId'> = {
      id: product?.id || new Date().getTime().toString(),
      name: formData.name,
      description: formData.longDescription.substring(0, 100), // Auto-generate short description
      longDescription: formData.longDescription,
      price: Number(formData.price),
      gender: formData.gender as Product['gender'],
      category: formData.category as Product['category'],
      images: images,
      status: formData.status as Product['status'],
      rating: product?.rating || 0,
      reviews: product?.reviews || 0,
    };
    onSave(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto</Label>
        <Input id="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Preço</Label>
        <Input id="price" type="number" value={formData.price} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="longDescription">Descrição</Label>
        <Textarea id="longDescription" value={formData.longDescription} onChange={handleChange} required />
      </div>
      
      <div className="space-y-3">
        <Label>Links das Imagens</Label>
        {formData.images.map((image, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`URL da Imagem ${index + 1}`}
              value={image}
              onChange={(e) => handleImageChange(index, e.target.value)}
              required={index === 0}
            />
            {formData.images.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeImageInput(index)} className="text-destructive">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addImageInput}>
          Adicionar mais uma imagem
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
                    <SelectItem value="tênis">Tênis</SelectItem>
                    <SelectItem value="roupas">Roupas</SelectItem>
                    <SelectItem value="acessorios">Acessórios</SelectItem>
                    <SelectItem value="perfumes">Perfumes</SelectItem>
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
      </div>
      <DialogFooter>
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

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(
      collection(db as Firestore, 'products'),
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...(doc.data() as Product),
        }));
        setProducts(productsData);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSave = async (productData: Omit<ProductWithId, 'firestoreId'>) => {
    try {
      if (editingProduct) {
        const docRef = doc(db as Firestore, 'products', editingProduct.firestoreId);
        await updateDoc(docRef, productData);
        toast({ title: 'Sucesso!', description: 'Produto atualizado.' });
      } else {
        await addDoc(collection(db as Firestore, 'products'), productData);
        toast({ title: 'Sucesso!', description: 'Produto criado.' });
      }
      closeForm();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível salvar o produto.',
      });
    }
  };

  const handleDelete = async (firestoreId: string) => {
    try {
      await deleteDoc(doc(db as Firestore, 'products', firestoreId));
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
  }

  const closeForm = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };
  
  const openFormToCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

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
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Editar' : 'Adicionar'} Produto</DialogTitle>
                </DialogHeader>
                <ProductForm product={editingProduct} onSave={handleSave} onClose={closeForm} />
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.firestoreId}>
                <TableCell>
                    {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                    ) : (
                        <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
                            ?
                        </div>
                    )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>
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

    

    
