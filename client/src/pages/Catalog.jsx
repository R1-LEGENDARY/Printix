import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import WishlistButton from "../components/WishlistButton";
import StarRating from "../components/StarRating";
import "./Catalog.css";

function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="catalog-status">Loading products...</p>;
  if (error) return <p className="catalog-status">Error: {error}</p>;

  return (
    <div className="catalog">
      <div className="catalog__header">
        <h2>Shop all products</h2>
        <p>Pick a blank canvas, then make it yours.</p>
      </div>

      {products.length === 0 ? (
        <p className="catalog-status">No products available yet.</p>
      ) : (
        <div className="catalog-grid">
          {products.map((product) => (
            <div key={product.id} className="catalog-card">
              <Link to={`/products/${product.slug}`}>
                <div className="catalog-card__image">
                  {product.primaryImage && (
                    <img
                      src={
                        product.primaryImage.startsWith("http")
                          ? product.primaryImage
                          : `http://localhost:5000${product.primaryImage}`
                      }
                      alt={product.name}
                    />
                  )}
                  <div className="catalog-card__wishlist">
                    <WishlistButton variantId={product.defaultVariantId} />
                  </div>
                </div>
                <div className="catalog-card__body">
                  <span className="catalog-card__category">{product.category}</span>
                  <h3>{product.name}</h3>
                  {product.reviewCount > 0 && (
                    <div className="catalog-card__rating">
                      <StarRating value={product.averageRating} size="0.8125rem" />
                      <span>({product.reviewCount})</span>
                    </div>
                  )}
                  <p>₱{product.basePrice}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Catalog;