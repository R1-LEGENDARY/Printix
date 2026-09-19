import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/Button";
import WishlistButton from "../components/WishlistButton";
import ProductReviews from "../components/ProductReviews";
import Seo from "../components/Seo";
import { mediaUrl } from "../utils/mediaUrl";
import "./ProductDetail.css";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";

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
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product?.category?.name) return;
    api
      .get("/products")
      .then((res) =>
        setRelatedProducts(
          res.data
            .filter(
              (item) =>
                item.slug !== product.slug &&
                item.category === product.category.name,
            )
            .slice(0, 4),
        ),
      )
      .catch(() => setRelatedProducts([]));
  }, [product]);

  const colors = useMemo(
    () => [...new Set(product?.variants.map((v) => v.color) || [])],
    [product],
  );

  const sizes = useMemo(
    () => [...new Set(product?.variants.map((v) => v.size) || [])],
    [product],
  );

  const activeVariant = useMemo(
    () =>
      product?.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      ),
    [product, selectedColor, selectedSize],
  );

  if (loading) {
    return <p className="product-detail-status">Loading product...</p>;
  }

  if (error) {
    return <p className="product-detail-status">Error: {error}</p>;
  }

  if (!product) {
    return null;
  }

  const inStock = activeVariant ? activeVariant.stockQuantity > 0 : false;

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <div className="product-detail">
      <Seo
        title={product.name}
        description={
          product.description ||
          `Customize and order ${product.name} from Printix.`
        }
        image={mediaUrl(primaryImage?.imageUrl)}
        path={`/products/${product.slug}`}
      />
      <div className="product-detail__gallery">
        {primaryImage ? (
          <img src={mediaUrl(primaryImage.imageUrl)} alt={product.name} />
        ) : (
          <div className="product-detail__gallery-empty" />
        )}
      </div>

      <div className="product-detail__info">
        <span className="product-detail__category">
          {product.category?.name}
        </span>

        <h1>{product.name}</h1>

        <div className="product-detail__price-row">
          <p className="product-detail__price">₱{product.basePrice}</p>
          <WishlistButton variantId={activeVariant?.id} />
        </div>

        <p className="product-detail__description">{product.description}</p>

        {colors.length > 0 && (
          <div className="product-detail__option-group">
            <span className="product-detail__option-label">Color</span>

            <div className="product-detail__swatches">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`product-detail__swatch ${
                    selectedColor === color
                      ? "product-detail__swatch--active"
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
          <div className="product-detail__option-group">
            <span className="product-detail__option-label">Size</span>

            <div className="product-detail__swatches">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`product-detail__swatch ${
                    selectedSize === size
                      ? "product-detail__swatch--active"
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
          className={`product-detail__availability ${
            inStock
              ? "product-detail__availability--in"
              : "product-detail__availability--out"
          }`}
        >
          {activeVariant
            ? inStock
              ? "In stock"
              : "Out of stock"
            : "Select options"}
        </p>

        <div className="product-detail__actions">
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
        {authMessage && (
          <p className="product-detail__auth-message" role="alert">
            {authMessage}
          </p>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <section
          className="product-detail-related"
          aria-label="Related products"
        >
          <div className="product-detail-related__header">
            <h2>You may also like</h2>
            <Link to="/catalog">View all products</Link>
          </div>
          <div className="product-detail-related__grid">
            {relatedProducts.map((related) => (
              <Link
                className="product-detail-related-card"
                to={`/products/${related.slug}`}
                key={related.id}
              >
                <div className="product-detail-related-card__image">
                  {related.primaryImage && (
                    <img
                      src={mediaUrl(related.primaryImage)}
                      alt={related.name}
                    />
                  )}
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
