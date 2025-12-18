// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

admin.initializeApp();
const db = admin.firestore();

// 🔑 Secrets (defineret i Firebase CLI)
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const OpenAI = require("openai");

/**
 * Helper til CORS (kun nødvendigt for createPaymentIntent, ikke webhook)
 */
function allowCORS(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

exports.deleteUserData = require("./deleteUserData").deleteUserData;

/**
 * Create PaymentIntent til et job
 */
exports.createPaymentIntent = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY] },
  async (req, res) => {
    try {
      if (allowCORS(req, res)) return;
      if (req.method !== "POST") {
        return res.status(405).send({ error: "Kun POST er tilladt." });
      }

      const { amount, jobId, providerId, ownerId } = req.body || {};

      // Hard fail hvis noget mangler
      if (
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 ||
        !jobId ||
        !providerId ||
        !ownerId
      ) {
        logger.error("❌ createPaymentIntent: Mangler/ugyldige felter", req.body);
        return res.status(400).send({
          error:
            "Mangler jobId, providerId, ownerId eller beløb (>0). Betaling blev IKKE oprettet.",
        });
      }

      // Stripe client med runtime secret
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: "2024-06-20",
      });

      // Opret PaymentIntent
      const pi = await stripe.paymentIntents.create({
        amount: Number(amount),
        currency: "dkk",
        metadata: { jobId, providerId, ownerId },
        automatic_payment_methods: { enabled: true },
      });

      logger.info(
        `✅ PaymentIntent oprettet for job ${jobId} / provider ${providerId} / amount ${amount}`
      );

      res.json({ clientSecret: pi.client_secret });
    } catch (error) {
      logger.error("Error creating PaymentIntent:", error);
      res.status(500).send({ error: error.message });
    }
  }
);

/**
 * Stripe webhook (sætter job → paid, opretter payouts osv.)
 */
exports.stripeWebhook = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    let event;
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: "2024-06-20",
      });

      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.rawBody, // rawBody til signatur
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      logger.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const pi = event.data.object;
          logger.info("✅ PaymentIntent succeeded:", pi.id);

          const { jobId, providerId, ownerId } = pi.metadata || {};
          const grossAmount = pi.amount_received; // i øre
          const netAmount = Math.round(Number(grossAmount || 0) * 0.9); // 90% til provider

          // 1) Gem betaling
          await db.collection("payments").doc(pi.id).set({
            status: "succeeded",
            amount: grossAmount,
            currency: pi.currency,
            jobId: jobId || null,
            providerId: providerId || null,
            ownerId: ownerId || null,
            createdAt: admin.firestore.Timestamp.now(),
          });

          // 2) Opret payout til provider
          if (providerId && Number.isFinite(netAmount)) {
            const payoutRef = db
              .collection("providers")
              .doc(providerId)
              .collection("payouts")
              .doc(pi.id);

            await payoutRef.set({
              amount: netAmount,
              currency: pi.currency,
              jobId: jobId || null,
              paymentIntentId: pi.id,
              createdAt: admin.firestore.Timestamp.now(),
            });

            logger.info(
              `💸 Payout -> provider ${providerId}: ${netAmount} ${pi.currency}`
            );
          }

          // 3) Opdater job → paid
          if (jobId) {
            const jobRef = db.collection("service_requests").doc(jobId);
            await jobRef.update({
              status: "paid",
              paid: true,
              paidAt: admin.firestore.Timestamp.now(),
              payment: {
                succeededAt: admin.firestore.Timestamp.now(),
                paymentIntentId: pi.id,
                grossAmount,
                netAmount,
              },
              updated_at: admin.firestore.Timestamp.now(),
            });
            logger.info(`🔄 Job ${jobId} sat til "paid"`);

            // 4) Opdater providerens assigned_jobs
            if (providerId) {
              const assignedRef = db
                .collection("providers")
                .doc(providerId)
                .collection("assigned_jobs")
                .doc(jobId);

              const assignedSnap = await assignedRef.get();
              if (assignedSnap.exists) {
                await assignedRef.update({
                  status: "paid",
                  paid: true,
                  paidAt: admin.firestore.Timestamp.now(),
                });
                logger.info(
                  `🔄 Assigned job ${jobId} for provider ${providerId} sat til "paid"`
                );
              }
            }
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const pi = event.data.object;
          logger.warn("❌ PaymentIntent failed:", pi.id);

          const { jobId, providerId, ownerId } = pi.metadata || {};
          await db.collection("payments").doc(pi.id).set({
            status: "failed",
            amount: pi.amount,
            currency: pi.currency,
            jobId: jobId || null,
            providerId: providerId || null,
            ownerId: ownerId || null,
            createdAt: admin.firestore.Timestamp.now(),
          });
          break;
        }

        default:
          logger.info(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      logger.error("stripeWebhook handler error:", err);
      res.status(500).send({ error: "Internal webhook error" });
    }
  }
);

exports.chat = onRequest(
  { region: "us-central1", cors: ["*"], secrets: [OPENAI_API_KEY] },
  async (req, res) => {
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

      const { messages = [] } = req.body || {};
      const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() }); // 👈 brug secret

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.2,
      });

      res.json({ reply: completion.choices?.[0]?.message ?? { role: "assistant", content: "Ingen svar" } });
    } catch (e) {
      logger.error(e);
      res.status(500).json({ error: "OpenAI fejl" });
    }
  }
);