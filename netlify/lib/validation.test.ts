import { describe, expect, it } from "vitest";
import { assertOwnOrigin, PublicError } from "./http";
import { CheckoutRequestSchema, parseBody, PurchaseOrderRequestSchema } from "./validation";

function post(body: unknown): Request {
  return new Request("https://function.example/api/checkout", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("parseBody", () => {
  it("accepts a valid checkout request", async () => {
    const parsed = await parseBody(
      post({
        planId: "yourself-full",
        email: "buyer@example.com",
        returnUrl: "https://function.example/membership/thanks",
        reference: "ref-12345678",
      }),
      CheckoutRequestSchema,
    );
    expect(parsed.planId).toBe("yourself-full");
  });

  it("names the offending field so the form can be fixed", async () => {
    await expect(
      parseBody(post({ planId: "", email: "nope", returnUrl: "x", reference: "" }), CheckoutRequestSchema),
    ).rejects.toThrow(/planId/);
  });

  it("rejects a body that isn't JSON", async () => {
    await expect(parseBody(post("not json"), CheckoutRequestSchema)).rejects.toBeInstanceOf(
      PublicError,
    );
  });

  it("requires a contactable email on a purchase order", async () => {
    await expect(
      parseBody(
        post({
          organisation: "Acme",
          contactName: "Dana",
          contactEmail: "not-an-email",
          seats: 25,
          poNumber: null,
          billingAddress: "1 Street",
          vatNumber: null,
          cohortStart: null,
          notes: null,
        }),
        PurchaseOrderRequestSchema,
      ),
    ).rejects.toThrow(/contactEmail/);
  });
});

describe("assertOwnOrigin", () => {
  it("allows a return URL on our own origin", () => {
    expect(() =>
      assertOwnOrigin("https://function.example/membership/thanks", "https://function.example"),
    ).not.toThrow();
  });

  it("rejects an off-site return URL, so checkout can't be used as an open redirect", () => {
    expect(() =>
      assertOwnOrigin("https://phish.example/steal", "https://function.example"),
    ).toThrow(/Invalid return URL/);
  });

  it("rejects a non-URL", () => {
    expect(() => assertOwnOrigin("/relative", "https://function.example")).toThrow(
      /Invalid return URL/,
    );
  });
});
