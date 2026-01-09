
'use client';
import React, { useState, useEffect } from 'react';
import {
  collectionGroup,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  collection,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Order, OrderStatus, OrderItem, Product } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  Edit,
  PlusCircle,
  Save,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { Separator } from './ui/separator';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fixImageUrl } from '@/lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface OrderWithId extends Order {
  id: string;
  path: string; // Add path to easily reference the document
}

const orderStatuses: OrderStatus[] = [
  'Pedido confirmado',
  'Pedido em separação',
  'Pedido em transporte',
  'Saiu para entrega',
  'Pedido entregue',
];

const EditOrderForm = ({
  order,
  products,
  onSave,
  onCancel,
}: {
  order: OrderWithId;
  products: Product[];
  onSave: (updatedItems: OrderItem[]) => void;
  onCancel: () => void;
}) => {
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const { toast } = useToast();

  const handleAddItem = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) {
      toast({
        variant: 'destructive',
        title: 'Nenhum produto disponível para adicionar.',
      });
      return;
    }
    const defaultVariant = defaultProduct.variants[0];

    setItems([
      ...items,
      {
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        variantColor: defaultVariant?.color || 'N/A',
        size: defaultVariant?.sizes[0]?.size || 'U',
        quantity: 1,
        price: defaultProduct.price,
        imageUrl: fixImageUrl(defaultVariant?.images[0]),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'productId') {
      const selectedProduct = products.find((p) => p.id === value);
      if (selectedProduct) {
        const defaultVariant = selectedProduct.variants[0];
        item.productId = selectedProduct.id;
        item.productName = selectedProduct.name;
        item.price = selectedProduct.price;
        item.variantColor = defaultVariant?.color || 'N/A';
        item.size = defaultVariant?.sizes[0]?.size || 'U';
        item.imageUrl = fixImageUrl(defaultVariant?.images[0]);
      }
    } else {
      (item[field] as any) = value;
    }

    if (field === 'quantity' || field === 'price') {
      (item[field] as any) = Number(value) < 0 ? 0 : Number(value);
    }

    setItems(newItems);
  };
  
  const calculateNewTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  const handleSaveChanges = () => {
    onSave(items);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_120px_90px_90px_auto] gap-3 items-end rounded-md border p-3"
          >
            <div>
              <Label className="text-xs">Produto</Label>
              <Select
                value={item.productId}
                onValueChange={(value) =>
                  handleItemChange(index, 'productId', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cor / Tam.</Label>
              <div className="flex gap-1">
                <Input
                  value={item.variantColor}
                  onChange={(e) =>
                    handleItemChange(index, 'variantColor', e.target.value)
                  }
                  placeholder="Cor"
                />
                 <Input
                  value={item.size}
                  onChange={(e) =>
                    handleItemChange(index, 'size', e.target.value)
                  }
                  placeholder="Tam."
                  className="w-14"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Qtd.</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, 'quantity', e.target.value)
                }
              />
            </div>
             <div>
              <Label className="text-xs">Preço (Un.)</Label>
              <Input
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, 'price', e.target.value)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveItem(index)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
       <Button variant="outline" size="sm" onClick={handleAddItem}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Adicionar Item
      </Button>
      <Separator />
       <div className="flex justify-between items-center">
            <p className="font-semibold">Novo Total do Pedido: <span className="font-bold text-lg">R$ {calculateNewTotal().toFixed(2).replace('.',',')}</span></p>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </Button>
            </div>
       </div>
    </div>
  );
};

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!firestore) return;
    
    // Fetch products for editing
    const productsQuery = query(collection(firestore, 'products'));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}) as Product);
        setProducts(productsData);
    });

    const ordersQuery = query(collectionGroup(firestore, 'orders'));
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs
          .map((doc) => ({
            ...(doc.data() as Order),
            id: doc.id,
            path: doc.ref.path,
          }))
          .filter(
            (order): order is OrderWithId =>
              !!(order.customerInfo && order.customerInfo.name)
          );

        ordersData.sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar pedidos',
          description: 'Não foi possível carregar os pedidos do banco de dados.',
        });
        setLoading(false);
      }
    );
    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, [firestore, toast]);

  const handleStatusChange = async (
    orderPath: string,
    newStatus: OrderStatus
  ) => {
    if (!firestore) return;
    const orderId = orderPath.split('/').pop() || '';
    setUpdatingStatus((prev) => ({ ...prev, [orderId]: true }));
    try {
      const orderRef = doc(firestore, orderPath);
      await updateDoc(orderRef, { status: newStatus });
      toast({
        title: 'Status atualizado!',
        description: `O pedido foi atualizado para "${newStatus}".`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: 'Não foi possível alterar o status do pedido.',
      });
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleClearAllOrders = async () => {
    if (!firestore || orders.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum pedido para apagar',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const ordersQuery = query(collectionGroup(firestore, 'orders'));
      const querySnapshot = await getDocs(ordersQuery);

      if (querySnapshot.empty) {
        toast({
          title: 'Tudo limpo!',
          description: 'Não havia pedidos para remover.',
        });
        return;
      }

      const batch = writeBatch(firestore);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      toast({
        title: 'Sucesso!',
        description: `${querySnapshot.size} pedidos foram removidos.`,
      });
    } catch (error) {
      console.error('Error clearing all orders:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao zerar pedidos',
        description:
          'Não foi possível remover todos os pedidos. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
   const handleSaveOrderEdit = async (orderPath: string, updatedItems: OrderItem[]) => {
    if (!firestore) return;
    
    const newTotalAmount = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    // Para simplificar, o desconto não será recalculado. Poderia ser uma melhoria futura.
    
    try {
      const orderRef = doc(firestore, orderPath);
      await updateDoc(orderRef, {
        items: updatedItems,
        totalAmount: newTotalAmount
      });
      toast({
        title: 'Pedido atualizado!',
        description: 'Os itens e o valor do pedido foram salvos.',
      });
      setEditingOrderId(null);
    } catch (error) {
      console.error("Error updating order items:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os itens do pedido."
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Gerenciamento de Pedidos dos Clientes</CardTitle>
          <CardDescription>
            Veja e atualize o status de todos os pedidos vinculados aos
            clientes.
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading || orders.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Zerar Pedidos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Todos os {orders.length} pedidos
                serão permanentemente apagados dos registros de todos os
                usuários.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAllOrders}
                disabled={isDeleting}
              >
                {isDeleting ? 'Apagando...' : 'Sim, apagar tudo'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-[220px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <Collapsible
                key={order.id}
                asChild
                open={openOrderId === order.id}
                onOpenChange={() => {
                  if (openOrderId === order.id) {
                    setOpenOrderId(null);
                    setEditingOrderId(null);
                  } else {
                    setOpenOrderId(order.id);
                  }
                }}
              >
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {openOrderId === order.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="sr-only">Toggle Details</span>
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.orderDate), 'dd/MM/yy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerInfo.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell>
                      {updatingStatus[order.id] ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Atualizando...</span>
                        </div>
                      ) : (
                        <Select
                          value={order.status}
                          onValueChange={(newStatus: OrderStatus) =>
                            handleStatusChange(order.path, newStatus)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Alterar status" />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableCell colSpan={5} className="p-4">
                        {editingOrderId === order.id ? (
                          <EditOrderForm
                            order={order}
                            products={products}
                            onSave={(updatedItems) =>
                              handleSaveOrderEdit(order.path, updatedItems)
                            }
                            onCancel={() => setEditingOrderId(null)}
                          />
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-bold mb-2">
                                  Detalhes do Cliente
                                </h4>
                                <p>
                                  <strong>Nome:</strong>{' '}
                                  {order.customerInfo.name}
                                </p>
                                <p>
                                  <strong>Email:</strong>{' '}
                                  {order.customerInfo.email}
                                </p>
                                <p>
                                  <strong>Endereço:</strong>{' '}
                                  {order.shippingAddress}
                                </p>
                                <p className="font-mono text-xs mt-2 text-muted-foreground">
                                  User ID: {order.userId}
                                </p>
                                <p className="font-mono text-xs mt-2 text-muted-foreground">
                                  Order ID: {order.id}
                                </p>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold">
                                    Itens do Pedido
                                  </h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setEditingOrderId(order.id)
                                    }
                                  >
                                    <Edit className="mr-2 h-3 w-3" />
                                    Editar Itens
                                  </Button>
                                </div>
                                <div className="space-y-4">
                                  {order.items.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-4"
                                    >
                                      <Image
                                        src={fixImageUrl(item.imageUrl)}
                                        alt={item.productName}
                                        width={50}
                                        height={50}
                                        className="rounded-md object-cover"
                                      />
                                      <div className="flex-grow">
                                        <p className="font-semibold">
                                          {item.productName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.quantity} x R${' '}
                                          {item.price
                                            .toFixed(2)
                                            .replace('.', ',')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Cor: {item.variantColor} / Tam:{' '}
                                          {item.size}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-1 text-sm">
                                  {order.discountAmount &&
                                  order.discountAmount > 0 ? (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>
                                          R${' '}
                                          {(
                                            order.totalAmount +
                                            order.discountAmount
                                          )
                                            .toFixed(2)
                                            .replace('.', ',')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-green-600">
                                        <span>
                                          Desconto ({order.couponCode}):
                                        </span>
                                        <span>
                                          - R${' '}
                                          {order.discountAmount
                                            .toFixed(2)
                                            .replace('.', ',')}
                                        </span>
                                      </div>
                                    </>
                                  ) : null}
                                  <div className="flex justify-between font-bold">
                                    <span>Total do Pedido:</span>
                                    <span>
                                      R${' '}
                                      {order.totalAmount
                                        .toFixed(2)
                                        .replace('.', ',')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </TableBody>
              </Collapsible>
            ))
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </CardContent>
    </Card>
  );
}
