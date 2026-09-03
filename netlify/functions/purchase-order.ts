import { randomUUID } from "node:crypto";
import { planById, formatAmount } from "../../src/lib/payments/plans";
import { errorResponse, json, PublicError, requirePost } from "../lib/http";
import { sendEmail } from "../lib/notify";
import { parseBody, PurchaseOrderRequestSchema } from "../lib/validation";

/**
 * POST /api/purchase-order → { reference }
 *
 * The corporate route, which never touches a payment processor: the enquiry is
 * emailed to sales and confirmed to the buyer, an invoice is raised by hand, and
 * seats activate when the transfer clears. That is how procurement actually buys,
 * and it avoids card fees on five-figure orders.
 */
export default async (request: Request): Promise<Response> => {
  try {
    requirePost(request);
    const body = await parseBody(request, PurchaseOrderRequestSchema);

    /* Human-quotable, and unique enough to be a filing reference. */
    const reference = `FN-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const plan = body.planId ? planById(body.planId) : undefined;
    const salesInbox = process.env.SALES_EMAIL;

    const summary = [
      `Reference: ${reference}`,
      `Organisation: ${body.organisation}`,
      `Contact: ${body.contactName} <${body.contactEmail}>`,
      `Seats: ${body.seats}`,
      `Plan: ${plan?.name ?? "not specified"}`,
      body.amount ? `Indicative value: ${formatAmount(body.amount, "GBP")}` : null,
      `PO number: ${body.poNumber ?? "—"}`,
      `VAT number: ${body.vatNumber ?? "—"}`,
      `Cohort start: ${body.cohortStart ?? "—"}`,
      "",
      "Billing address:",
      body.billingAddress,
      "",
      body.notes ? `Notes:\n${body.notes}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    if (!salesInbox || !process.env.RESEND_API_KEY) {
      /* Local development, and the one case where logging the enquiry is
         acceptable: it is not yet possible to lose a real lead. In production
         both variables are set, so this branch says so out loud rather than
         handing back a reference for an enquiry nobody will ever read. */
      if (process.env.PURCHASE_ORDER_LOG_ONLY === "true") {
        console.log(`purchase order (log only)\n${summary}`);
        return json({ reference });
      }
      throw new PublicError(
        "The enquiry form isn't connected yet. Nothing was sent — email us directly and we'll raise the invoice by hand.",
        503,
      );
    }

    /* Sales first. If this throws the buyer gets an error and can try again —
       preferable to a cheerful reference number for an enquiry nobody received. */
    await sendEmail({
      to: salesInbox,
      subject: `Seat licence enquiry — ${body.organisation} (${body.seats} seats)`,
      text: summary,
      replyTo: body.contactEmail,
    });

    /* The buyer's copy is a courtesy, so a bounce here must not fail the request
       that has already reached sales. */
    try {
      await sendEmail({
        to: body.contactEmail,
        subject: `Your FUNCTION. seat licence enquiry — ${reference}`,
        text: [
          `Thanks ${body.contactName}.`,
          "",
          `We've got your enquiry for ${body.seats} seats and we'll come back with an invoice.`,
          `Quote ${reference} if you need to chase us.`,
          "",
          "No payment has been taken and no card details were collected.",
          summary,
        ].join("\n"),
        replyTo: salesInbox,
      });
    } catch (error) {
      console.error("buyer confirmation failed for", reference, error);
    }

    return json({ reference });
  } catch (error) {
    return errorResponse(error);
  }
};
