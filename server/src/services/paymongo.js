const PAYMONGO_API = "https://api.paymongo.com/v1";

function authHeader() {
  const key = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64");
  return { Authorization: `Basic ${key}`, "Content-Type": "application/json" };
}

async function createCheckoutSession({ orderNumber, lineItems, successUrl, cancelUrl, metadata }) {
  const res = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          description: `Printix order ${orderNumber}`,
          line_items: lineItems,
          payment_method_types: ["gcash", "card", "paymaya"],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata,
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.detail || "PayMongo checkout session creation failed.");
  }
  return json.data;
}

async function createRefund(paymentIntentOrSessionId, amountCentavos, reason) {
  const res = await fetch(`${PAYMONGO_API}/refunds`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      data: {
        attributes: {
          amount: amountCentavos,
          payment_id: paymentIntentOrSessionId,
          reason: "requested_by_customer",
          notes: reason || undefined,
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.detail || "PayMongo refund failed.");
  }
  return json.data;
}

module.exports = { createCheckoutSession, createRefund };