import { Queue, Worker, Job } from 'bullmq';
import Stripe from 'stripe';
import { getBullMQConnection } from '@app/database/redis.js';


// ─── Job payloads ─────────────────────────────────────────────────────────────

export type PaymentJobData =
  | { kind: 'stripe_charge'; data: Stripe.ChargeSucceededEvent.Data }
  | { kind: 'pix_done'; pix: { txid: string }[] };

// ─── Queue ────────────────────────────────────────────────────────────────────

export const paymentQueue = new Queue<PaymentJobData>('payments', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
    attempts: 5,
    backoff: { type: 'exponential', delay: 3000 },
  },
});

// ─── Enqueue helpers ──────────────────────────────────────────────────────────

export async function enqueueStripePayment(data: Stripe.ChargeSucceededEvent.Data): Promise<void> {
  const jobId = `stripe-${data.object.id}`;
  await paymentQueue.add('stripe_charge', { kind: 'stripe_charge', data }, { jobId });
}

export async function enqueuePixPayment(pix: { txid: string }[]): Promise<void> {
  // Use first txid as dedup key; if multiple PIX arrive in one webhook they share a job
  const jobId = pix.length > 0 ? `pix-${pix[0].txid}` : undefined;
  await paymentQueue.add('pix_done', { kind: 'pix_done', pix }, { jobId });
}

// ─── Worker ───────────────────────────────────────────────────────────────────

let worker: Worker<PaymentJobData> | null = null;

export function startPaymentWorker(): void {
  if (worker) return;

  worker = new Worker<PaymentJobData>(
    'payments',
    async (job: Job<PaymentJobData>) => {
      const payload = job.data;
      if (payload.kind === 'stripe_charge') {
        // await CreditsService.chargeSucceededStripe(payload.data); importar depois do outro projeto
      } else if (payload.kind === 'pix_done') {
        // await CreditsService.pixDone(payload.pix);
      }
    },
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[PaymentQueue] job ${job?.id} failed:`, err.message);
  });

  console.log('[PaymentQueue] Worker started');
}
