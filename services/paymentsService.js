// services/paymentsService.js

// Du kan nemt skifte mellem TEST og LIVE ved at ændre USE_LIVE til true
const USE_LIVE = false;

// Cloud Function URLs
const CLOUD_BASE_TEST =
  "https://createpaymentintent-2i2muudrxq-uc.a.run.app"; // TEST deploy
const CLOUD_BASE_LIVE =
  "https://createpaymentintent-live-xyz.a.run.app"; // Sæt din LIVE URL ind senere

const CLOUD_BASE = USE_LIVE ? CLOUD_BASE_LIVE : CLOUD_BASE_TEST;

/**
 * Opretter et PaymentIntent i Stripe via din Firebase Function
 * @param {Object} options
 * @param {number} options.amount - beløb i ØRE (7000 kr = 700000)
 * @param {string} [options.currency="dkk"] - valuta
 * @param {string} options.jobId - id på job/opgave
 * @param {string} options.providerId - mekanikerens Firestore ID
 * @param {string} [options.ownerId] - ejerens UID (fra Firebase auth)
 * @param {string} [options.description] - beskrivelse til Stripe
 */
export async function createPaymentIntentForJob({
  amount,
  currency = "dkk",
  jobId,
  providerId,
  ownerId = "",
  description = "HarborHub testbetaling",
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