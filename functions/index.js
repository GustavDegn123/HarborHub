/* eslint-disable */
"use strict";

const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const cors = require("cors")({ origin: true });

setGlobalOptions({ maxInstances: 10 });

try {
  admin.initializeApp();
} catch (e) {}

const STRIPE_SECRET = defineSecret("STRIPE_SECRET");                  // sk_test_...
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");  // whsec_...

/**
 * POST /createPaymentIntent
 * Body: { amount(øre), currency?, jobId, providerId, ownerId?, description? }
 * Return: { clientSecret, id }
 */
exports.createPaymentIntent = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET] },
  function (req, res) {
    cors(req, res, async function () {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
      }

      try {
        const secret = STRIPE_SECRET.value();
        if (!secret) {
          res.status(500).json({ error: "Missing STRIPE_SECRET" });
          return;
        }
        const stripe = new Stripe(secret);

        // Undgå optional chaining for compatibility
        const body = (req && req.body && typeof req.body === "object") ? req.body : {};

        // amount i ØRE
        const amount = Number(body.amount || 0);
        const currency = String(body.currency || "dkk").toLowerCase();
        const jobId = String(body.jobId || "");
        const providerId = String(body.providerId || "");
        const ownerId = String(body.ownerId || "");
        const description = String(body.description || "HarborHub betaling (TEST)");

        if (!jobId || !providerId || !isFinite(amount) || amount <= 0) {
          res.status(400).json({ error: "Missing or invalid fields" });
          return;
        }

        // Hent providerens connected account id i Firestore
        const provRef = admin.firestore().doc("providers/" + providerId);
        const provSnap = await provRef.get();
        const provData = provSnap.exists ? provSnap.data() : null;
        const stripeAccountId = (provData && provData.stripeAccountId) ? provData.stripeAccountId : null;

        if (!stripeAccountId) {
          res.status(400).json({ error: "Provider mangler stripeAccountId" });
          return;
        }

        const pi = await stripe.paymentIntents.create({
          amount: Math.round(amount),
          currency: currency,
          description: description,
          automatic_payment_methods: { enabled: true },
          transfer_data: { destination: stripeAccountId }, // destination charge
          application_fee_amount: 0,                        // intet fee i test
          metadata: {
            jobId: jobId,
            providerId: providerId,
            ownerId: ownerId
          }
        });

        logger.info("Created PaymentIntent", {
          id: pi.id,
          amount: pi.amount,
          jobId: jobId,
          providerId: providerId
        });

        res.status(200).json({ clientSecret: pi.client_secret, id: pi.id });
      } catch (err) {
        logger.error("Stripe PI error", { message: (err && err.message) ? String(err.message) : String(err) });
        res.status(500).json({ error: "Stripe error" });
      }
    });
  }
);

/**
 * POST /stripeWebhook
 * Opdaterer Firestore ved betaling (succeeded/failed) og skriver earnings til providers/{providerId}.metrics.totalEarnedMinor
 */
exports.stripeWebhook = onRequest(
  { region: "us-central1", secrets: [STRIPE_WEBHOOK_SECRET, STRIPE_SECRET] },
  async function (req, res) {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    try {
      const signingSecret = STRIPE_WEBHOOK_SECRET.value();
      const apiKey = STRIPE_SECRET.value();
      if (!signingSecret || !apiKey) {
        res.status(500).send("Missing webhook or API secret");
        return;
      }

      const stripe = new Stripe(apiKey);

      // Brug rå body for at verificere signaturen
      const event = stripe.webhooks.constructEvent(req.rawBody, sig, signingSecret);

      if (event && event.type === "payment_intent.succeeded") {
        const pi = (event.data && event.data.object) ? event.data.object : null;
        const md = (pi && pi.metadata) ? pi.metadata : {};
        const jobId = md.jobId || "";
        const providerId = md.providerId || "";
        const ownerId = md.ownerId || "";

        const amountMinor = Number((pi && pi.amount) ? pi.amount : 0); // ØRE
        const currency = String((pi && pi.currency) ? pi.currency : "dkk").toLowerCase();

        const batch = admin.firestore().batch();
        const now = admin.firestore.FieldValue.serverTimestamp();

        if (jobId) {
          const jobRef = admin.firestore().doc("service_requests/" + jobId);
          batch.set(jobRef, {
            status: "paid",
            payment: {
              intentId: (pi && pi.id) ? pi.id : null,
              amount: amountMinor,
              currency: currency,
              providerId: providerId || null,
              ownerId: ownerId || null,
              succeededAt: now
            },
            updated_at: now
          }, { merge: true });
        }

        if (providerId) {
          const provRef = admin.firestore().doc("providers/" + providerId);
          batch.set(provRef, {
            metrics: {
              totalEarnedMinor: admin.firestore.FieldValue.increment(amountMinor),
              lastPaidAt: now
            }
          }, { merge: true });

          if (jobId) {
            const assignedRef = admin.firestore().doc("providers/" + providerId + "/assigned_jobs/" + jobId);
            batch.set(assignedRef, {
              status: "paid",
              lastPaymentAmountMinor: amountMinor,
              lastPaymentCurrency: currency,
              lastPaymentAt: now
            }, { merge: true });
          }
        }

        await batch.commit();
        logger.info("Handled payment_intent.succeeded", { jobId: jobId, providerId: providerId, amountMinor: amountMinor });
      }

      if (event && event.type === "payment_intent.payment_failed") {
        const pi = (event.data && event.data.object) ? event.data.object : null;
        const md = (pi && pi.metadata) ? pi.metadata : {};
        const jobId = md.jobId || "";
        const lastMsg =
          (pi && pi.last_payment_error && pi.last_payment_error.message)
            ? pi.last_payment_error.message
            : "unknown";

        if (jobId) {
          await admin.firestore().doc("service_requests/" + jobId).set({
            payment: {
              failed: true,
              lastError: lastMsg,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });
        }
        logger.warn("payment_intent.payment_failed", { jobId: jobId, lastMsg: lastMsg });
      }

      res.sendStatus(200);
    } catch (err) {
      logger.error("Webhook handler error", { message: (err && err.message) ? String(err.message) : String(err) });
      res.status(400).send("Webhook Error");
    }
  }
);