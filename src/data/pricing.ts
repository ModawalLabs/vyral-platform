import "server-only";

import type { CreditPack, Plan } from "@/types/pricing";

/**
 * The price list.
 *
 * The only file that needs to change when billing lands: keep these signatures and
 * replace the bodies with calls to the payment provider. Every consumer already awaits
 * them, so no component or page is touched.
 *
 * `server-only` so that swap cannot leak an API key into the browser bundle. The
 * vocabulary the client half needs — periods, tiers, the shared feature copy — lives in
 * `@/types/pricing` for exactly that reason.
 */

// TODO(pricing): placeholders, same as the landing site. Annual is monthly minus 20%.
const PLANS: Plan[] = [
  { tone: "creator", name: "Creator Plan", price: { monthly: 19, annual: 16 } },
  { tone: "pro", name: "Pro Plan", price: { monthly: 29, annual: 24 }, popular: true },
  { tone: "studio", name: "Studio Plan", price: { monthly: 79, annual: 66 } },
];

/*
 * TODO(pricing): placeholders, same as the landing site. The three original packs
 * ($19/3,000, $29/5,500, $79/17,000) are unchanged; the other four fill out the ladder.
 * Credits-per-dollar rises with pack size, so bigger is visibly better value.
 */
const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", price: 9, credits: "1,200" },
  { id: "creator", name: "Creator", price: 19, credits: "3,000" },
  { id: "plus", name: "Plus", price: 29, credits: "5,500" },
  { id: "pro", name: "Pro", price: 49, credits: "10,000" },
  { id: "studio", name: "Studio", price: 79, credits: "17,000" },
  { id: "agency", name: "Agency", price: 149, credits: "34,000" },
  { id: "scale", name: "Scale", price: 299, credits: "72,000" },
];

export async function listPlans(): Promise<Plan[]> {
  return PLANS;
}

export async function listCreditPacks(): Promise<CreditPack[]> {
  return CREDIT_PACKS;
}
