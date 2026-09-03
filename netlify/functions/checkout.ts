import { planById } from "../../src/lib/payments/plans";
import { errorResponse, json, PublicError, requirePost, assertOwnOrigin } from "../lib/http";
import { resolveProvider } from "../lib/providers";
import { CheckoutRequestSchema, parseBody } from "../lib/validation";

/**
 * POST /api/checkout → { id, redirectUrl, provider }
 *
 * The client receives a redirect URL and nothing else: no key, no price object,
 * no provider payload. The price is read from our own plan table rather than the
 * request body, so a tampered body cannot buy a £149 plan for £1.
 */
export default async (request: Request): Promise<Response> => {
  try {
    requirePost(request);
    const body = await parseBody(request, CheckoutRequestSchema);

    /* Netlify sets URL to the site's canonical origin; falling back to the
       request's own origin keeps deploy previews and local dev working. */
    assertOwnOrigin(body.returnUrl, process.env.URL ?? new URL(request.url).origin);

    const plan = planById(body.planId);
    if (!plan) {
      throw new PublicError("Unknown plan", 404);
    }
    if (plan.audience === "corporate") {
      /* Corporate never touches a card — it goes through purchase-order. */
      throw new PublicError("Corporate plans are invoiced. Use the enquiry form.", 409);
    }

    const session = await resolveProvider().createCheckout(body);
    return json(session);
  } catch (error) {
    return errorResponse(error);
  }
};
