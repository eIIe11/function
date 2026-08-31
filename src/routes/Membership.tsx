import { useState } from "react";
import { Sticker } from "@/components/ui/Sticker";
import { Button } from "@/components/ui/Button";
import { formatAmount, plansFor } from "@/lib/payments/plans";
import { requestPurchaseOrder, startCheckout } from "@/lib/payments/client";
import type { Audience } from "@/lib/payments/types";

/**
 * The API writes its failure copy for the buyer, so it is shown verbatim. The
 * fallback covers the case where the request never reached us at all.
 */
function messageFor(thrown: unknown, fallback: string): string {
  return thrown instanceof Error && thrown.message ? thrown.message : fallback;
}

/** §14 Membership. Two audiences, two entirely different buying motions. */
export default function Membership() {
  const [audience, setAudience] = useState<Audience>("individual");

  return (
    <div>
      <section className="grain border-b-[3px] border-ink bg-paper-2 px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <span className="label">Membership</span>
          <h1 className="setup mt-2 text-2xl">Buy it once.</h1>
          <p className="punchline mt-3">
            No subscription you forget about. Individuals pay once and keep access; companies buy
            seats on an invoice like they buy everything else.
          </p>

          <div
            role="tablist"
            aria-label="Who is buying"
            className="mt-6 inline-flex rounded-lg border-[3px] border-ink bg-paper p-1"
          >
            {(
              [
                ["individual", "For me"],
                ["corporate", "For my team"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={audience === value}
                type="button"
                onClick={() => setAudience(value)}
                className={`min-h-[44px] rounded-md px-4 font-display font-bold ${
                  audience === value ? "bg-ink text-paper" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {audience === "individual" ? <Individual /> : <Corporate />}
    </div>
  );
}

function Individual() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(planId: string) {
    setError(null);
    setPending(planId);
    try {
      const session = await startCheckout({
        planId,
        email: "",
        returnUrl: `${window.location.origin}/membership/thanks`,
        reference: crypto.randomUUID(),
      });
      window.location.href = session.redirectUrl;
    } catch (thrown) {
      setError(messageFor(thrown, "Nothing was charged."));
      setPending(null);
    }
  }

  return (
    <section id="individual" className="px-5 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2">
          {plansFor("individual").map((plan, i) => (
            <article
              key={plan.id}
              className={i === 0 ? "loud-card p-5" : "q-card p-5"}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-extrabold">{plan.name}</h2>
                {i === 0 && <Sticker rotate={4}>Most of it</Sticker>}
              </div>
              <p className="setup mt-3 text-2xl">{formatAmount(plan.amount, plan.currency)}</p>
              <p className="label mt-1">Once. Not per month.</p>
              <ul className="mt-4 space-y-2">
                {plan.includes.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm">
                    <span aria-hidden="true" className="font-mono text-magenta">
                      —
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Button
                full
                size="lg"
                className="mt-5"
                variant={i === 0 ? "loud" : "quiet"}
                disabled={pending === plan.id}
                onClick={() => buy(plan.id)}
              >
                {pending === plan.id ? "One moment" : `Get ${plan.name}`}
              </Button>
            </article>
          ))}
        </div>

        {error && (
          <p className="q-card mt-4 border-l-4 border-l-tangerine p-4 text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="q-card mt-8 border-l-4 border-l-violet p-4">
          <p className="label">How the payment works</p>
          <p className="mt-1.5 text-sm">
            Card, Apple Pay and Google Pay through a merchant-of-record provider, which means VAT and
            sales tax are handled properly wherever you are. We never see or store your card details,
            and there's nothing to cancel later.
          </p>
        </div>
      </div>
    </section>
  );
}

function Corporate() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState(25);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await requestPurchaseOrder({
        organisation: String(data.get("organisation") ?? ""),
        contactName: String(data.get("contactName") ?? ""),
        contactEmail: String(data.get("contactEmail") ?? ""),
        seats: Number(data.get("seats") ?? seats),
        poNumber: (data.get("poNumber") as string) || null,
        billingAddress: String(data.get("billingAddress") ?? ""),
        vatNumber: (data.get("vatNumber") as string) || null,
        cohortStart: (data.get("cohortStart") as string) || null,
        notes: (data.get("notes") as string) || null,
        currency: "GBP",
      });
      setSent(result.reference);
    } catch (thrown) {
      setError(
        messageFor(thrown, "That didn't send. Email us and we'll raise the invoice by hand."),
      );
    }
  }

  return (
    <section id="corporate" className="px-5 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2">
          {plansFor("corporate").map((plan) => (
            <article key={plan.id} className="q-card p-5">
              <h2 className="font-display text-xl font-extrabold">{plan.name}</h2>
              <p className="label mt-1">
                {plan.seats ? `${plan.seats} seats to start` : "Unlimited seats"}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.includes.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm">
                    <span aria-hidden="true" className="font-mono text-cyan">
                      —
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="q-card mt-6 border-l-4 border-l-cyan p-4">
          <p className="label">Per-seat pricing</p>
          <p className="mt-1.5 text-sm">
            Priced per seat with volume bands, and we'll put the number in writing before you commit
            to anything. Pay by bank transfer against an invoice, with or without a PO — no card, and
            no procurement argument about a card.
          </p>
        </div>

        {sent ? (
          <div className="loud-card mt-8 p-5" role="status">
            <p className="label">Request received</p>
            <p className="setup mt-2 text-xl">{sent}</p>
            <p className="mt-3 text-md">
              Quote your reference on any email about this. We'll come back with a per-seat price and
              a PDF invoice; seats activate when the transfer clears, or sooner if you need them to.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <h2 className="setup text-xl">Request seats</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="organisation" label="Organisation" required />
              <Field name="contactName" label="Your name" required />
              <Field name="contactEmail" label="Work email" type="email" required />
              <label className="block">
                <span className="label">Seats</span>
                <input
                  name="seats"
                  type="number"
                  min={5}
                  step={1}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="mt-1 min-h-[52px] w-full rounded-lg border-2 border-ink bg-paper px-3.5 font-mono"
                />
              </label>
              <Field name="poNumber" label="PO number (if you have one)" />
              <Field name="vatNumber" label="VAT number (optional)" />
              <Field name="cohortStart" label="Preferred cohort start" type="date" />
            </div>
            <Field name="billingAddress" label="Billing address" required multiline />
            <Field name="notes" label="Anything we should know" multiline />

            {error && (
              <p className="q-card border-l-4 border-l-tangerine p-4 text-sm" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg">
              Send the request
            </Button>
            <p className="text-sm text-muted">
              No payment details here and nothing charged. This produces an invoice and a quote.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  multiline,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const shared =
    "mt-1 w-full rounded-lg border-2 border-ink bg-paper px-3.5 py-3 text-md";
  return (
    <label className="block">
      <span className="label">
        {label}
        {required ? " *" : ""}
      </span>
      {multiline ? (
        <textarea name={name} required={required} rows={3} className={shared} />
      ) : (
        <input name={name} type={type} required={required} className={`${shared} min-h-[52px]`} />
      )}
    </label>
  );
}
