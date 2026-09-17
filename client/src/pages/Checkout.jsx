import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAddresses, createAddress, placeOrder, previewCoupon } from "../api/checkout";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import Button from "../components/Button";
import "./Checkout.css";

const emptyForm = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

function Checkout() {
  const { cart, refresh } = useCart();
  const { previewingAsCustomer } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchAddresses()
      .then((data) => {
        setAddresses(data);
        const defaultAddr = data.find((a) => a.isDefault) || data[0];
        if (defaultAddr) setSelectedId(defaultAddr.id);
        else setShowForm(true);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleAddAddress(e) {
    e.preventDefault();
    setError(null);
    try {
      const newAddr = await createAddress(form);
      setAddresses([newAddr, ...addresses]);
      setSelectedId(newAddr.id);
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save address.");
    }
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const { discountAmount } = await previewCoupon(couponInput.trim(), Number(cart.subtotal));
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discountAmount });
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon.");
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handlePlaceOrder() {
    if (previewingAsCustomer) {
      setError("You're in customer preview mode — checkout is disabled. Exit preview to place a real order.");
      return;
    }
    if (!selectedId) {
      setError("Please select or add a shipping address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const order = await placeOrder(selectedId, selectedId, appliedCoupon?.code);
      await refresh();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="checkout-status">Loading checkout...</p>;

  const shippingEstimate = 5.0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const grandTotal = (Number(cart.subtotal) - discountAmount + shippingEstimate).toFixed(2);

  return (
    <div className="checkout">
      <div className="checkout__main">
        <h2>Checkout</h2>

        <section className="checkout__section">
          <h3>Shipping address</h3>

          {addresses.length > 0 && !showForm && (
            <div className="checkout__addresses">
              {addresses.map((addr) => (
                <label key={addr.id} className="checkout__address-option">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === addr.id}
                    onChange={() => setSelectedId(addr.id)}
                  />
                  <div>
                    <strong>{addr.fullName}</strong>
                    <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p>{addr.city}, {addr.province} {addr.postalCode}</p>
                    <p>{addr.country} — {addr.phone}</p>
                  </div>
                </label>
              ))}
              <button className="checkout__link-btn" onClick={() => setShowForm(true)}>
                + Add a new address
              </button>
            </div>
          )}

          {showForm && (
            <form className="checkout__form" onSubmit={handleAddAddress}>
              <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleFormChange} required />
              <input name="phone" placeholder="Phone" value={form.phone} onChange={handleFormChange} required />
              <input name="line1" placeholder="Address line 1" value={form.line1} onChange={handleFormChange} required />
              <input name="line2" placeholder="Address line 2 (optional)" value={form.line2} onChange={handleFormChange} />
              <div className="checkout__form-row">
                <input name="city" placeholder="City" value={form.city} onChange={handleFormChange} required />
                <input name="province" placeholder="Province/State" value={form.province} onChange={handleFormChange} required />
              </div>
              <div className="checkout__form-row">
                <input name="postalCode" placeholder="Postal code" value={form.postalCode} onChange={handleFormChange} required />
                <input name="country" placeholder="Country" value={form.country} onChange={handleFormChange} required />
              </div>
              <label className="checkout__checkbox">
                <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleFormChange} />
                Set as default address
              </label>
              <div className="checkout__form-actions">
                <Button type="submit" variant="primary">Save address</Button>
                {addresses.length > 0 && (
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </section>

        {error && <p className="checkout-error">{error}</p>}
      </div>

      <div className="checkout__summary">
        <h3>Order summary</h3>
        {cart.items.map((item) => (
          <div className="checkout__summary-item" key={item.id}>
            <span>{item.variant.product.name} × {item.quantity}</span>
            <span>₱{item.lineTotal}</span>
          </div>
        ))}
        <div className="checkout__summary-row">
          <span>Subtotal</span>
          <span>₱{cart.subtotal}</span>
        </div>
        <div className="checkout__coupon">
          {appliedCoupon ? (
            <div className="checkout__coupon-applied">
              <span>Coupon <strong>{appliedCoupon.code}</strong> applied</span>
              <button onClick={handleRemoveCoupon}>Remove</button>
            </div>
          ) : (
            <div className="checkout__coupon-input">
              <input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
              <Button variant="secondary" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                {applyingCoupon ? "Checking..." : "Apply"}
              </Button>
            </div>
          )}
          {couponError && <p className="checkout-error">{couponError}</p>}
        </div>

        {discountAmount > 0 && (
          <div className="checkout__summary-row">
            <span>Discount</span>
            <span>−₱{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="checkout__summary-row">
          <span>Shipping</span>
          <span>₱{shippingEstimate.toFixed(2)}</span>
        </div>
        <div className="checkout__summary-row checkout__summary-row--total">
          <span>Total</span>
          <span>₱{grandTotal}</span>
        </div>

        <Button
          variant="primary"
          className="btn--block"
          disabled={submitting || cart.items.length === 0}
          onClick={handlePlaceOrder}
        >
          {submitting ? "Placing order..." : "Place order"}
        </Button>
        <p className="checkout__note">Payment isn't collected yet — this creates a pending order.</p>
      </div>
    </div>
  );
}

export default Checkout;