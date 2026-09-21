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
import ConfirmModal from "../../components/ConfirmModal";
import PerspectiveEditor from "../../components/PerspectiveEditor";
import { mediaUrl } from "../../utils/mediaUrl";
import "./ProductForm.css";

const emptyProduct = {
  name: "",
  categoryId: "",
  description: "",
  basePrice: "",
};
const emptyVariant = {
  color: "",
  size: "",
  customSize: "",
  sku: "",
  stockQuantity: 0,
  priceOverride: "",
};
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
const otherSizeValue = "__OTHER__";

function capitalizeFirstLetter(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function normalizeVariants(variants) {
  return variants.map((variant) => ({
    ...variant,
    color: capitalizeFirstLetter(variant.color),
  }));
}

function getSizeSelection(size) {
  return sizeOptions.some((option) => option.value === size)
    ? { size, customSize: "" }
    : { size: otherSizeValue, customSize: size || "" };
}

function getVariantSize(form) {
  return form.size === otherSizeValue ? form.customSize.trim() : form.size;
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingImageDelete, setPendingImageDelete] = useState(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  function loadProduct() {
    if (isNew) return;
    getAdminProduct(id)
      .then((p) => {
        setForm({
          name: p.name,
          categoryId: p.category.id,
          description: p.description || "",
          basePrice: p.basePrice,
        });
        setVariants(normalizeVariants(p.variants));
        setImages(Array.isArray(p.images) ? p.images : []);
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
      setImages(
        Array.isArray(result.product?.images) ? result.product.images : [],
      );
      loadProduct();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function askDeleteImage(imageId) {
    setPendingImageDelete(imageId);
  }

  async function confirmDeleteImage() {
    if (!pendingImageDelete) return;
    setError(null);
    try {
      const product = await deleteProductImage(id, pendingImageDelete);
      setImages(product.images);
      setPendingImageDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove image.");
      setPendingImageDelete(null);
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
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: "" });
  }

  function handleVariantChange(e) {
    const { name, value } = e.target;
    setVariantForm({
      ...variantForm,
      [name]: name === "color" ? capitalizeFirstLetter(value) : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Product name is required.";
    if (!form.categoryId) nextErrors.categoryId = "Choose a category.";
    if (!form.basePrice || Number(form.basePrice) <= 0)
      nextErrors.basePrice = "Enter a price greater than 0.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      if (isNew) {
        const created = await createAdminProduct({
          ...form,
          basePrice: Number(form.basePrice),
          variants: [],
        });
        navigate(`/admin/products/${created.id}`);
      } else {
        await updateAdminProduct(id, {
          ...form,
          basePrice: Number(form.basePrice),
        });
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMockupUpload(areaId, e, variantId) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    try {
      const result = await uploadMockupTemplate(areaId, file, variantId);
      setPrintableAreas((prev) =>
        prev.map((a) => {
          if (a.id !== areaId) return a;
          if (!variantId) return { ...a, mockupTemplate: result };
          const templates = (a.mockupTemplates || []).filter(
            (template) => template.variantId !== variantId,
          );
          return { ...a, mockupTemplates: [...templates, result] };
        }),
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload mockup template.",
      );
    } finally {
      e.target.value = "";
    }
  }

  async function handleSavePerspective(points) {
    setError(null);
    try {
      const areaId = editingPerspectiveFor.id;
      const variantId = editingPerspectiveFor.mockupVariantId || null;
      const { perspectiveConfig } = await savePerspectiveConfig(
        areaId,
        points,
        variantId,
      );
      setPrintableAreas((prev) =>
        prev.map((a) =>
          a.id === areaId
            ? variantId
              ? {
                  ...a,
                  mockupTemplates: (a.mockupTemplates || []).map((template) =>
                    template.variantId === variantId
                      ? { ...template, perspectiveConfig }
                      : template,
                  ),
                }
              : {
                  ...a,
                  mockupTemplate: { ...a.mockupTemplate, perspectiveConfig },
                }
            : a,
        ),
      );
      setEditingPerspectiveFor(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save perspective corners.",
      );
    }
  }

  async function handleAddArea(e) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await upsertPrintableArea(id, {
        ...areaForm,
        width: 1000,
        height: 1000,
        x: 0,
        y: 0,
      });
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
      setError(
        err.response?.data?.message || "Failed to update printable area.",
      );
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
    const size = getVariantSize(variantForm);
    if (!size) {
      setError("Choose a size or enter a custom size.");
      return;
    }
    try {
      const updated = await upsertVariant(id, {
        ...variantForm,
        size,
        stockQuantity: Number(variantForm.stockQuantity),
        priceOverride: variantForm.priceOverride
          ? Number(variantForm.priceOverride)
          : null,
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
      ...getSizeSelection(variant.size),
      sku: variant.sku,
      stockQuantity: variant.stockQuantity,
      priceOverride: variant.priceOverride || "",
    });
  }

  async function saveVariant(variant) {
    setError(null);
    const size = getVariantSize(editingVariantForm);
    if (!size) {
      setError("Choose a size or enter a custom size.");
      return;
    }
    try {
      const updated = await upsertVariant(id, {
        id: variant.id,
        ...editingVariantForm,
        size,
        color: capitalizeFirstLetter(editingVariantForm.color),
        stockQuantity: Number(editingVariantForm.stockQuantity),
        priceOverride: editingVariantForm.priceOverride
          ? Number(editingVariantForm.priceOverride)
          : null,
      });
      setVariants(normalizeVariants(updated.variants));
      setEditingVariantId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update variant.");
    }
  }

  const usesExactVariantMockups = variants.some(
    (variant) => !sizeOptions.some((option) => option.value === variant.size),
  );

  if (loading) return <p className="admin-status">Loading product...</p>;

  return (
    <div className="product-form">
      <h1>{isNew ? "Add product" : "Edit product"}</h1>

      <form className="product-form-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name && (
            <span className="product-form-field-error">{fieldErrors.name}</span>
          )}
        </label>
        <label>
          Category
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.categoryId)}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId && (
            <span className="product-form-field-error">
              {fieldErrors.categoryId}
            </span>
          )}
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
          />
        </label>
        <label>
          Base price
          <input
            name="basePrice"
            type="number"
            step="0.01"
            value={form.basePrice}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.basePrice)}
          />
          {fieldErrors.basePrice && (
            <span className="product-form-field-error">
              {fieldErrors.basePrice}
            </span>
          )}
        </label>

        {error && <p className="admin-error">{error}</p>}

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving..." : isNew ? "Create product" : "Save changes"}
        </Button>
      </form>

      {!isNew && (
        <div className="product-form-images">
          <h2>Images</h2>

          <div className="product-form-image-grid">
            {images.map((img) => (
              <div
                key={img.id}
                className={`product-form-image-item ${img.isPrimary ? "product-form-image-item--primary" : ""}`}
              >
                <img
                  src={mediaUrl(img.imageUrl)}
                  alt={`${form.name || "Product"} image`}
                />
                <div className="product-form-image-item__actions">
                  {!img.isPrimary && (
                    <button onClick={() => handleSetPrimary(img.id)}>
                      Set primary
                    </button>
                  )}
                  {img.isPrimary && (
                    <span className="product-form-image-item__badge">
                      Primary
                    </span>
                  )}
                  <button onClick={() => askDeleteImage(img.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          {images.length === 0 && (
            <p className="product-form-image-empty">No images uploaded yet.</p>
          )}

          <label className="product-form-upload-btn">
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
        <div className="product-form-variants">
          <h2>Printable areas</h2>
          <p className="product-form-hint">
            These define where customers can place designs (e.g. Front, Back).
            Give it a name, then upload a mockup photo and trace the print area
            shape on it — the designer uses the photo's real size.
          </p>

          {printableAreas.length > 0 && (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Variant</th>
                    <th>Mockup photo</th>
                  </tr>
                </thead>
                <tbody>
                  {printableAreas.flatMap((a) => {
                    const mockupRows = usesExactVariantMockups
                      ? variants.map((variant) => ({
                          variant,
                          label: `${variant.color} / ${variant.size}`,
                        }))
                      : [
                          ...new Set(variants.map((variant) => variant.color)),
                        ].map((color) => ({
                          variant: variants.find(
                            (variant) => variant.color === color,
                          ),
                          label: color,
                        }));

                    return mockupRows.map(
                      ({ variant, label }, variantIndex) => {
                        const variantId = variant.id;
                        const template = a.mockupTemplates?.find(
                          (item) => item.variantId === variantId,
                        );
                        return (
                          <tr key={`${a.id}-${variantId}`}>
                            <td>
                              {variantIndex === 0 && editingAreaId === a.id ? (
                                <input
                                  value={editingAreaForm.name}
                                  onChange={(e) =>
                                    setEditingAreaForm({ name: e.target.value })
                                  }
                                  aria-label="Printable area name"
                                />
                              ) : variantIndex === 0 ? (
                                a.name
                              ) : (
                                ""
                              )}
                            </td>
                            <td>{label}</td>
                            <td>
                              <div className="product-form-area-actions">
                                {template ? (
                                  <span className="product-form-mockup-status">
                                    Uploaded ✓
                                  </span>
                                ) : (
                                  <span className="product-form-mockup-status product-form-mockup-status--missing">
                                    None — using blank canvas
                                  </span>
                                )}
                                <div className="product-form-file-control">
                                  <label className="product-form-file-picker">
                                    <span>
                                      {template ? "Replace" : "Upload"}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      className="product-form-upload-input"
                                      onChange={(e) =>
                                        handleMockupUpload(a.id, e, variantId)
                                      }
                                    />
                                  </label>
                                  {!template && (
                                    <span className="product-form-file-name">
                                      No file uploaded
                                    </span>
                                  )}
                                </div>
                                {template && (
                                  <button
                                    type="button"
                                    className="product-form-upload-btn product-form-upload-btn--small"
                                    onClick={() =>
                                      setEditingPerspectiveFor({
                                        ...a,
                                        mockupTemplate: template,
                                        mockupVariantId: variantId,
                                      })
                                    }
                                  >
                                    {template.perspectiveConfig
                                      ? "Edit print area"
                                      : "Set print area"}
                                  </button>
                                )}
                                {variantIndex === 0 &&
                                  (editingAreaId === a.id ? (
                                    <>
                                      <button
                                        type="button"
                                        className="product-form-row-action"
                                        onClick={() => saveArea(a)}
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        className="product-form-row-action"
                                        onClick={() => setEditingAreaId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      className="product-form-row-action"
                                      onClick={() => startEditArea(a)}
                                    >
                                      Edit
                                    </button>
                                  ))}
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <form className="product-form-variant-form" onSubmit={handleAddArea}>
            <input
              className="product-form-area-name-input"
              placeholder="Name (e.g. Front)"
              value={areaForm.name}
              onChange={(e) =>
                setAreaForm({ ...areaForm, name: e.target.value })
              }
              required
            />
            <Button type="submit" variant="secondary">
              Add area
            </Button>
          </form>
        </div>
      )}

      {!isNew && (
        <div className="product-form-variants">
          <h2>Variants</h2>

          {variants.length > 0 && (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table product-form-variant-table">
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
                      <td>
                        {editingVariantId === v.id ? (
                          <input
                            value={editingVariantForm.color}
                            onChange={(e) =>
                              setEditingVariantForm({
                                ...editingVariantForm,
                                color: e.target.value,
                              })
                            }
                            aria-label="Variant color"
                          />
                        ) : (
                          v.color
                        )}
                      </td>
                      <td>
                        {editingVariantId === v.id ? (
                          <div className="product-form-variant-size-editor">
                            <select
                              value={editingVariantForm.size}
                              onChange={(e) =>
                                setEditingVariantForm({
                                  ...editingVariantForm,
                                  size: e.target.value,
                                })
                              }
                              aria-label="Variant size"
                            >
                              <option value="">Size</option>
                              {sizeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                              <option value={otherSizeValue}>Other</option>
                            </select>
                            {editingVariantForm.size === otherSizeValue && (
                              <input
                                value={editingVariantForm.customSize}
                                onChange={(e) =>
                                  setEditingVariantForm({
                                    ...editingVariantForm,
                                    customSize: e.target.value,
                                  })
                                }
                                placeholder="Custom size (e.g. iPhone 15 Pro Max)"
                                aria-label="Custom variant size"
                                required
                              />
                            )}
                          </div>
                        ) : (
                          v.size
                        )}
                      </td>
                      <td>
                        {editingVariantId === v.id ? (
                          <input
                            value={editingVariantForm.sku}
                            onChange={(e) =>
                              setEditingVariantForm({
                                ...editingVariantForm,
                                sku: e.target.value,
                              })
                            }
                            aria-label="Variant SKU"
                          />
                        ) : (
                          v.sku
                        )}
                      </td>
                      <td>
                        {editingVariantId === v.id ? (
                          <input
                            name="stockQuantity"
                            type="number"
                            value={editingVariantForm.stockQuantity}
                            onChange={(e) =>
                              setEditingVariantForm({
                                ...editingVariantForm,
                                stockQuantity: e.target.value,
                              })
                            }
                            aria-label="Variant stock"
                          />
                        ) : (
                          <div className="product-form-stock-control">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(v.id, -1)}
                              disabled={v.stockQuantity <= 0}
                            >
                              −
                            </button>
                            <span>{v.stockQuantity}</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(v.id, 1)}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="product-form-stock-restock"
                              onClick={() => {
                                const amount = Number(
                                  prompt("Restock quantity to add:", "10"),
                                );
                                if (amount > 0) handleAdjustStock(v.id, amount);
                              }}
                            >
                              Restock
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="product-form-row-actions">
                          {editingVariantId === v.id ? (
                            <>
                              <button
                                type="button"
                                className="product-form-row-action"
                                onClick={() => saveVariant(v)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="product-form-row-action"
                                onClick={() => setEditingVariantId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="product-form-row-action"
                              onClick={() => startEditVariant(v)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form
            className="product-form-variant-form"
            onSubmit={handleAddVariant}
          >
            <input
              name="color"
              placeholder="Color"
              value={variantForm.color}
              onChange={handleVariantChange}
              required
            />
            <select
              name="size"
              value={variantForm.size}
              onChange={handleVariantChange}
              required
              aria-label="Variant size"
            >
              <option value="">Size</option>
              {sizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value={otherSizeValue}>Other</option>
            </select>
            {variantForm.size === otherSizeValue && (
              <input
                name="customSize"
                placeholder="Custom size (e.g. iPhone 15 Pro Max)"
                value={variantForm.customSize}
                onChange={handleVariantChange}
                required
              />
            )}
            <input
              name="sku"
              placeholder="SKU"
              value={variantForm.sku}
              onChange={handleVariantChange}
              required
            />
            <input
              name="stockQuantity"
              type="number"
              placeholder="Stock"
              value={variantForm.stockQuantity}
              onChange={handleVariantChange}
            />
            <Button type="submit" variant="secondary">
              Add variant
            </Button>
          </form>
        </div>
      )}
      {editingPerspectiveFor && (
        <PerspectiveEditor
          imageUrl={mediaUrl(editingPerspectiveFor.mockupTemplate.baseImageUrl)}
          initialPoints={
            editingPerspectiveFor.mockupTemplate.perspectiveConfig?.points
          }
          onSave={handleSavePerspective}
          onCancel={() => setEditingPerspectiveFor(null)}
        />
      )}

      <ConfirmModal
        open={Boolean(pendingImageDelete)}
        title="Remove product image?"
        message="This image will be removed from the product gallery."
        confirmText="Remove image"
        onConfirm={confirmDeleteImage}
        onClose={() => setPendingImageDelete(null)}
        destructive
      />
    </div>
  );
}

export default ProductForm;
