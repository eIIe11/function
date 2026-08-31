/** Transactional email via Resend. The only outbound channel the functions use. */
export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and INVOICE_FROM_EMAIL are required to send email.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      reply_to: args.replyTo,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the send (${response.status}): ${detail.slice(0, 300)}`);
  }
}
