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
    throw new Error(await messageFrom(response));
  }
  return (await response.json()) as CheckoutSession;
}

/**
 * The functions return `{ error }` with copy written for the buyer, so it is
 * shown as-is. A status code on its own tells them nothing they can act on.
 */
async function messageFrom(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (body?.error) return body.error;
  if (response.status === 404) {
    return "Checkout isn't deployed yet. Nothing was charged.";
  }
  return "Something went wrong. Nothing was charged.";
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
    throw new Error(await messageFrom(response));
  }
  return (await response.json()) as { reference: string };
}
