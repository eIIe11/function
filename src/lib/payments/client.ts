import type { CheckoutRequest, CheckoutSession, PurchaseOrder } from "./types";

/**
 * The client half of checkout. It knows one endpoint and nothing about providers,
 * keys or webhooks — swapping Lemon Squeezy for Paddle changes no file in `src/`.
 */
export async function startCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Checkout failed (${response.status})`);
  }
  return (await response.json()) as CheckoutSession;
}

export type PurchaseOrderRequest = Omit<PurchaseOrder, "reference" | "status" | "amount"> & {
  amount?: number;
};

/** §14.2 Corporate route: no card, an invoice and a bank transfer. */
export async function requestPurchaseOrder(
  request: PurchaseOrderRequest,
): Promise<{ reference: string }> {
  const response = await fetch("/api/purchase-order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Could not submit the request (${response.status})`);
  }
  return (await response.json()) as { reference: string };
}
