// Thin wrapper around Cashfree Checkout (https://docs.cashfree.com/docs/web-integration).
// The script is loaded on demand so it never touches demo mode or SSR.

interface CashfreeInstance {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_modal";
  }) => Promise<{ error?: { message?: string }; paymentDetails?: unknown }>;
}

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

const SCRIPT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Cashfree Checkout in a modal. Resolves once the payment succeeds on
 * the client; rejects if the user closes it or the payment fails. Coins are
 * only ever credited by the server webhook, never from this result.
 */
export async function openCashfreeCheckout(order: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
}): Promise<void> {
  if (!(await loadScript()) || !window.Cashfree) {
    throw new Error("Couldn't load the payment window. Check your connection and try again.");
  }
  const cashfree = window.Cashfree({ mode: order.mode });
  const result = await cashfree.checkout({
    paymentSessionId: order.paymentSessionId,
    redirectTarget: "_modal",
  });
  if (result.error) {
    throw new Error(result.error.message ?? "Payment cancelled.");
  }
  if (!result.paymentDetails) {
    throw new Error("Payment cancelled.");
  }
}
