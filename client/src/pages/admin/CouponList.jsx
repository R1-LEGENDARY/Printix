import { useCallback, useEffect, useState } from "react";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../api/admin";
import Button from "../../components/Button";
import ConfirmModal from "../../components/ConfirmModal";
import "./Dashboard.css";
import "./CouponList.css";

const emptyForm = {
  code: "",
  discountType: "percent",
  value: "",
  minOrderAmount: "",
  usageLimit: "",
  usageLimitPerUser: "",
  expiresAt: "",
};

function CouponList() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listCoupons()
      .then(setCoupons)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const nextErrors = {};
    const value = Number(form.value);
    if (!form.code.trim()) nextErrors.code = "Coupon code is required.";
    if (!form.value || value <= 0) nextErrors.value = "Enter a value greater than 0.";
    if (form.discountType === "percent" && value > 100) nextErrors.value = "Percentage cannot exceed 100.";
    if (form.minOrderAmount && Number(form.minOrderAmount) < 0) nextErrors.minOrderAmount = "Amount cannot be negative.";
    if (form.usageLimit && Number(form.usageLimit) <= 0) nextErrors.usageLimit = "Limit must be greater than 0.";
    if (form.usageLimitPerUser && Number(form.usageLimitPerUser) <= 0) nextErrors.usageLimitPerUser = "Limit must be greater than 0.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setError(null);
    try {
      await createCoupon({
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create coupon.");
    }
  }

  async function handleToggle(coupon) {
    await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    load();
  }

  function askDelete(coupon) {
    setPendingDelete(coupon);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteCoupon(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete coupon.");
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <h1>Coupons</h1>

      <form className="coupon-form" onSubmit={handleCreate}>
        <div className="coupon-field">
          <input name="code" placeholder="CODE" value={form.code} onChange={handleChange} aria-invalid={Boolean(fieldErrors.code)} />
          {fieldErrors.code && <span className="coupon-field-error">{fieldErrors.code}</span>}
        </div>
        <select name="discountType" value={form.discountType} onChange={handleChange}>
          <option value="percent">% off</option>
          <option value="fixed">₱ off</option>
        </select>
        <div className="coupon-field">
          <input name="value" type="number" step="0.01" placeholder="Value" value={form.value} onChange={handleChange} aria-invalid={Boolean(fieldErrors.value)} />
          {fieldErrors.value && <span className="coupon-field-error">{fieldErrors.value}</span>}
        </div>
        <div className="coupon-field">
          <input name="minOrderAmount" type="number" step="0.01" placeholder="Min order (optional)" value={form.minOrderAmount} onChange={handleChange} aria-invalid={Boolean(fieldErrors.minOrderAmount)} />
          {fieldErrors.minOrderAmount && <span className="coupon-field-error">{fieldErrors.minOrderAmount}</span>}
        </div>
        <div className="coupon-field">
          <input name="usageLimit" type="number" placeholder="Total use limit (optional)" value={form.usageLimit} onChange={handleChange} aria-invalid={Boolean(fieldErrors.usageLimit)} />
          {fieldErrors.usageLimit && <span className="coupon-field-error">{fieldErrors.usageLimit}</span>}
        </div>
        <div className="coupon-field">
          <input name="usageLimitPerUser" type="number" placeholder="Per-user limit (optional)" value={form.usageLimitPerUser} onChange={handleChange} aria-invalid={Boolean(fieldErrors.usageLimitPerUser)} />
          {fieldErrors.usageLimitPerUser && <span className="coupon-field-error">{fieldErrors.usageLimitPerUser}</span>}
        </div>
        <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} />
        <Button type="submit" variant="primary">Create coupon</Button>
      </form>

      {error && <p className="admin-error">{error}</p>}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete coupon"
        message={pendingDelete ? `Delete coupon "${pendingDelete.code}"?` : ""}
        confirmText="Delete"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />

      {loading ? (
        <p className="admin-status">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <p className="admin-status">No coupons yet.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discountType === "percent" ? `${c.value}%` : `₱${c.value}`}</td>
                  <td>{c.minOrderAmount ? `₱${c.minOrderAmount}` : "—"}</td>
                  <td>{c.redemptionCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                  <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                  <td>
                    <span className={`status-pill ${c.isActive ? "status-pill--delivered" : "status-pill--cancelled"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="coupon-actions">
                    <button type="button" onClick={() => handleToggle(c)}>{c.isActive ? "Deactivate" : "Activate"}</button>
                    <button type="button" onClick={() => askDelete(c)}>Delete</button>
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

export default CouponList;