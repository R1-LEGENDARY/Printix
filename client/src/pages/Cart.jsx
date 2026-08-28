import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Button from "../components/Button";
import "./Cart.css";

function Cart() {
  const { cart, loading, updateQuantity, remove } = useCart();

  if (loading) return <p className="cart-status">Loading cart...</p>;

  if (cart.items.length === 0) {
    return (
      <div className="cart cart--empty">
        <h2>Your cart is empty</h2>
        <p>Find something you'd like to customize.</p>
        <Link to="/catalog">
          <Button variant="primary">Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <h2>Your cart</h2>

      <div className="cart-list">
        {cart.items.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item__image">
              {item.variant.product.image && (
                <img src={item.variant.product.image} alt={item.variant.product.name} />
              )}
            </div>

            <div className="cart-item__info">
              <h3>{item.variant.product.name}</h3>
              <p className="cart-item__variant">
                {item.variant.color} / {item.variant.size}
                {item.designId && " — Custom design"}
              </p>
              <p className="cart-item__price">${item.unitPrice}</p>
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

            <p className="cart-item__total">${item.lineTotal}</p>

            <button className="cart-item__remove" onClick={() => remove(item.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Subtotal</span>
          <span>${cart.subtotal}</span>
        </div>
        <p className="cart-summary__note">Shipping and taxes calculated at checkout.</p>
        <Link to="/checkout">
          <Button variant="primary" className="btn--block">
            Proceed to checkout
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Cart;