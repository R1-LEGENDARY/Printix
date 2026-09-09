import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import Button from "../components/Button";
import "./Wishlist.css";

function Wishlist() {
  const { items, loading } = useWishlist();

  if (loading) return <p className="wl-status">Loading your wishlist...</p>;

  if (items.length === 0) {
    return (
      <div className="wl wl--empty">
        <h2>Your wishlist is empty</h2>
        <p>Save products you're considering for later.</p>
        <Link to="/catalog">
          <Button variant="primary" className="btn--browse-products">Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="wl">
      <h2>Your wishlist</h2>
      <div className="wl-grid">
        {items.map((item) => (
          <div className="wl-card" key={item.id}>
            <Link to={`/products/${item.variant.product.slug}`}>
              <div className="wl-card__image">
                {item.variant.product.image && (
                  <img
                    src={
                      item.variant.product.image.startsWith("http")
                        ? item.variant.product.image
                        : `http://localhost:5000${item.variant.product.image}`
                    }
                    alt={item.variant.product.name}
                  />
                )}
              </div>
            </Link>
            <div className="wl-card__body">
              <Link to={`/products/${item.variant.product.slug}`}>
                <h3>{item.variant.product.name}</h3>
                <p className="wl-card__variant">{item.variant.color} / {item.variant.size}</p>
                <p className="wl-card__price">₱{item.variant.product.basePrice}</p>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;