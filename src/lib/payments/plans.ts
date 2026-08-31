import type { Plan } from "./types";

/**
 * §14.1 Prices are placeholders pending the pricing decision (docs/OPEN-DECISIONS.md,
 * items 7 and 8). They live here rather than in the components so changing them
 * is one edit and no copy rewrite.
 */
export const PLANS: Plan[] = [
  {
    id: "yourself-full",
    audience: "individual",
    name: "Everything",
    amount: 14900,
    currency: "GBP",
    seats: 1,
    includes: [
      "All units, for as long as they exist",
      "The intake, your type code and your capability profile",
      "Every simulator, inbox and scenario",
      "Troubleshoot, the tracker and the locker",
      "Certification when you've got the evidence for it",
    ],
    certificate: true,
  },
  {
    id: "yourself-starter",
    audience: "individual",
    name: "Starter",
    amount: 4900,
    currency: "GBP",
    seats: 1,
    includes: [
      "The intake and your capability profile",
      "The first three units",
      "Troubleshoot and the tracker",
      "Upgrade later and the £49 comes off",
    ],
    certificate: false,
  },
  {
    id: "workplace-cohort",
    audience: "corporate",
    name: "Cohort",
    amount: 0,
    currency: "GBP",
    seats: 25,
    includes: [
      "25 seats, assignable and reassignable",
      "Cohorts with pathways and due dates",
      "Manager dashboard: bands, completion, group weak spots",
      "Certification for the cohort",
      "Invoice or purchase order — no card needed",
    ],
    certificate: true,
  },
  {
    id: "workplace-enterprise",
    audience: "corporate",
    name: "Enterprise",
    amount: 0,
    currency: "GBP",
    seats: null,
    includes: [
      "Unlimited seats and multiple cohorts",
      "Your own scenarios, authored against our schema",
      "SSO and a data processing agreement",
      "Capability reporting across teams",
      "A named person who answers the phone",
    ],
    certificate: true,
  },
];

export function plansFor(audience: Plan["audience"]): Plan[] {
  return PLANS.filter((plan) => plan.audience === audience);
}

export function planById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

const FORMATTERS: Record<Plan["currency"], Intl.NumberFormat> = {
  GBP: new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  EUR: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }),
  AUD: new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }),
};

export function formatAmount(amount: number, currency: Plan["currency"]): string {
  return FORMATTERS[currency].format(amount / 100).replace(/\.00$/, "");
}
