
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { CartItem, Product, Variant } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: Variant, size: string, quantity?: number, selectedImage?: string, displayName?: string, giftChoice?: 'dourada' | 'prata') => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const getCartItemId = (product: Product, variant: Variant, size: string, selectedImage?: string, giftChoice?: 'dourada' | 'prata') => {
    return `${product.id}-${variant.id}-${size}-${selectedImage || ''}-${giftChoice || ''}`;
};


export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('pisa-vibe-cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        // If parsing fails, clear the corrupted cart data
        localStorage.removeItem('pisa-vibe-cart');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('pisa-vibe-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);


  const addToCart = (product: Product, variant: Variant, size: string, quantity: number = 1, selectedImage?: string, displayName?: string, giftChoice?: 'dourada' | 'prata') => {
    setCartItems((prevItems) => {
        const cartItemId = getCartItemId(product, variant, size, selectedImage, giftChoice);
        const existingItem = prevItems.find(
            (item) => getCartItemId(item.product, item.variant, item.size, item.selectedImage, item.giftChoice) === cartItemId
        );

      if (existingItem) {
        return prevItems.map(item =>
            getCartItemId(item.product, item.variant, item.size, item.selectedImage, item.giftChoice) === cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
        );
      }
      
      const cartItem: CartItem = { product, variant, size, quantity, selectedImage, displayName, giftChoice };
      return [...prevItems, cartItem];
    });

    toast({
      title: "Produto adicionado!",
      description: `${displayName || product.name} foi adicionado ao seu carrinho.`,
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => getCartItemId(item.product, item.variant, item.size, item.selectedImage, item.giftChoice) !== cartItemId)
    );
    toast({
      title: "Produto removido",
      description: "O item foi removido do seu carrinho.",
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        getCartItemId(item.product, item.variant, item.size, item.selectedImage, item.giftChoice) === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
