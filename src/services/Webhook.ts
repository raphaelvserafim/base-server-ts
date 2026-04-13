import Stripe from "stripe";
import { Req, Res } from "@tsed/common";
import { config } from "@app/config/index.js";
import { enqueuePixPayment, enqueueStripePayment } from "@app/services/queues/index.js";

export class ServiceWebhook {

  // ─── Stripe ───────────────────────────────────────────────────────────────────

  async stripe(signature: string, body: Buffer) {
    try {
      if (!signature) throw new Error('Signature missing');

      const stripe = new Stripe(config.stripe.key);
      const event = stripe.webhooks.constructEvent(body, signature, config.stripe.signature);

      switch (event.type) {
        case "charge.succeeded":
          await enqueueStripePayment(event.data);
          break;

        // Eventos futuros — adicionar handlers aqui quando necessário
        case "invoice.updated":
        case "checkout.session.completed":
        case "customer.subscription.deleted":
        case "customer.subscription.updated":
        case "invoice.paid":
          break;

        default:
          console.warn(`[Stripe] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('[Stripe] Webhook error:', error);
    }
  }

  // ─── PIX ──────────────────────────────────────────────────────────────────────

  async pix(req: Req, resp: Res) {
    try {
      await enqueuePixPayment(req?.body?.pix ?? []);
      resp.status(200).json({ received: true });
    } catch (error) {
      console.error('[PIX] Webhook error:', error);
    }
  }


}
