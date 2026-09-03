import { z } from "zod";
import { PublicError } from "./http";

/**
 * The functions validate their own input rather than trusting the client, because
 * the client is not the only thing that can POST to them.
 */

export const CheckoutRequestSchema = z.object({
  planId: z.string().min(1).max(64),
  seats: z.number().int().min(1).max(10_000).optional(),
  email: z.union([z.string().email(), z.literal("")]),
  returnUrl: z.string().url(),
  reference: z.string().min(8).max(128),
});

export const PurchaseOrderRequestSchema = z.object({
  organisation: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  seats: z.number().int().min(1).max(100_000),
  poNumber: z.string().max(100).nullable(),
  billingAddress: z.string().min(1).max(1000),
  vatNumber: z.string().max(64).nullable(),
  cohortStart: z.string().max(32).nullable(),
  notes: z.string().max(2000).nullable(),
  planId: z.string().min(1).max(64).optional(),
  amount: z.number().int().min(0).optional(),
});

export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new PublicError("Expected a JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    /* First issue only. The form knows its own fields; a wall of Zod paths helps
       nobody and describes our internals. */
    const issue = result.error.issues[0];
    throw new PublicError(`${issue.path.join(".") || "body"}: ${issue.message}`, 422);
  }
  return result.data;
}
