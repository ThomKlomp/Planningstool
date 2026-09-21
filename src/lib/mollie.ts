// Lichte wrapper rond Mollie's REST API (v2), rechtstreeks met fetch i.p.v.
// een SDK-package — de v2 REST API is al jaren stabiel en dit voorkomt
// afhankelijkheid van een specifieke SDK-versie.
//
// NIEUW t.o.v. de vorige versie: subscriptions.update(), nodig om het
// bedrag van een lopend abonnement bij te werken als een zaak naar een
// andere prijsstaffel verhuist (zie cron/billing-resync). Mollie past een
// bijgewerkt bedrag toe vanaf de eerstvolgende betaling, nooit met
// terugwerkende kracht.

const MOLLIE_BASE = "https://api.mollie.com/v2";

function authHeaders() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error("MOLLIE_API_KEY ontbreekt");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function mollieFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${MOLLIE_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.detail || data?.title || `Mollie-fout (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export type MollieAmount = { currency: "EUR"; value: string };

export const mollie = {
  customers: {
    create: (data: { name: string; email: string; metadata?: Record<string, string> }) =>
      mollieFetch("/customers", { method: "POST", body: JSON.stringify(data) }),
    get: (customerId: string) => mollieFetch(`/customers/${customerId}`),
  },
  payments: {
    create: (data: {
      customerId: string;
      amount: MollieAmount;
      description: string;
      redirectUrl?: string; // niet nodig bij "recurring" (geen klantactie)
      webhookUrl: string;
      sequenceType: "first" | "recurring";
      metadata?: Record<string, string>;
    }) => mollieFetch("/payments", { method: "POST", body: JSON.stringify(data) }),
    get: (paymentId: string) => mollieFetch(`/payments/${paymentId}`),
  },
  subscriptions: {
    create: (
      customerId: string,
      data: {
        amount: MollieAmount;
        interval: string; // "1 month" | "12 months"
        description: string;
        webhookUrl: string;
        metadata?: Record<string, string>;
      }
    ) =>
      mollieFetch(`/customers/${customerId}/subscriptions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (customerId: string, subscriptionId: string) =>
      mollieFetch(`/customers/${customerId}/subscriptions/${subscriptionId}`),
    // Werkt het bedrag van de eerstvolgende (en alle volgende) betalingen
    // bij. Canceled subscriptions kunnen niet bijgewerkt worden.
    update: (customerId: string, subscriptionId: string, data: { amount: MollieAmount }) =>
      mollieFetch(`/customers/${customerId}/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    cancel: (customerId: string, subscriptionId: string) =>
      mollieFetch(`/customers/${customerId}/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      }),
  },
};
