
'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Coupon } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type CouponWithId = Coupon & { firestoreId: string };

const CouponForm = ({
  coupon,
  onSave,
  onClose,
}: {
  coupon?: CouponWithId | null;
  onSave: (c: Omit<CouponWithId, 'firestoreId'>) => Promise<void>;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || 0,
    expiryDate: coupon?.expiryDate ? coupon.expiryDate.split('T')[0] : '',
    isActive: coupon?.isActive ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [id]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const couponData = {
      id: coupon?.id || new Date().getTime().toString(),
      code: formData.code.toUpperCase(),
      discountType: formData.discountType as 'percentage' | 'fixed',
      discountValue: formData.discountValue,
      isActive: formData.isActive,
      usageCount: coupon?.usageCount || 0,
      ...(formData.expiryDate && { expiryDate: new Date(formData.expiryDate).toISOString() }),
    };
    await onSave(couponData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código do Cupom</Label>
        <Input id="code" value={formData.code} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discountType">Tipo de Desconto</Label>
          <Select value={formData.discountType} onValueChange={(value) => handleSelectChange('discountType', value)}>
            <SelectTrigger id="discountType">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentagem (%)</SelectItem>
              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountValue">Valor do Desconto</Label>
          <Input id="discountValue" type="number" value={formData.discountValue} onChange={handleChange} required min="0" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Data de Expiração (Opcional)</Label>
        <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))} />
        <Label htmlFor="isActive">Ativo</Label>
      </div>
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

export default function AdminCouponManagement() {
  const [coupons, setCoupons] = useState<CouponWithId[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponWithId | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const unsubscribe = onSnapshot(
      collection(firestore, 'coupons'),
      (snapshot) => {
        const couponsData = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...(doc.data() as Coupon),
        }));
        setCoupons(couponsData);
      },
      (error) => {
        console.error("Error fetching coupons:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar cupons',
          description: 'Não foi possível carregar os cupons do banco de dados.',
        });
      }
    );
    return () => unsubscribe();
  }, [firestore, toast]);

  const handleSave = async (couponData: Omit<CouponWithId, 'firestoreId'>) => {
    if (!firestore) return;
    try {
      if (editingCoupon) {
        const docRef = doc(firestore, 'coupons', editingCoupon.firestoreId);
        await updateDoc(docRef, couponData);
        toast({ title: 'Sucesso!', description: 'Cupom atualizado.' });
      } else {
        await addDoc(collection(firestore, 'coupons'), couponData);
        toast({ title: 'Sucesso!', description: 'Cupom criado.' });
      }
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível salvar o cupom.',
      });
      throw error;
    }
  };

  const handleDelete = async (firestoreId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'coupons', firestoreId));
      toast({
        title: 'Cupom Removido!',
        description: 'O cupom foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover cupom:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível remover o cupom.',
      });
    }
  };

  const openFormToEdit = (coupon: CouponWithId) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingCoupon(null);
    setIsFormOpen(false);
  };

  const openFormToCreate = () => {
    setEditingCoupon(null);
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Cupons</CardTitle>
          <CardDescription>Adicione, edite ou remova cupons de desconto.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          if (!isOpen) closeForm();
          else setIsFormOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openFormToCreate}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Editar' : 'Adicionar'} Cupom</DialogTitle>
            </DialogHeader>
            <CouponForm 
              coupon={editingCoupon} 
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
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.firestoreId}>
                <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
                <TableCell>{coupon.discountType === 'percentage' ? 'Porcentagem' : 'Fixo'}</TableCell>
                <TableCell>
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}%`
                    : `R$ ${coupon.discountValue.toFixed(2).replace('.', ',')}`}
                </TableCell>
                <TableCell>{coupon.usageCount || 0}</TableCell>
                <TableCell>
                  {coupon.expiryDate ? format(new Date(coupon.expiryDate), "dd/MM/yyyy", { locale: ptBR }) : 'Não expira'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {coupon.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openFormToEdit(coupon)}>
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
                          Essa ação não pode ser desfeita. Isso irá remover permanentemente o cupom.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(coupon.firestoreId)} className="bg-destructive hover:bg-destructive/90">
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
