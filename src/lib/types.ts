
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
  description: string; // Short description for cards
  longDescription: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  category: 'calçados' | 'roupas' | 'acessorios' | 'perfumes';
  subCategory?: string;
  variants: Variant[];
  rating: number;
  reviews: number;
  status: 'ativo' | 'inativo';
  tags?: string[];
  quality?: 'Essential' | 'Select' | 'Elite';
};

export type CartItem = {
  product: Product;
  variant: Variant;
  size: string;
  quantity: number;
};
