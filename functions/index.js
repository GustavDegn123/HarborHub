// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// Define runtime secrets (DO NOT read process.env at module load)
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

/**
 * Small helper to allow POST from your app (and preflight) — optional.
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

/**
 * 👉 Create PaymentIntent for a job (hard-fail if required fields missing)
 */
exports.createPaymentIntent = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY] },
  async (req, res) => {
    try {
      if (allowCORS(req, res)) return;
      if (req.method !== "POST") {
        return res.status(405).send({ error: "Only POST is allowed." });
      }

      const { amount, jobId, providerId, ownerId } = req.body || {};

      // Hard fail on missing inputs
      if (
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 ||
        !jobId ||
        !providerId ||
        !ownerId
      ) {
        logger.error("❌ createPaymentIntent: Missing/invalid fields", req.body);
        return res.status(400).send({
          error:
            "Mangler jobId, providerId, ownerId eller beløb (>0). Betaling blev IKKE oprettet.",
        });
      }

      // Create Stripe client *inside* handler with runtime secret
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: "2024-06-20",
      });

      // Create PaymentIntent (store providerId as 'mechanicId' in metadata)
      const pi = await stripe.paymentIntents.create({
        amount: Number(amount),
        currency: "dkk",
        metadata: { jobId, mechanicId: providerId, ownerId },
        // optional: automatic payment methods
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
 * 👉 Stripe webhook (updates job → paid, writes payouts)
 * IMPORTANT: Stripe needs the raw body for signature verification.
 */
exports.stripeWebhook = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    // Do NOT add CORS to the webhook; Stripe doesn't need it.
    // Verify signature with rawBody
    let event;
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: "2024-06-20",
      });

      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.rawBody, // raw body is available in v2 onRequest
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      logger.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const pi = event.data.object;
          logger.info("✅ PaymentIntent succeeded:", pi.id);

          const { jobId, mechanicId, ownerId } = pi.metadata || {};
          const grossAmount = pi.amount_received; // øre
          const netAmount = Math.round(Number(grossAmount || 0) * 0.9); // 90% to provider

          // 1) Record payment
          await db.collection("payments").doc(pi.id).set({
            status: "succeeded",
            amount: grossAmount,
            currency: pi.currency,
            jobId: jobId || null,
            mechanicId: mechanicId || null,
            ownerId: ownerId || null,
            createdAt: admin.firestore.Timestamp.now(),
          });

          // 2) Create payout for provider
          if (mechanicId && Number.isFinite(netAmount)) {
            const payoutRef = db
              .collection("providers")
              .doc(mechanicId)
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
              `💸 Payout -> provider ${mechanicId}: ${netAmount} ${pi.currency}`
            );
          } else {
            logger.warn(
              "No mechanicId or invalid netAmount — payout not written",
              { mechanicId, netAmount }
            );
          }

          // 3) Update job → paid
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

            // 4) Mirror on provider's assigned_jobs
            if (mechanicId) {
              const assignedRef = db
                .collection("providers")
                .doc(mechanicId)
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
                  `🔄 Assigned job ${jobId} for provider ${mechanicId} sat til "paid"`
                );
              }
            }
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const pi = event.data.object;
          logger.warn("❌ PaymentIntent failed:", pi.id);

          const { jobId, mechanicId, ownerId } = pi.metadata || {};
          await db.collection("payments").doc(pi.id).set({
            status: "failed",
            amount: pi.amount,
            currency: pi.currency,
            jobId: jobId || null,
            mechanicId: mechanicId || null,
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
