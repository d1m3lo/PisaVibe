
export type SizeInfo = {
  size: string;
  stock: number;
};

export type Variant = {
  id: string;
  color: string;
  colorHex: string;
  images: string[];
  sizes: SizeInfo[];
};

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
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
  quality?: 'Essential' | 'Select' | 'Elite';
  origin?: string; // Campo de origem para uso do admin
};

export type CartItem = {
  product: Product;
  variant: Variant;
  size: string;
  quantity: number;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
};

export type Order = {
  id: string;
  userId: string;
  orderDate: string; // ISO String
  totalAmount: number;
  shippingAddress: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  couponCode?: string;
  discountAmount?: number;
}

export type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate?: string; // ISO String
  isActive: boolean;
}
