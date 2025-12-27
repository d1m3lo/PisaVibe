export type Product = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  images: string[];
  category: 'tênis' | 'roupas';
  rating: number;
  reviews: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
