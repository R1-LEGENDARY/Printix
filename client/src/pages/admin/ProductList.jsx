import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminProducts, toggleProductActive } from "../../api/admin";
import Button from "../../components/Button";
import "./ProductList.css";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    listAdminProducts()
      .then(setProducts)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleToggle(id) {
    try {
      await toggleProductActive(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update product.");
    }
  }

  if (loading) return <p className="admin-status">Loading products...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="pl-header">
        <h1>Products</h1>
        <Link to="/admin/products/new">
          <Button variant="primary">Add product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="admin-status">No products yet.</p>
      ) : (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Variants</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/admin/products/${p.id}`}>{p.name}</Link></td>
                <td>{p.category.name}</td>
                <td>${p.basePrice}</td>
                <td>{p.variants.length}</td>
                <td>
                  <span className={`status-pill ${p.isActive ? "status-pill--delivered" : "status-pill--cancelled"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="pl-toggle" onClick={() => handleToggle(p.id)}>
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductList;