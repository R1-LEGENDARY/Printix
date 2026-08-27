import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchCart, addToCart, updateCartItem, removeCartItem } from "../api/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
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
    refresh();
  }, [refresh]);

  async function add(productVariantId, quantity = 1, designId = null) {
    const data = await addToCart(productVariantId, quantity, designId);
    setCart(data);
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

export function useCart() {
  return useContext(CartContext);
}