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
  uploadMockupTemplate,
  savePerspectiveConfig,
} from "../../api/admin";
import Button from "../../components/Button";
import PerspectiveEditor from "../../components/PerspectiveEditor";
import "./ProductForm.css";

const emptyProduct = { name: "", categoryId: "", description: "", basePrice: "" };
const emptyVariant = { color: "", size: "", sku: "", stockQuantity: 0, priceOverride: "" };
const emptyArea = { name: "" };
const sizeOptions = [
  { value: "XS", label: "Extra small" },
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
  { value: "L", label: "Large" },
  { value: "XL", label: "Extra large" },
  { value: "2XL", label: "2XL" },
  { value: "3XL", label: "3XL" },
  { value: "4XL", label: "4XL" },
  { value: "OS", label: "One size" },
];

function capitalizeFirstLetter(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function normalizeVariants(variants) {
  return variants.map((variant) => ({ ...variant, color: capitalizeFirstLetter(variant.color) }));
}

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
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingAreaForm, setEditingAreaForm] = useState(emptyArea);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editingVariantForm, setEditingVariantForm] = useState(emptyVariant);
  const [editingPerspectiveFor, setEditingPerspectiveFor] = useState(null);
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
        setVariants(normalizeVariants(p.variants));
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
    setVariantForm({ ...variantForm, [name]: name === "color" ? capitalizeFirstLetter(value) : value });
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

  async function handleMockupUpload(areaId, e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    try {
      const result = await uploadMockupTemplate(areaId, file);
      setPrintableAreas((prev) =>
        prev.map((a) => (a.id === areaId ? { ...a, mockupTemplate: { baseImageUrl: result.baseImageUrl } } : a))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload mockup template.");
    } finally {
      e.target.value = "";
    }
  }

  async function handleSavePerspective(points) {
    setError(null);
    try {
      const areaId = editingPerspectiveFor.id;
      const { perspectiveConfig } = await savePerspectiveConfig(areaId, points);
      setPrintableAreas((prev) =>
        prev.map((a) =>
          a.id === areaId ? { ...a, mockupTemplate: { ...a.mockupTemplate, perspectiveConfig } } : a
        )
      );
      setEditingPerspectiveFor(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save perspective corners.");
    }
  }

  async function handleAddArea(e) {
    e.preventDefault();
    setError(null);
    try {

      const updated = await upsertPrintableArea(id, { ...areaForm, width: 1000, height: 1000, x: 0, y: 0 });
      setPrintableAreas(updated.printableAreas);
      setAreaForm(emptyArea);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save printable area.");
    }
  }

  function startEditArea(area) {
    setEditingAreaId(area.id);
    setEditingAreaForm({ name: area.name });
  }

  async function saveArea(area) {
    setError(null);
    try {
      const updated = await upsertPrintableArea(id, {
        id: area.id,
        ...editingAreaForm,
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      });
      setPrintableAreas(updated.printableAreas);
      setEditingAreaId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update printable area.");
    }
  }

  async function handleAdjustStock(variantId, delta) {
    setError(null);
    try {
      const updated = await adjustStock(variantId, delta, "adjustment");
      setVariants(normalizeVariants(updated.variants));
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
      setVariants(normalizeVariants(updated.variants));
      setVariantForm(emptyVariant);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save variant.");
    }
  }

  function startEditVariant(variant) {
    setEditingVariantId(variant.id);
    setEditingVariantForm({
      color: capitalizeFirstLetter(variant.color),
      size: variant.size,
      sku: variant.sku,
      stockQuantity: variant.stockQuantity,
      priceOverride: variant.priceOverride || "",
    });
  }

  async function saveVariant(variant) {
    setError(null);
    try {
      const updated = await upsertVariant(id, {
        id: variant.id,
        ...editingVariantForm,
        color: capitalizeFirstLetter(editingVariantForm.color),
        stockQuantity: Number(editingVariantForm.stockQuantity),
        priceOverride: editingVariantForm.priceOverride ? Number(editingVariantForm.priceOverride) : null,
      });
      setVariants(normalizeVariants(updated.variants));
      setEditingVariantId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update variant.");
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
          <p className="pf-hint">
            These define where customers can place designs (e.g. Front, Back). Give it a name, then upload a
            mockup photo and trace the print area shape on it — the designer uses the photo's real size.
          </p>

          {printableAreas.length > 0 && (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr><th>Name</th><th>Mockup photo</th></tr>
                </thead>
                <tbody>
                  {printableAreas.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {editingAreaId === a.id ? (
                          <input
                            value={editingAreaForm.name}
                            onChange={(e) => setEditingAreaForm({ name: e.target.value })}
                            aria-label="Printable area name"
                          />
                        ) : a.name}
                      </td>
                      <td>
                        <div className="pf-area-actions">
                          {a.mockupTemplate ? (
                            <span className="pf-mockup-status">Uploaded ✓</span>
                          ) : (
                            <span className="pf-mockup-status pf-mockup-status--missing">None — using blank canvas</span>
                          )}
                          <label className="pf-upload-btn pf-upload-btn--small">
                            {a.mockupTemplate ? "Replace" : "Upload"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: "none" }}
                              onChange={(e) => handleMockupUpload(a.id, e)}
                            />
                          </label>
                          {a.mockupTemplate && (
                            <button
                              type="button"
                              className="pf-upload-btn pf-upload-btn--small"
                              onClick={() => setEditingPerspectiveFor(a)}
                            >
                              {a.mockupTemplate.perspectiveConfig ? "Edit print area" : "Set print area"}
                            </button>
                          )}
                          {editingAreaId === a.id ? (
                            <>
                              <button type="button" className="pf-row-action" onClick={() => saveArea(a)}>Save</button>
                              <button type="button" className="pf-row-action" onClick={() => setEditingAreaId(null)}>Cancel</button>
                            </>
                          ) : (
                            <button type="button" className="pf-row-action" onClick={() => startEditArea(a)}>Edit</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form className="pf-variant-form" onSubmit={handleAddArea}>
            <input
              placeholder="Name (e.g. Front)"
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
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
            <div className="dash-table-wrap">
              <table className="dash-table pf-variant-table">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Size</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th aria-label="Row actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td>{editingVariantId === v.id ? <input value={editingVariantForm.color} onChange={(e) => setEditingVariantForm({ ...editingVariantForm, color: e.target.value })} aria-label="Variant color" /> : v.color}</td>
                      <td>{editingVariantId === v.id ? (
                        <select value={editingVariantForm.size} onChange={(e) => setEditingVariantForm({ ...editingVariantForm, size: e.target.value })} aria-label="Variant size">
                          {!sizeOptions.some((option) => option.value === editingVariantForm.size) && (
                            <option value={editingVariantForm.size}>{editingVariantForm.size}</option>
                          )}
                          {sizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      ) : v.size}</td>
                      <td>{editingVariantId === v.id ? <input value={editingVariantForm.sku} onChange={(e) => setEditingVariantForm({ ...editingVariantForm, sku: e.target.value })} aria-label="Variant SKU" /> : v.sku}</td>
                      <td>
                        {editingVariantId === v.id ? (
                          <input name="stockQuantity" type="number" value={editingVariantForm.stockQuantity} onChange={(e) => setEditingVariantForm({ ...editingVariantForm, stockQuantity: e.target.value })} aria-label="Variant stock" />
                        ) : (
                          <div className="pf-stock-control">
                            <button type="button" onClick={() => handleAdjustStock(v.id, -1)} disabled={v.stockQuantity <= 0}>−</button>
                            <span>{v.stockQuantity}</span>
                            <button type="button" onClick={() => handleAdjustStock(v.id, 1)}>+</button>
                            <button
                              type="button"
                              className="pf-stock-restock"
                              onClick={() => {
                                const amount = Number(prompt("Restock quantity to add:", "10"));
                                if (amount > 0) handleAdjustStock(v.id, amount);
                              }}
                            >
                              Restock
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="pf-row-actions">
                          {editingVariantId === v.id ? (
                            <>
                              <button type="button" className="pf-row-action" onClick={() => saveVariant(v)}>Save</button>
                              <button type="button" className="pf-row-action" onClick={() => setEditingVariantId(null)}>Cancel</button>
                            </>
                          ) : (
                            <button type="button" className="pf-row-action" onClick={() => startEditVariant(v)}>Edit</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form className="pf-variant-form" onSubmit={handleAddVariant}>
            <input name="color" placeholder="Color" value={variantForm.color} onChange={handleVariantChange} required />
            <select name="size" value={variantForm.size} onChange={handleVariantChange} required aria-label="Variant size">
              <option value="">Size</option>
              {sizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input name="sku" placeholder="SKU" value={variantForm.sku} onChange={handleVariantChange} required />
            <input name="stockQuantity" type="number" placeholder="Stock" value={variantForm.stockQuantity} onChange={handleVariantChange} />
            <Button type="submit" variant="secondary">Add variant</Button>
          </form>
        </div>
      )}
      {editingPerspectiveFor && (
        <PerspectiveEditor
          imageUrl={`http://localhost:5000${editingPerspectiveFor.mockupTemplate.baseImageUrl}`}
          initialPoints={editingPerspectiveFor.mockupTemplate.perspectiveConfig?.points}
          onSave={handleSavePerspective}
          onCancel={() => setEditingPerspectiveFor(null)}
        />
      )}
    </div>
  );
}

export default ProductForm;