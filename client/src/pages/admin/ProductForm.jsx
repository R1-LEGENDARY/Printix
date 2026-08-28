import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  upsertVariant,
  listCategories,
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
  upsertPrintableArea,
  adjustStock,
} from "../../api/admin";
import Button from "../../components/Button";
import "./ProductForm.css";

const emptyProduct = { name: "", categoryId: "", description: "", basePrice: "" };
const emptyVariant = { color: "", size: "", sku: "", stockQuantity: 0, priceOverride: "" };
const emptyArea = { name: "", width: 300, height: 400, x: 0, y: 0 };

function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [images, setImages] = useState([]);
  const [printableAreas, setPrintableAreas] = useState([]);
  const [areaForm, setAreaForm] = useState(emptyArea);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  function loadProduct() {
    if (isNew) return;
    getAdminProduct(id)
      .then((p) => {
        setForm({ name: p.name, categoryId: p.category.id, description: p.description || "", basePrice: p.basePrice });
        setVariants(p.variants);
        setImages(p.images);
        setPrintableAreas(p.printableAreas || []);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProduct, [id, isNew]);

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const result = await uploadProductImage(id, file);
      setImages(result.product.images);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(imageId) {
    if (!window.confirm("Remove this image?")) return;
    setError(null);
    try {
      const product = await deleteProductImage(id, imageId);
      setImages(product.images);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove image.");
    }
  }

  async function handleSetPrimary(imageId) {
    setError(null);
    try {
      const product = await setPrimaryImage(id, imageId);
      setImages(product.images);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set primary image.");
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleVariantChange(e) {
    const { name, value } = e.target;
    setVariantForm({ ...variantForm, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const created = await createAdminProduct({
          ...form,
          basePrice: Number(form.basePrice),
          variants: [],
        });
        navigate(`/admin/products/${created.id}`);
      } else {
        await updateAdminProduct(id, { ...form, basePrice: Number(form.basePrice) });
        alert("Product updated.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddArea(e) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await upsertPrintableArea(id, {
        ...areaForm,
        width: Number(areaForm.width),
        height: Number(areaForm.height),
        x: Number(areaForm.x),
        y: Number(areaForm.y),
      });
      setPrintableAreas(updated.printableAreas);
      setAreaForm(emptyArea);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save printable area.");
    }
  }

  async function handleAdjustStock(variantId, delta) {
    setError(null);
    try {
      const updated = await adjustStock(variantId, delta, "adjustment");
      setVariants(updated.variants);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to adjust stock.");
    }
  }

  async function handleAddVariant(e) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await upsertVariant(id, {
        ...variantForm,
        stockQuantity: Number(variantForm.stockQuantity),
        priceOverride: variantForm.priceOverride ? Number(variantForm.priceOverride) : null,
      });
      setVariants(updated.variants);
      setVariantForm(emptyVariant);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save variant.");
    }
  }

  if (loading) return <p className="admin-status">Loading product...</p>;

  return (
    <div className="pf">
      <h1>{isNew ? "Add product" : "Edit product"}</h1>

      <form className="pf-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Category
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
        </label>
        <label>
          Base price
          <input name="basePrice" type="number" step="0.01" value={form.basePrice} onChange={handleChange} required />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving..." : isNew ? "Create product" : "Save changes"}
        </Button>
      </form>

      {!isNew && (
        <div className="pf-images">
          <h2>Images</h2>

          <div className="pf-image-grid">
            {images.map((img) => (
              <div key={img.id} className={`pf-image-item ${img.isPrimary ? "pf-image-item--primary" : ""}`}>
                <img src={`http://localhost:5000${img.imageUrl}`} alt="" />
                <div className="pf-image-item__actions">
                  {!img.isPrimary && (
                    <button onClick={() => handleSetPrimary(img.id)}>Set primary</button>
                  )}
                  {img.isPrimary && <span className="pf-image-item__badge">Primary</span>}
                  <button onClick={() => handleDeleteImage(img.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <label className="pf-upload-btn">
            {uploadingImage ? "Uploading..." : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>
      )}

      {!isNew && (
        <div className="pf-variants">
          <h2>Printable areas</h2>
          <p className="pf-hint">These define where customers can place designs (e.g. Front, Back). A product needs at least one before it can be customized.</p>

          {printableAreas.length > 0 && (
            <table className="dash-table">
              <thead>
                <tr><th>Name</th><th>Width</th><th>Height</th></tr>
              </thead>
              <tbody>
                {printableAreas.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.width}px</td>
                    <td>{a.height}px</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form className="pf-variant-form" onSubmit={handleAddArea}>
            <input
              placeholder="Name (e.g. Front)"
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Width"
              value={areaForm.width}
              onChange={(e) => setAreaForm({ ...areaForm, width: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Height"
              value={areaForm.height}
              onChange={(e) => setAreaForm({ ...areaForm, height: e.target.value })}
              required
            />
            <Button type="submit" variant="secondary">Add area</Button>
          </form>
        </div>
      )}

      {!isNew && (
        <div className="pf-variants">
          <h2>Variants</h2>

          {variants.length > 0 && (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Size</th>
                  <th>SKU</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td>{v.color}</td>
                    <td>{v.size}</td>
                    <td>{v.sku}</td>
                    <td>
                      <div className="pf-stock-control">
                        <button onClick={() => handleAdjustStock(v.id, -1)} disabled={v.stockQuantity <= 0}>−</button>
                        <span>{v.stockQuantity}</span>
                        <button onClick={() => handleAdjustStock(v.id, 1)}>+</button>
                        <button
                          className="pf-stock-restock"
                          onClick={() => {
                            const amount = Number(prompt("Restock quantity to add:", "10"));
                            if (amount > 0) handleAdjustStock(v.id, amount);
                          }}
                        >
                          Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form className="pf-variant-form" onSubmit={handleAddVariant}>
            <input name="color" placeholder="Color" value={variantForm.color} onChange={handleVariantChange} required />
            <input name="size" placeholder="Size" value={variantForm.size} onChange={handleVariantChange} required />
            <input name="sku" placeholder="SKU" value={variantForm.sku} onChange={handleVariantChange} required />
            <input name="stockQuantity" type="number" placeholder="Stock" value={variantForm.stockQuantity} onChange={handleVariantChange} />
            <Button type="submit" variant="secondary">Add variant</Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProductForm;