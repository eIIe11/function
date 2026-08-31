import type { CheckoutProvider, CheckoutRequest, CheckoutSession } from "../../../src/lib/payments/types";
import { PublicError } from "../http";

/**
 * The default provider, and the honest one: no card processor is configured, so
 * checkout refuses rather than pretending. Corporate buyers are unaffected —
 * they never used a card (see purchase-order.ts).
 */
export const invoiceOnly: CheckoutProvider = {
  id: "invoice",
  merchantOfRecord: false,

  async createCheckout(_request: CheckoutRequest): Promise<CheckoutSession> {
    throw new PublicError(
      "Card checkout isn't live yet. Nothing was charged — email us and we'll invoice you.",
      503,
    );
  },

  async parseWebhook(): Promise<never> {
    throw new PublicError("No payment provider is configured", 503);
  },
};
