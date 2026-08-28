import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/Button";
import "./OrderConfirmation.css";

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    api
      .get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrder(res.data.find((o) => o.id === id)))
      .catch(() => setOrder(null));
  }, [id]);

  if (!order) return <p className="oc-status">Loading order...</p>;

  return (
    <div className="oc">
      <h2>Thank you for your order!</h2>
      <p className="oc__number">Order #{order.orderNumber}</p>
      <p className="oc__status">Status: {order.status}</p>

      <div className="oc__items">
        {order.items.map((item) => (
          <div className="oc__item" key={item.id}>
            <span>{item.productName} ({item.variantLabel}) × {item.quantity}</span>
            <span>${item.lineTotal}</span>
          </div>
        ))}
      </div>

      <div className="oc__total">
        <span>Total</span>
        <span>${order.grandTotal}</span>
      </div>

      <Link to="/catalog">
        <Button variant="primary">Continue shopping</Button>
      </Link>
    </div>
  );
}

export default OrderConfirmation;