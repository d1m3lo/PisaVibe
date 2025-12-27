export type Product = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  images: string[];
  category: 'calçados' | 'roupas' | 'acessorios' | 'perfumes';
  subCategory?: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  tags?: ('lancamentos' | 'ofertas')[];
  rating: number;
  reviews: number;
  status: 'ativo' | 'inativo';
};

export type CartItem = {
  product: Product;
  quantity: number;
};

    