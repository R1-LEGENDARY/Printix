import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/Button";
import { mediaUrl } from "../utils/mediaUrl";
import "./Home.css";

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    api.get("/products")
      .then((res) => setFeaturedProducts(res.data.slice(0, 3)))
      .catch(() => setFeaturedProducts([]));
  }, []);

  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-copy">
          <p className="home__eyebrow">Small-batch printing, made personal</p>
          <h1>Put your mark on something worth keeping.</h1>
          <p className="home__intro">Upload artwork, try it on real products, and make a piece that feels like yours from the first sketch to the final print.</p>
          <div className="home__actions">
            <Link to="/catalog">
              <Button variant="primary">Start designing</Button>
            </Link>
            <Link className="home__text-link" to="/catalog">Browse the collection <span aria-hidden="true">-&gt;</span></Link>
          </div>
        </div>

        <div className="home__showcase" aria-label="Featured products">
          <div className="home__showcase-label">Print / wear / repeat</div>
          {featuredProducts.length > 0 ? (
            <div className="home__product-stack">
              {featuredProducts.map((product, index) => (
                <Link className={`home__product home__product--${index + 1}`} to={`/products/${product.slug}`} key={product.id}>
                  {product.primaryImage && (
                    <img
                      src={mediaUrl(product.primaryImage)}
                      alt={product.name}
                    />
                  )}
                  <span>{product.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home__fallback-art">
              <span>YOUR<br />IDEA<br />HERE</span>
            </div>
          )}
          <span className="home__showcase-note">Made for the things you do often.</span>
        </div>
      </section>

      <section className="home__principles" aria-label="Printix principles">
        <div><span>01</span><strong>Choose your canvas</strong><p>Start with a blank product built for your idea.</p></div>
        <div><span>02</span><strong>Make it yours</strong><p>Position, scale, and preview your artwork in context.</p></div>
        <div><span>03</span><strong>Keep the good one</strong><p>Order a piece you will reach for again and again.</p></div>
      </section>
    </div>
  );
}

export default Home;