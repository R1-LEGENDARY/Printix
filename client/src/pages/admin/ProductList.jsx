import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminProducts, toggleProductActive, deleteProduct } from "../../api/admin";
import Button from "../../components/Button";
import "./ProductList.css";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listAdminProducts()
      .then(setProducts)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function handleToggle(id) {
    try {
      await toggleProductActive(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}" permanently? This can't be undone.`)) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
    }
  }

  if (loading) return <p className="admin-status">Loading products...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="pl-header">
        <h1>Products</h1>
      </div>
      <Link className="pl-add-link" to="/admin/products/new">
        <Button variant="primary">Add product</Button>
      </Link>

      {products.length === 0 ? (
        <p className="admin-status">No products yet.</p>
      ) : (
        <div className="dash-table-wrap">
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
                  <td>₱{p.basePrice}</td>
                  <td>{p.variants.length}</td>
                  <td>
                    <span className={`status-pill ${p.isActive ? "status-pill--delivered" : "status-pill--cancelled"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="pl-actions">
                      <button type="button" className="pl-toggle" onClick={() => handleToggle(p.id)}>
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button type="button" className="pl-toggle pl-toggle--danger" onClick={() => handleDelete(p.id, p.name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductList;