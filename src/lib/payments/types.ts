/**
 * §14 Provider-agnostic checkout.
 *
 * Nothing in the UI or the domain knows which processor is in use. A provider
 * implements `CheckoutProvider`, is registered in `providers.ts`, and the client
 * only ever receives a redirect URL — keys and webhook secrets stay in the
 * serverless function (see docs/ENV.md).
 */

export type Currency = "GBP" | "USD" | "EUR" | "AUD";

export type Audience = "individual" | "corporate";

/** Buy-once, not a subscription. §14.1 */
export type Plan = {
  id: string;
  audience: Audience;
  name: string;
  /** Minor units, so 14900 is £149.00. Avoids float arithmetic on money. */
  amount: number;
  currency: Currency;
  /** null for bespoke corporate pricing. */
  seats: number | null;
  includes: string[];
  certificate: boolean;
};

export type CheckoutRequest = {
  planId: string;
  /** Seats requested for corporate plans; ignored for individual plans. */
  seats?: number;
  email: string;
  /** Where the provider returns the buyer to. Absolute URL. */
  returnUrl: string;
  /** Echoed back on the webhook so an order can be reconciled. */
  reference: string;
};

export type CheckoutSession = {
  /** Provider-side id, stored against the order for reconciliation. */
  id: string;
  /** The only thing the client is allowed to act on. */
  redirectUrl: string;
  provider: ProviderId;
};

export type ProviderId = "lemonsqueezy" | "paddle" | "polar" | "stripe" | "invoice";

/** A normalised, provider-independent record of money having arrived. */
export type PaymentEvent = {
  provider: ProviderId;
  providerEventId: string;
  reference: string;
  status: "paid" | "refunded" | "failed" | "pending";
  amount: number;
  currency: Currency;
  email: string;
  occurredAt: string;
};

export interface CheckoutProvider {
  readonly id: ProviderId;
  /** True when the provider is the merchant of record and handles VAT for us. */
  readonly merchantOfRecord: boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /**
   * Verifies the signature and normalises the body. Implementations must throw
   * on an unverified payload rather than returning a `failed` event, so a forged
   * webhook can never be mistaken for a real declined payment.
   */
  parseWebhook(rawBody: string, headers: Record<string, string>): Promise<PaymentEvent>;
}

/** §14.2 Corporate purchases that never touch a card. */
export type PurchaseOrder = {
  reference: string;
  organisation: string;
  contactName: string;
  contactEmail: string;
  seats: number;
  poNumber: string | null;
  billingAddress: string;
  vatNumber: string | null;
  cohortStart: string | null;
  notes: string | null;
  amount: number;
  currency: Currency;
  status: "requested" | "invoiced" | "paid" | "cancelled";
};
