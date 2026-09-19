import { useCallback, useEffect, useState } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../api/admin";
import Button from "../../components/Button";
import ConfirmModal from "../../components/ConfirmModal";
import "./CategoryList.css";

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [newNameError, setNewNameError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listCategories()
      .then(setCategories)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) {
      setNewNameError("Category name is required.");
      return;
    }
    setNewNameError("");
    setError(null);
    try {
      await createCategory({ name: newName.trim() });
      setNewName("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create category.");
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditNameError("");
  }

  async function saveEdit(id) {
    if (!editName.trim()) {
      setEditNameError("Category name is required.");
      return;
    }
    setEditNameError("");
    setError(null);
    try {
      await updateCategory(id, { name: editName.trim() });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update category.");
    }
  }

  function askDelete(category) {
    setPendingDelete(category);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);
    try {
      await deleteCategory(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category.");
      setPendingDelete(null);
    }
  }

  if (loading) return <p className="admin-status">Loading categories...</p>;

  return (
    <div>
      <h1>Categories</h1>

      <form className="category-form" onSubmit={handleCreate}>
        <div className="category-field">
          <input
            placeholder="New category name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (newNameError) setNewNameError("");
            }}
            aria-invalid={Boolean(newNameError)}
          />
          {newNameError && <span className="category-field-error">{newNameError}</span>}
        </div>
        <Button type="submit" variant="primary">Add category</Button>
      </form>

      {error && <p className="admin-error">{error}</p>}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete category"
        message={pendingDelete ? `Delete category "${pendingDelete.name}"?` : ""}
        confirmText="Delete"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />

      {categories.length === 0 ? (
        <p className="admin-status">No categories yet.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Products</th><th></th></tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {editingId === category.id ? (
                      <>
                        <input
                          className="category-edit-input"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            if (editNameError) setEditNameError("");
                          }}
                          aria-invalid={Boolean(editNameError)}
                          aria-label="Category name"
                        />
                        {editNameError && <span className="category-field-error">{editNameError}</span>}
                      </>
                    ) : (
                      category.name
                    )}
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.productCount}</td>
                  <td>
                    <div className="category-actions">
                      {editingId === category.id ? (
                        <>
                          <button onClick={() => saveEdit(category.id)}>Save</button>
                          <button onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(category)}>Edit</button>
                          <button onClick={() => askDelete(category)}>Delete</button>
                        </>
                      )}
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

export default CategoryList;