// services/paymentsService.js
const BASE_URL = "https://createpaymentintent-2i2muudrxq-uc.a.run.app";

export async function createPaymentIntentForJob(payload) {
  // payload: { amount, currency, jobId, providerId, ownerId?, description? }
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error || "Serverfejl";
    throw new Error(msg);
  }
  return json; // { clientSecret, id }
}