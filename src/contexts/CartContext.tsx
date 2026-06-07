import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  cartItemId: number;
  id: string; // product id
  productId: string;
  sellerId: string;
  sourceVideoId?: string;
  timestampAdded?: number;
  name: string;
  price: number;
  url: string;
  quantity: number;
  size?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, sourceVideoId?: string, timestampAdded?: number) => void;
  updateQuantity: (cartItemId: number, delta: number) => void;
  removeItem: (cartItemId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const isInitialLoad = useRef(true);
  const loadedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const key = user ? `hybrid_cart_${user.uid}` : 'hybrid_cart_guest';
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setCart(JSON.parse(stored));
      } else {
        setCart([]);
      }
    } catch (e) {
      setCart([]);
    }
    loadedUserId.current = user ? user.uid : null;
  }, [user]);

  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    // Only save if the cart matches the currently loaded user
    // This prevents saving the OLD user's cart to the NEW user's ID during the render cycle transition
    const currentUserId = user ? user.uid : null;
    if (loadedUserId.current === currentUserId) {
      const key = user ? `hybrid_cart_${user.uid}` : 'hybrid_cart_guest';
      localStorage.setItem(key, JSON.stringify(cart));
    }
  }, [cart, user]);

  const addToCart = (product: any, sourceVideoId?: string, timestampAdded?: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.size === product.selectedSize);
      if (existing) {
        return prev.map(item => item.productId === product.id && item.size === product.selectedSize
          ? { ...item, quantity: item.quantity + (product.quantity || 1) }
          : item
        );
      }
      return [...prev, { 
        ...product, 
        productId: product.id,
        quantity: product.quantity || 1, 
        cartItemId: Date.now(),
        sourceVideoId,
        timestampAdded
      }];
    });
  };

  const updateQuantity = (cartItemId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const removeItem = (cartItemId: number) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
