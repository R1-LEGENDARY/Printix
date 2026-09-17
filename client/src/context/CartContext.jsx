import { useEffect, useState, useCallback } from "react";
import { fetchCart, addToCart, updateCartItem, removeCartItem } from "../api/cart";
import { useAuth } from "./useAuth";
import { CartContext } from "./CartContextValue";

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: "0.00", itemCount: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to load cart", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      localStorage.removeItem("cartId");
      Promise.resolve().then(() => {
        setCart({ items: [], subtotal: "0.00", itemCount: 0 });
        setLoading(false);
      });
      return;
    }
    Promise.resolve().then(refresh);
  }, [authLoading, refresh, user]);

  async function add(productVariantId, quantity = 1, designId = null) {
    if (!user) return null;
    const data = await addToCart(productVariantId, quantity, designId);
    setCart(data);
    return data;
  }

  async function updateQuantity(itemId, quantity) {
    const data = await updateCartItem(itemId, quantity);
    setCart(data);
  }

  async function remove(itemId) {
    const data = await removeCartItem(itemId);
    setCart(data);
  }

  return (
    <CartContext.Provider value={{ cart, loading, add, updateQuantity, remove, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

