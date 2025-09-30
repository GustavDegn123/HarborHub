const functions = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// Init Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * 👉 Opret PaymentIntent til et job
 */
exports.createPaymentIntent = functions.onRequest(
  { secrets: ["STRIPE_SECRET_KEY"], region: "us-central1" },
  async (req, res) => {
    const { amount, jobId, mechanicId, ownerId } = req.body;

    try {
      if (!amount || !jobId || !mechanicId || !ownerId) {
        throw new Error("Mangler jobId, mechanicId, ownerId eller beløb.");
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "dkk",
        metadata: { jobId, mechanicId, ownerId },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      logger.error("Error creating PaymentIntent:", error);
      res.status(500).send({ error: error.message });
    }
  }
);

/**
 * 👉 Stripe webhook
 */
exports.stripeWebhook = functions.onRequest(
  {
    secrets: ["STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"],
    region: "us-central1",
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        logger.info("✅ PaymentIntent succeeded:", paymentIntent.id);

        const { jobId, mechanicId, ownerId } = paymentIntent.metadata || {};
        const grossAmount = paymentIntent.amount_received; // i øre
        const netAmount = Math.round(grossAmount * 0.9);

        // Gem betaling i "payments"
        await db.collection("payments").doc(paymentIntent.id).set({
          status: "succeeded",
          amount: grossAmount,
          currency: paymentIntent.currency,
          jobId: jobId || null,
          mechanicId: mechanicId || null,
          ownerId: ownerId || null,
          createdAt: admin.firestore.Timestamp.now(),
        });

        // Opret payout til mekaniker
        if (mechanicId) {
          const payoutRef = db
            .collection("providers")
            .doc(mechanicId)
            .collection("payouts")
            .doc(paymentIntent.id);
          await payoutRef.set({
            amount: netAmount,
            currency: paymentIntent.currency,
            jobId: jobId || null,
            paymentIntentId: paymentIntent.id,
            createdAt: admin.firestore.Timestamp.now(),
          });
          logger.info(
            `💸 Payout til provider ${mechanicId}: ${netAmount} ${paymentIntent.currency}`
          );
        }

        // Opdater job → status: "paid"
        if (jobId) {
          await db.collection("service_requests").doc(jobId).update({
            status: "paid",
            payment: {
              succeededAt: admin.firestore.Timestamp.now(),
              paymentIntentId: paymentIntent.id,
              grossAmount,
              netAmount,
            },
          });
          logger.info(`🔄 Job ${jobId} sat til "paid"`);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        logger.warn("❌ PaymentIntent failed:", paymentIntent.id);

        const { jobId, mechanicId, ownerId } = paymentIntent.metadata || {};

        await db.collection("payments").doc(paymentIntent.id).set({
          status: "failed",
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
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
  }
);
