import { createHmac } from "node:crypto";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { buildCheckoutBody, lemonSqueezy, normaliseStatus, parseVariantMap } from "./lemonsqueezy";
import { resolveProvider } from "./index";

describe("parseVariantMap", () => {
  it("reads planId=variantId pairs and ignores padding", () => {
    expect(parseVariantMap(" yourself-full=1 , yourself-starter=2 ,")).toEqual({
      "yourself-full": "1",
      "yourself-starter": "2",
    });
  });

  it("refuses a malformed entry rather than silently dropping a plan", () => {
    expect(() => parseVariantMap("yourself-full")).toThrow(/planId=variantId/);
  });
});

describe("buildCheckoutBody", () => {
  const request = {
    planId: "yourself-full",
    email: "buyer@example.com",
    returnUrl: "https://function.example/membership/thanks",
    reference: "ref-12345678",
  };

  it("carries the reference so the webhook can be reconciled", () => {
    const body = buildCheckoutBody({ storeId: "9", variantId: "42", request }) as {
      data: { attributes: { checkout_data: { custom: unknown } } };
    };
    expect(body.data.attributes.checkout_data.custom).toEqual({
      reference: "ref-12345678",
      plan_id: "yourself-full",
    });
  });

  it("omits an empty email instead of sending a blank string", () => {
    const body = buildCheckoutBody({
      storeId: "9",
      variantId: "42",
      request: { ...request, email: "" },
    }) as { data: { attributes: { checkout_data: { email?: string } } } };
    expect(body.data.attributes.checkout_data.email).toBeUndefined();
  });
});

describe("normaliseStatus", () => {
  it("maps their event names onto ours and treats the unknown as pending", () => {
    expect(normaliseStatus("order_created")).toBe("paid");
    expect(normaliseStatus("order_refunded")).toBe("refunded");
    expect(normaliseStatus("something_new_they_added")).toBe("pending");
  });
});

describe("parseWebhook", () => {
  const secret = "test-signing-secret";
  const payload = JSON.stringify({
    meta: { event_name: "order_created", custom_data: { reference: "ref-12345678" } },
    data: {
      id: "ord_1",
      attributes: {
        total: 14900,
        currency: "GBP",
        user_email: "buyer@example.com",
        created_at: "2026-01-01T00:00:00Z",
      },
    },
  });

  function sign(body: string, key = secret): string {
    return createHmac("sha256", key).update(body).digest("hex");
  }

  beforeEach(() => {
    process.env.PAYMENT_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    delete process.env.PAYMENT_PROVIDER;
  });

  it("normalises a correctly signed payload", async () => {
    const event = await lemonSqueezy.parseWebhook(payload, { "x-signature": sign(payload) });
    expect(event).toMatchObject({
      provider: "lemonsqueezy",
      reference: "ref-12345678",
      status: "paid",
      amount: 14900,
      currency: "GBP",
    });
  });

  it("throws on a forged signature rather than reporting a failed payment", async () => {
    await expect(
      lemonSqueezy.parseWebhook(payload, { "x-signature": sign(payload, "wrong-secret") }),
    ).rejects.toThrow(/Invalid signature/);
  });

  it("throws when the signature header is absent", async () => {
    await expect(lemonSqueezy.parseWebhook(payload, {})).rejects.toThrow(/Invalid signature/);
  });

  it("rejects a payload that has been tampered with after signing", async () => {
    const signature = sign(payload);
    const tampered = payload.replace("14900", "100");
    await expect(
      lemonSqueezy.parseWebhook(tampered, { "x-signature": signature }),
    ).rejects.toThrow(/Invalid signature/);
  });

  it("refuses a signed payload with no order reference", async () => {
    const orphan = JSON.stringify({ meta: { event_name: "order_created" }, data: { id: "x" } });
    await expect(
      lemonSqueezy.parseWebhook(orphan, { "x-signature": sign(orphan) }),
    ).rejects.toThrow(/missing the order reference/);
  });
});

describe("resolveProvider", () => {
  it("defaults to invoice-only when nothing is configured", () => {
    expect(resolveProvider(undefined).id).toBe("invoice");
  });

  it("returns the Lemon Squeezy adapter when selected", () => {
    expect(resolveProvider("lemonsqueezy").merchantOfRecord).toBe(true);
  });

  it("fails loudly for a provider with no adapter", () => {
    expect(() => resolveProvider("paddle")).toThrow(/has no adapter/);
  });

  it("refuses to create a checkout when no provider is configured", async () => {
    await expect(
      resolveProvider("invoice").createCheckout({
        planId: "yourself-full",
        email: "",
        returnUrl: "https://function.example/x",
        reference: "ref-12345678",
      }),
    ).rejects.toThrow(/isn't live yet/);
  });
});
