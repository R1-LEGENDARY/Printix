import { useEffect, useState, useCallback } from "react";
import { fetchWishlist, addWishlistItem, removeWishlistItem } from "../api/wishlist";
import { useAuth } from "./useAuth";
import { WishlistContext } from "./WishlistContextValue";

/*
 * DOCU: Provides wishlist state (list + variant-id set for fast lookups)
 * and mutation helpers. Only loads/works for logged-in users.
 * @param {ReactNode} children
 * @returns {JSX.Element} - Provider wrapping children
 *
 * Author: JC
 */
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWishlist();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  async function add(productVariantId) {
    const item = await addWishlistItem(productVariantId);
    setItems((prev) => [item, ...prev.filter((i) => i.variant.id !== productVariantId)]);
  }

  async function remove(productVariantId) {
    await removeWishlistItem(productVariantId);
    setItems((prev) => prev.filter((i) => i.variant.id !== productVariantId));
  }

  function isWishlisted(productVariantId) {
    return items.some((i) => i.variant.id === productVariantId);
  }

  return (
    <WishlistContext.Provider value={{ items, loading, add, remove, isWishlisted, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

