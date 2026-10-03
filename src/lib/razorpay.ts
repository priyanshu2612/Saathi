// Thin wrapper around Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
// The script is loaded on demand so it never touches demo mode or SSR.

interface CheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { contact?: string };
  theme?: { color: string };
  handler: () => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => {
      open: () => void;
      on: (event: "payment.failed", cb: (res: { error?: { description?: string } }) => void) => void;
    };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay Checkout for an order. Resolves once the payment succeeds
 * on the client; rejects if the user closes it or the payment fails. Coins
 * are only ever credited by the server webhook, never from this result.
 */
export async function openRazorpayCheckout(order: {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
  contact?: string;
}): Promise<void> {
  if (!(await loadScript()) || !window.Razorpay) {
    throw new Error("Couldn't load the payment window. Check your connection and try again.");
  }
  const Razorpay = window.Razorpay;
  return new Promise<void>((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Sukoon",
      description: order.description,
      prefill: { contact: order.contact },
      theme: { color: "#E8734A" },
      handler: () => resolve(),
      modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
    });
    checkout.on("payment.failed", (res) =>
      reject(new Error(res.error?.description ?? "The payment didn't go through."))
    );
    checkout.open();
  });
}
