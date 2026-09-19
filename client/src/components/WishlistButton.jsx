import { useAuth } from "../context/useAuth";
import { useWishlist } from "../context/useWishlist";
import "./WishlistButton.css";

/*
 * DOCU: Heart-icon toggle button for adding/removing a product variant
 * from the logged-in user's wishlist. Renders nothing for guests.
 * @param {string} variantId - The product variant to toggle
 * @returns {JSX.Element|null}
 */
function WishlistButton({ variantId }) {
  const { user } = useAuth();
  const { isWishlisted, add, remove } = useWishlist();

  if (!user || !variantId) return null;

  const active = isWishlisted(variantId);

  return (
    <button
      className={`wishlist-btn ${active ? "wishlist-btn--active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        active ? remove(variantId) : add(variantId);
      }}
      title={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}

export default WishlistButton;