const functions = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

/**
 * Create PaymentIntent (kaldes fra din app)
 * Body skal indeholde: { amount, jobId, mechanicId, ownerId }
 */
exports.createPaymentIntent = functions.onRequest(
  { secrets: ["STRIPE_SECRET_KEY"], region: "us-central1" },
  async (req, res) => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { amount, jobId, mechanicId, ownerId } = req.body;

    if (!amount) {
      return res.status(400).send({ error: "Missing required field: amount" });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "dkk",
        metadata: {
          jobId: jobId || "",
          mechanicId: mechanicId || "",
          ownerId: ownerId || "",
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      logger.error("Error creating PaymentIntent:", error);
      res.status(500).send({ error: error.message });
    }
  }
);

/**
 * Stripe Webhook (kaldes af Stripe ved events)
 * Events: payment_intent.succeeded, payment_intent.payment_failed
 */
exports.stripeWebhook = functions.onRequest(
  {
    secrets: ["STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"],
    region: "us-central1",
  },
  async (req, res) => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        logger.info("✅ PaymentIntent succeeded:", paymentIntent.id);

        const { jobId, mechanicId, ownerId } = paymentIntent.metadata || {};

        await db.collection("payments").doc(paymentIntent.id).set({
          status: "succeeded",
          amount: paymentIntent.amount_received,
          currency: paymentIntent.currency,
          jobId: jobId || null,
          mechanicId: mechanicId || null,
          ownerId: ownerId || null,
          createdAt: admin.firestore.Timestamp.now(),
        });
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
