'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  expansion: string;
  number: string;
  version: string;
  language?: string;
  price: number;
  image_url: string;
  stock: number;
  quantity: number;
  seller_id?: number;
  seller_name?: string;
  seller_phone?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (card: any, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('altomando_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('altomando_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Error saving cart:', e);
      }
    }
  }, [items, isLoaded]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addToCart = (card: any, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === card.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, card.stock);
        return prev.map((item) =>
          item.id === card.id ? { ...item, quantity: newQty } : item
        );
      } else {
        const initialQty = Math.min(quantity, card.stock > 0 ? card.stock : 1);
        return [
          ...prev,
          {
            id: card.id,
            name: card.name,
            expansion: card.expansion,
            number: card.number,
            version: card.version,
            language: card.language || 'Inglés',
            price: card.price,
            image_url: card.image_url,
            stock: card.stock,
            quantity: initialQty,
            seller_id: card.seller_id,
            seller_name: card.seller_name || 'Luca',
            seller_phone: card.seller_phone || '',
          },
        ];
      }
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.stock) return item; // Can't exceed available stock
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPrice = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
