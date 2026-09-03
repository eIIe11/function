import type { CheckoutProvider, ProviderId } from "../../../src/lib/payments/types";
import { lemonSqueezy } from "./lemonsqueezy";
import { invoiceOnly } from "./invoice";

/**
 * Paddle, Polar and Stripe are deliberately absent rather than stubbed: an
 * adapter that exists but does not work is worse than one that is missing,
 * because the missing one fails at boot instead of at checkout.
 */
const PROVIDERS: Partial<Record<ProviderId, CheckoutProvider>> = {
  lemonsqueezy: lemonSqueezy,
  invoice: invoiceOnly,
};

export function resolveProvider(id = process.env.PAYMENT_PROVIDER): CheckoutProvider {
  if (!id) return invoiceOnly;
  const provider = PROVIDERS[id as ProviderId];
  if (!provider) {
    throw new Error(
      `PAYMENT_PROVIDER="${id}" has no adapter. Available: ${Object.keys(PROVIDERS).join(", ")}.`,
    );
  }
  return provider;
}
