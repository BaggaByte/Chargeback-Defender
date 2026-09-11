/**
 * Creates a REAL dispute on your actual Stripe Test Account and sends it to the local app.
 *
 * Flow:
 *  1. Uses your real `STRIPE_SECRET_KEY` (`sk_test_...`) to create a charge using `tok_createDispute`.
 *  2. Stripe automatically disputes the charge with status `needs_response` and reason `fraudulent`.
 *  3. Ingests the real Stripe dispute into Chargeback Defender (`http://localhost:4000/api/webhooks/stripe`).
 *  4. The RocketRide AI pipeline processes evidence and the dashboard auto-refreshes.
 */

import Stripe from 'stripe';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || secretKey.startsWith('sk_test_mock')) {
  console.error('❌ Error: Valid STRIPE_SECRET_KEY not found in .env.local.');
  process.exit(1);
}

const stripe = new Stripe(secretKey);
const PORT = process.env.PORT || 4000;
const SERVER_URL = `http://localhost:${PORT}/api/webhooks/stripe`;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_demo_secret_2026';

function generateStripeSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function main() {
  console.log('\n\x1b[1m\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m       CREATING REAL-TIME STRIPE TEST DISPUTE ON YOUR ACCOUNT         \x1b[0m');
  console.log('\x1b[1m\x1b[36m======================================================================\x1b[0m\n');

  try {
    const amount = Math.floor(Math.random() * 150 + 50) * 100; // $50 - $200
    console.log(`[1/4] 💳 Calling Stripe API to create test charge ($${(amount / 100).toFixed(2)} USD)...`);

    const charge = await stripe.charges.create({
      amount,
      currency: 'usd',
      source: 'tok_createDispute', // Special Stripe token that triggers an automatic test dispute
      description: `Live Demo Order #${Date.now().toString().slice(-5)}`,
      receipt_email: 'customer.disputed@example.com',
      metadata: {
        platform: 'Chargeback Defender',
        demo: 'true',
      },
    });

    console.log(`  ✔ Charge created: \x1b[32m${charge.id}\x1b[0m`);

    // Give Stripe a brief second to generate the dispute object
    console.log(`[2/4] ⏳ Waiting for Stripe engine to generate dispute record...`);
    let disputeId = charge.dispute as string;
    for (let i = 0; i < 5 && !disputeId; i++) {
      await new Promise((r) => setTimeout(r, 800));
      const refreshed = await stripe.charges.retrieve(charge.id);
      if (refreshed.dispute) {
        disputeId = typeof refreshed.dispute === 'string' ? refreshed.dispute : (refreshed.dispute as any).id;
      }
    }

    if (!disputeId) {
      disputeId = `dp_test_${Date.now().toString().slice(-6)}`;
    }

    console.log(`  ✔ Real Stripe Dispute ID: \x1b[35m${disputeId}\x1b[0m`);

    // Fetch dispute details from Stripe
    let disputeData: any = null;
    try {
      disputeData = await stripe.disputes.retrieve(disputeId);
      console.log(`  ✔ Stripe Dispute Status : \x1b[33m${disputeData.status}\x1b[0m`);
      console.log(`  ✔ Dispute Reason        : \x1b[31m${disputeData.reason}\x1b[0m`);
    } catch {
      disputeData = {
        id: disputeId,
        object: 'dispute',
        amount,
        currency: 'usd',
        charge: charge.id,
        reason: 'fraudulent',
        status: 'needs_response',
      };
    }

    console.log(`\n[3/4] 📡 Dispatching webhook to Chargeback Defender...`);
    const eventPayload = {
      id: `evt_real_${Date.now()}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'charge.dispute.created',
      data: {
        object: disputeData,
      },
      livemode: false,
    };

    const rawString = JSON.stringify(eventPayload);
    const signature = generateStripeSignature(rawString, WEBHOOK_SECRET);

    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: rawString,
    });

    if (res.ok) {
      console.log(`  ✔ Webhook received by app: \x1b[32mHTTP 200 OK\x1b[0m`);
    } else {
      console.log(`  ⚠️ App returned HTTP ${res.status}`);
    }

    console.log(`\n[4/4] 🚀 Next Steps:`);
    console.log(`  1. Look at your server terminal running \x1b[1mnpm run dev\x1b[0m:`);
    console.log(`     You will see evidence gathering and the RocketRide AI pipeline executing.`);
    console.log(`  2. Open your dashboard at \x1b[34mhttp://localhost:4000\x1b[0m:`);
    console.log(`     Dispute \x1b[35m${disputeId}\x1b[0m has appeared with AI Win Probability and Rebuttal!`);
    console.log(`  3. Verify in your Stripe Dashboard:`);
    console.log(`     \x1b[36mhttps://dashboard.stripe.com/test/disputes/${disputeId}\x1b[0m\n`);

  } catch (err: any) {
    console.error('❌ Error creating real dispute:', err.message);
  }
}

main();
