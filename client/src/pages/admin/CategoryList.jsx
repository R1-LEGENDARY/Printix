import { useEffect, useState } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../api/admin";
import Button from "../../components/Button";
import "./CategoryList.css";

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  function load() {
    setLoading(true);
    listCategories()
      .then(setCategories)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await createCategory({ name: newName.trim() });
      setNewName("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create category.");
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  async function saveEdit(id) {
    setError(null);
    try {
      await updateCategory(id, { name: editName.trim() });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update category.");
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setError(null);
    try {
      await deleteCategory(cat.id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category.");
    }
  }

  if (loading) return <p className="admin-status">Loading categories...</p>;

  return (
    <div>
      <h1>Categories</h1>

      <form className="cat-form" onSubmit={handleCreate}>
        <input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" variant="primary">Add category</Button>
      </form>

      {error && <p className="admin-error">{error}</p>}

      {categories.length === 0 ? (
        <p className="admin-status">No categories yet.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Products</th><th></th></tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {editingId === cat.id ? (
                      <input
                        className="cat-edit-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label="Category name"
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td>{cat.slug}</td>
                  <td>{cat.productCount}</td>
                  <td>
                    <div className="cat-actions">
                      {editingId === cat.id ? (
                        <>
                          <button onClick={() => saveEdit(cat.id)}>Save</button>
                          <button onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)}>Edit</button>
                          <button onClick={() => handleDelete(cat)}>Delete</button>
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