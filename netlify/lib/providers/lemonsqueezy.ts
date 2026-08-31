import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CheckoutProvider,
  CheckoutRequest,
  CheckoutSession,
  Currency,
  PaymentEvent,
} from "../../../src/lib/payments/types";
import { PublicError, requireEnv } from "../http";

/**
 * Lemon Squeezy is the merchant of record, which is the whole reason it was
 * chosen over Stripe: it registers and remits UK/EU VAT and US sales tax on our
 * behalf. Swapping it out means writing one more file in this directory and
 * changing PAYMENT_PROVIDER — nothing in `src/` moves.
 */

const API = "https://api.lemonsqueezy.com/v1";

/**
 * Plan id → Lemon Squeezy variant id, from
 * `LEMONSQUEEZY_VARIANTS="yourself-full=123456,yourself-starter=123457"`.
 * Kept in the environment because the ids differ between their test and live
 * stores, and a wrong id there must not require a deploy of the app.
 */
export function parseVariantMap(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const [planId, variantId] = trimmed.split("=");
    if (!planId || !variantId) {
      throw new Error(`LEMONSQUEEZY_VARIANTS entry "${trimmed}" is not planId=variantId.`);
    }
    map[planId.trim()] = variantId.trim();
  }
  return map;
}

type CheckoutResponse = {
  data?: { id?: string; attributes?: { url?: string } };
  errors?: { detail?: string }[];
};

export function buildCheckoutBody(args: {
  storeId: string;
  variantId: string;
  request: CheckoutRequest;
}): unknown {
  const { storeId, variantId, request } = args;
  return {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: request.email || undefined,
          /* Echoed back on the webhook. The only link between a payment and the
             order we recorded, so it is required, not optional. */
          custom: { reference: request.reference, plan_id: request.planId },
        },
        product_options: {
          redirect_url: request.returnUrl,
          receipt_button_text: "Back to FUNCTION.",
        },
        checkout_options: { embed: false },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };
}

/** Their webhook statuses, mapped onto ours. Anything unknown is `pending`. */
export function normaliseStatus(eventName: string): PaymentEvent["status"] {
  switch (eventName) {
    case "order_created":
      return "paid";
    case "order_refunded":
      return "refunded";
    case "subscription_payment_failed":
      return "failed";
    default:
      return "pending";
  }
}

export const lemonSqueezy: CheckoutProvider = {
  id: "lemonsqueezy",
  merchantOfRecord: true,

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const apiKey = requireEnv("LEMONSQUEEZY_API_KEY");
    const storeId = requireEnv("LEMONSQUEEZY_STORE_ID");
    const variants = parseVariantMap(requireEnv("LEMONSQUEEZY_VARIANTS"));
    const variantId = variants[request.planId];
    if (!variantId) {
      throw new PublicError("That plan isn't on sale yet.", 409);
    }

    const response = await fetch(`${API}/checkouts`, {
      method: "POST",
      headers: {
        accept: "application/vnd.api+json",
        "content-type": "application/vnd.api+json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildCheckoutBody({ storeId, variantId, request })),
    });

    const body = (await response.json().catch(() => ({}))) as CheckoutResponse;
    if (!response.ok || !body.data?.attributes?.url) {
      /* Their error text can quote store and variant ids, so it is logged and
         not returned. */
      console.error("lemonsqueezy checkout failed", response.status, body.errors);
      throw new PublicError("Checkout is unavailable right now. Nothing was charged.", 502);
    }

    return {
      id: body.data.id ?? request.reference,
      redirectUrl: body.data.attributes.url,
      provider: "lemonsqueezy",
    };
  },

  async parseWebhook(rawBody: string, headers: Record<string, string>): Promise<PaymentEvent> {
    const secret = requireEnv("PAYMENT_WEBHOOK_SECRET");
    const signature = headers["x-signature"] ?? "";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

    /* Throws rather than returning a `failed` event: a forged webhook must never
       be indistinguishable from a genuine declined payment. */
    const given = Buffer.from(signature, "hex");
    const want = Buffer.from(expected, "hex");
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
      throw new PublicError("Invalid signature", 401);
    }

    const payload = JSON.parse(rawBody) as {
      meta?: { event_name?: string; custom_data?: { reference?: string } };
      data?: {
        id?: string;
        attributes?: {
          total?: number;
          currency?: string;
          user_email?: string;
          created_at?: string;
        };
      };
    };

    const reference = payload.meta?.custom_data?.reference;
    if (!reference) {
      throw new PublicError("Webhook is missing the order reference", 422);
    }

    return {
      provider: "lemonsqueezy",
      providerEventId: payload.data?.id ?? reference,
      reference,
      status: normaliseStatus(payload.meta?.event_name ?? ""),
      amount: payload.data?.attributes?.total ?? 0,
      currency: (payload.data?.attributes?.currency as Currency) ?? "GBP",
      email: payload.data?.attributes?.user_email ?? "",
      occurredAt: payload.data?.attributes?.created_at ?? new Date().toISOString(),
    };
  },
};
