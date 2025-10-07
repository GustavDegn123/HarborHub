// services/paymentsService.js

const USE_LIVE = false;

// Firebase Cloud Function URLs
const CLOUD_BASE_TEST =
  "https://createpaymentintent-2i2muudrxq-uc.a.run.app"; // TEST
const CLOUD_BASE_LIVE =
  "https://createpaymentintent-live-xyz.a.run.app"; // sæt din LIVE URL ind senere

const CLOUD_BASE = USE_LIVE ? CLOUD_BASE_LIVE : CLOUD_BASE_TEST;

/**
 * Opretter et PaymentIntent i Stripe via Firebase Function
 */
export async function createPaymentIntentForJob({
  amount, // i øre
  currency = "dkk",
  jobId,
  providerId,
  ownerId = "",
  description = "HarborHub betaling",
}) {
  
  const payload = { amount, currency, jobId, providerId, ownerId, description };

  try {
    const res = await fetch(CLOUD_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Serverfejl (${res.status}): ${text}`);
    }

    return await res.json(); // { clientSecret, id }
  } catch (err) {
    console.error("createPaymentIntentForJob fejl:", err);
    throw err;
  }
}
