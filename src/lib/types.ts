
export type SizeInfo = {
  size: string;
  stock: number;
};

export type Variant = {
  id: string;
  color: string;
  colorHex: string;
  price: number;
  oldPrice?: number;
  images: string[];
  imageNames?: string[]; // Nome correspondente a cada imagem (para mochilas)
  sizes: SizeInfo[];
};

export type Product = {
  id: string;
  name: string;
  brand?: string;
  description: string; // Short description for cards
  longDescription: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  category: 'calcados' | 'roupas' | 'acessorios' | 'perfumes';
  subCategory?: string;
  variants: Variant[];
  rating: number;
  reviews: number;
  status: 'ativo' | 'inativo';
  tags?: string[];
  quality?: 'Essential' | 'Select' | 'Elite' | 'Ultra';
  isImported?: boolean; // Selo de produto importado
  showSizeChart?: boolean; // Exibir tabela de medidas
  origin?: string; // Campo de origem para uso do admin
};

export type CartItem = {
  product: Product;
  variant: Variant;
  size: string;
  quantity: number;
  selectedImage?: string; // Add selectedImage for backpacks
  displayName?: string; // Nome a ser exibido no carrinho (para mochilas)
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
};

export type OrderItem = {
    productId: string;
    productName: string;
    variantColor: string;
    size: string;
    quantity: number;
    price: number;
    imageUrl: string;
}

export type OrderStatus =
  | 'Pedido recebido' // Apenas para a Central de Controle
  | 'Pedido confirmado'
  | 'Pedido em separação'
  | 'Pedido em transporte'
  | 'Saiu para entrega'
  | 'Pedido entregue'
  | 'Finalizado'; // Status final da Central de Controle

export type Order = {
  id: string;
  userId: string;
  originalSessionId?: string; // ID da sessão de checkout ou do pagamento
  customerInfo: {
    name: string;
    email: string;
  },
  items: OrderItem[];
  orderDate: string; // ISO String
  totalAmount: number;
  shippingAddress: string;
  status: OrderStatus;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: 'card' | 'pix';
}

export type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate?: string; // ISO String
  isActive: boolean;
}
