import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/Button";
import WishlistButton from "../components/WishlistButton";
import ProductReviews from "../components/ProductReviews";
import "./ProductDetail.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [adding, setAdding] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [authMessage, setAuthMessage] = useState(null);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then((res) => {
        setProduct(res.data);

        const firstVariant = res.data.variants?.[0];

        if (firstVariant) {
          setSelectedColor(firstVariant.color);
          setSelectedSize(firstVariant.size);
        }
      })
      .catch((err) =>
        setError(err.response?.data?.message || err.message)
      )
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product?.category?.name) return;
    api.get("/products")
      .then((res) => setRelatedProducts(
        res.data
          .filter((item) => item.slug !== product.slug && item.category === product.category.name)
          .slice(0, 4)
      ))
      .catch(() => setRelatedProducts([]));
  }, [product]);

  const colors = useMemo(
    () => [...new Set(product?.variants.map((v) => v.color) || [])],
    [product]
  );

  const sizes = useMemo(
    () => [...new Set(product?.variants.map((v) => v.size) || [])],
    [product]
  );

  const activeVariant = useMemo(
    () =>
      product?.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      ),
    [product, selectedColor, selectedSize]
  );

  if (loading) {
    return <p className="pd-status">Loading product...</p>;
  }

  if (error) {
    return <p className="pd-status">Error: {error}</p>;
  }

  if (!product) {
    return null;
  }

  const inStock = activeVariant
    ? activeVariant.stockQuantity > 0
    : false;

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <div className="pd">
      <div className="pd__gallery">
        {primaryImage ? (
          <img
            src={
              primaryImage.imageUrl.startsWith("http")
                ? primaryImage.imageUrl
                : `http://localhost:5000${primaryImage.imageUrl}`
            }
            alt={product.name}
          />
        ) : (
          <div className="pd__gallery-empty" />
        )}
      </div>

      <div className="pd__info">
        <span className="pd__category">
          {product.category?.name}
        </span>

        <h1>{product.name}</h1>

        <div className="pd__price-row">
          <p className="pd__price">₱{product.basePrice}</p>
          <WishlistButton variantId={activeVariant?.id} />
        </div>

        <p className="pd__description">
          {product.description}
        </p>

        {colors.length > 0 && (
          <div className="pd__option-group">
            <span className="pd__option-label">Color</span>

            <div className="pd__swatches">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`pd__swatch ${
                    selectedColor === color
                      ? "pd__swatch--active"
                      : ""
                  }`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="pd__option-group">
            <span className="pd__option-label">Size</span>

            <div className="pd__swatches">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`pd__swatch ${
                    selectedSize === size
                      ? "pd__swatch--active"
                      : ""
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <p
          className={`pd__availability ${
            inStock
              ? "pd__availability--in"
              : "pd__availability--out"
          }`}
        >
          {activeVariant
            ? inStock
              ? "In stock"
              : "Out of stock"
            : "Select options"}
        </p>

        <div className="pd__actions">
          <Link
            to={`/design/${product.slug}?variant=${activeVariant?.id || ""}`}
            onClick={(event) => {
              if (user) return;
              event.preventDefault();
              setAuthMessage("Please log in to customize this product.");
            }}
          >
            <Button variant="primary" disabled={!inStock}>
              Customize this product
            </Button>
          </Link>

          <Button
            variant="secondary"
            disabled={!inStock || adding}
            onClick={async () => {
              if (!user) {
                setAuthMessage("Please log in to add items to your cart.");
                return;
              }
              setAdding(true);

              try {
                await add(activeVariant.id, 1);
              } finally {
                setAdding(false);
              }
            }}
          >
            {adding ? "Adding..." : "Add to cart"}
          </Button>
        </div>
        {authMessage && <p className="pd__auth-message" role="alert">{authMessage}</p>}
      </div>

      {relatedProducts.length > 0 && (
        <section className="pd-related" aria-label="Related products">
          <div className="pd-related__header">
            <h2>You may also like</h2>
            <Link to="/catalog">View all products</Link>
          </div>
          <div className="pd-related__grid">
            {relatedProducts.map((related) => (
              <Link className="pd-related-card" to={`/products/${related.slug}`} key={related.id}>
                <div className="pd-related-card__image">
                  {related.primaryImage && <img src={related.primaryImage.startsWith("http") ? related.primaryImage : `http://localhost:5000${related.primaryImage}`} alt={related.name} />}
                </div>
                <span>{related.name}</span>
                <strong>₱{related.basePrice}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductReviews productId={product.id} />
    </div>
  );
}

export default ProductDetail;