import { config } from "@app/config/index.js";
import Stripe from "stripe";


async function setWebhook() {
  const stripe = new Stripe(config.stripe.key);
  const webhookEndpoint = await stripe.webhookEndpoints.create({
    url: `${config.system.urlServer}/v1/webhook/stripe`,
    enabled_events: [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "charge.succeeded",
      "customer.subscription.created",
      "invoice.payment_failed",
    ],
  });

  console.log("Webhook criado:", webhookEndpoint);
}

setWebhook().catch(console.error);