import { Link } from "react-router-dom";
import { useWishlist } from "../context/useWishlist";
import Button from "../components/Button";
import { mediaUrl } from "../utils/mediaUrl";
import "./Wishlist.css";

function Wishlist() {
  const { items, loading } = useWishlist();

  if (loading) return <p className="wishlist-status">Loading your wishlist...</p>;

  if (items.length === 0) {
    return (
      <div className="wishlist wishlist--empty">
        <h2>Your wishlist is empty</h2>
        <p>Save products you're considering for later.</p>
        <Link to="/catalog">
          <Button variant="primary" className="btn--browse-products">Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="wishlist">
      <h2>Your wishlist</h2>
      <div className="wishlist-grid">
        {items.map((item) => (
          <article className="wishlist-card" key={item.id}>
            <Link to={`/products/${item.variant.product.slug}`}>
              <div className="wishlist-card__image">
                {item.variant.product.image && (
                  <img
                    src={mediaUrl(item.variant.product.image)}
                    alt={item.variant.product.name}
                  />
                )}
              </div>
            </Link>
            <div className="wishlist-card__body">
              <Link to={`/products/${item.variant.product.slug}`}>
                <h3>{item.variant.product.name}</h3>
                <p className="wishlist-card__variant">{item.variant.color} / {item.variant.size}</p>
                <p className="wishlist-card__price">₱{item.variant.product.basePrice}</p>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;