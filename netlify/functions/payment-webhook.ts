import { errorResponse, json, requirePost } from "../lib/http";
import { resolveProvider } from "../lib/providers";

/**
 * POST /api/payment-webhook
 *
 * Verifies the signature, normalises the payload, and acknowledges. Fulfilment —
 * granting access, issuing the receipt — lands here once Supabase exists; until
 * then the event is logged rather than dropped silently, so a payment taken
 * during that window can be reconciled from the function log.
 */
export default async (request: Request): Promise<Response> => {
  try {
    requirePost(request);

    /* The raw text, not request.json(): the signature covers the exact bytes, so
       re-serialising a parsed object would break verification. */
    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const event = await resolveProvider().parseWebhook(rawBody, headers);

    console.log("payment event", {
      provider: event.provider,
      reference: event.reference,
      status: event.status,
      amount: event.amount,
      currency: event.currency,
      /* Deliberately no email in the log line. */
    });

    /* 200 so the provider stops retrying a payload we have accepted. */
    return json({ received: true, reference: event.reference });
  } catch (error) {
    return errorResponse(error);
  }
};
