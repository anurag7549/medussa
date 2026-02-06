import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Product, CartItem } from '@/lib/types';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  isOpen: boolean;
  loading: boolean;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  requiresAuth: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const TAX_RATE = 0.08;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<(CartItem & { product: Product })[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const cartItems = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product,
      }));

      setItems(cartItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch cart when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product: Product) => {
    if (!user) return;

    try {
      // Check if already in cart
      const existing = items.find((item) => item.product_id === product.id);

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ user_id: user.id, product_id: product.id, quantity: 1 });

        if (error) throw error;
      }

      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;

    try {
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const toggleCart = () => setIsOpen((prev) => !prev);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const value: CartContextType = {
    items,
    isOpen,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    totalItems,
    subtotal,
    tax,
    total,
    requiresAuth: !user,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
