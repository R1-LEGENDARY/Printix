import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import WishlistButton from "../components/WishlistButton";
import StarRating from "../components/StarRating";
import Seo from "../components/Seo";
import { mediaUrl } from "../utils/mediaUrl";
import "./Catalog.css";

function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const categories = [
    { name: "T-Shirts", mobileName: "T-Shirts", image: "https://png.pngtree.com/png-vector/20240205/ourmid/pngtree-black-oversize-t-shirt-mockup-realistic-t-shirt-png-image_11645672.png" },
    { name: "Hoodies & Sweatshirts", mobileName: "Hoodies", image: "https://png.pngtree.com/png-clipart/20241210/original/pngtree-over-sized-hoodie-isolated-on-white-transparent-background-png-image_17779068.png" },
    { name: "Phone Cases", mobileName: "Cases", image: "https://png.pngtree.com/png-vector/20250327/ourmid/pngtree-slim-silicone-iphone-case-matte-finish-with-soft-and-protective-feel-png-image_15880650.png" },
    { name: "Mouse Pads", mobileName: "Mouse Pads", image: "https://static.vecteezy.com/system/resources/thumbnails/045/764/350/small/computer-flat-matt-on-transparent-background-png.png" },
    { name: "Pillows & Cushions", mobileName: "Pillows", image: "https://static.vecteezy.com/system/resources/thumbnails/046/828/346/small/elegance-of-white-pillows-isolated-on-transparent-background-png.png" },
  ];
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return (!query || `${product.name} ${product.category}`.toLowerCase().includes(query))
      && (!selectedCategory || product.category.toLowerCase() === selectedCategory.toLowerCase());
  });
  const categoryTitle = selectedCategory || "Custom Products";
  const catalogDescription = selectedCategory
    ? `Shop customizable ${selectedCategory.toLowerCase()} from Printix.`
    : "Shop customizable products from Printix and make every piece your own.";

  if (loading) return <p className="catalog-status">Loading products...</p>;
  if (error) return <p className="catalog-status">Error: {error}</p>;

  return (
    <div className="catalog">
      <Seo title={categoryTitle} description={catalogDescription} path="/catalog" />
      <section className="catalog-categories" aria-label="Product categories">
        <h3>Categories</h3>
        <div className="catalog-categories__grid">
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              className={selectedCategory === category.name ? "catalog-category catalog-category--active" : "catalog-category"}
              onClick={() => setSelectedCategory((current) => current === category.name ? "" : category.name)}
            >
              <img className="catalog-category__image" src={category.image} alt={`${category.name} product category`} />
              <span>
                <span className="catalog-category__name-full">{category.name}</span>
                <span className="catalog-category__name-mobile">{category.mobileName}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {products.length === 0 ? (
        <p className="catalog-status">No products available yet.</p>
      ) : (
        <>
          {filteredProducts.length === 0 ? <p className="catalog-status">No products match your search.</p> : <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="catalog-card">
              <Link to={`/products/${product.slug}`}>
                <div className="catalog-card__image">
                  {product.primaryImage && (
                    <img
                      src={mediaUrl(product.primaryImage)}
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
            </article>
          ))}
        </div>}
        </>
      )}
    </div>
  );
}

export default Catalog;