import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import Button from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import { mediaUrl } from "../utils/mediaUrl";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, remove } = useCart();
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  const [checkoutConfirmationOpen, setCheckoutConfirmationOpen] =
    useState(false);

  async function confirmRemove() {
    if (!pendingRemoveId) return;
    await remove(pendingRemoveId);
    setPendingRemoveId(null);
  }

  function proceedToCheckout() {
    if (cart.items.some((item) => !item.designId)) {
      setCheckoutConfirmationOpen(true);
      return;
    }
    navigate("/checkout");
  }

  function customizeFirstUndesignedItem() {
    const item = cart.items.find((cartItem) => !cartItem.designId);
    if (!item) return;
    setCheckoutConfirmationOpen(false);
    navigate(`/design/${item.variant.product.slug}?variant=${item.variant.id}`);
  }

  if (loading) return <p className="cart-status">Loading cart...</p>;

  if (cart.items.length === 0) {
    return (
      <div className="cart cart--empty">
        <h2>Your cart is empty</h2>
        <p>Find something you'd like to customize.</p>
        <Link to="/catalog">
          <Button variant="primary" className="btn--browse-products">
            Browse products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <ConfirmModal
        open={Boolean(pendingRemoveId)}
        title="Remove item"
        message="Remove this item from your cart?"
        confirmText="Remove"
        destructive
        onConfirm={confirmRemove}
        onClose={() => setPendingRemoveId(null)}
      />

      <ConfirmModal
        open={checkoutConfirmationOpen}
        title="Continue without a design?"
        message="You can customize this product first, or continue and purchase it without a custom design."
        cancelText="Customize"
        confirmText="Continue"
        onCancel={customizeFirstUndesignedItem}
        onConfirm={() => {
          setCheckoutConfirmationOpen(false);
          navigate("/checkout");
        }}
        onClose={() => setCheckoutConfirmationOpen(false)}
      />

      <h2>Your cart</h2>

      <div className="cart-list">
        {cart.items.map((item) => (
          <article className="cart-item" key={item.id}>
            <div className="cart-item__image">
              {item.mockupUrl ? (
                <img
                  src={mediaUrl(item.mockupUrl)}
                  alt={`${item.variant.product.name} custom design`}
                />
              ) : (
                item.variant.product.image && (
                  <img
                    src={mediaUrl(item.variant.product.image)}
                    alt={item.variant.product.name}
                  />
                )
              )}
            </div>

            <div className="cart-item__info">
              <h3>{item.variant.product.name}</h3>
              <p className="cart-item__variant">
                {item.variant.color} / {item.variant.size}
                {item.designId && " — Custom design"}
              </p>
              <p className="cart-item__price">₱{item.unitPrice}</p>
            </div>

            <div className="cart-item__qty">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.variant.stockQuantity}
              >
                +
              </button>
            </div>

            <p className="cart-item__total">₱{item.lineTotal}</p>

            <button
              className="cart-item__remove"
              onClick={() => setPendingRemoveId(item.id)}
            >
              Remove
            </button>
          </article>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Subtotal</span>
          <span>₱{cart.subtotal}</span>
        </div>
        <p className="cart-summary__note">
          Shipping and taxes calculated at checkout.
        </p>
        <Button
          variant="primary"
          className="btn--block"
          onClick={proceedToCheckout}
        >
          Proceed to checkout
        </Button>
      </div>
    </div>
  );
}

export default Cart;
