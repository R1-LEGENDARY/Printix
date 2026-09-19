import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listAdminProducts,
  toggleProductActive,
  deleteProduct,
} from "../../api/admin";
import Button from "../../components/Button";
import ConfirmModal from "../../components/ConfirmModal";
import "./ProductList.css";

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  function openProduct(id) {
    navigate(`/admin/products/${id}`);
  }

  function handleRowKeyDown(event, id) {
    if (event.target.closest("button, a")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct(id);
    }
  }

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

  function askDelete(product) {
    setPendingDelete(product);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteProduct(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
      setPendingDelete(null);
    }
  }

  if (loading) return <p className="admin-status">Loading products...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="product-list-header">
        <h1>Products</h1>
      </div>
      <Link className="product-list-add-link" to="/admin/products/new">
        <Button variant="primary">Add product</Button>
      </Link>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete product"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}" permanently? This can't be undone.`
            : ""
        }
        confirmText="Delete"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />

      {products.length === 0 ? (
        <p className="admin-status">No products yet.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
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
                <tr
                  key={p.id}
                  className="dashboard-table__clickable-row"
                  onClick={(event) => {
                    if (!event.target.closest("button, a")) openProduct(p.id);
                  }}
                  onKeyDown={(event) => handleRowKeyDown(event, p.id)}
                  tabIndex={0}
                  role="link"
                  aria-label={`View product ${p.name}`}
                >
                  <td>
                    <Link to={`/admin/products/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>{p.category.name}</td>
                  <td>₱{p.basePrice}</td>
                  <td>{p.variants.length}</td>
                  <td>
                    <span
                      className={`status-pill ${p.isActive ? "status-pill--delivered" : "status-pill--cancelled"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="product-list-actions">
                      <button
                        type="button"
                        className="product-list-toggle"
                        onClick={() => handleToggle(p.id)}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="product-list-toggle product-list-toggle--danger"
                        onClick={() => askDelete(p)}
                      >
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
