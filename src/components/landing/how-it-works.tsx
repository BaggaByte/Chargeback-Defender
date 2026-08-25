'use client';

import React from 'react';
import { Plug, DatabaseZap, Send } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Plug,
    title: 'Connect your stack',
    body: 'Authorize payment processors, storefronts, and carriers through OAuth or scoped API keys. Dispute webhooks begin streaming into a unified case queue within minutes — no data warehouse required.',
    meta: 'Stripe · Shopify · PayPal · FedEx · UPS · Zendesk',
  },
  {
    number: '02',
    icon: DatabaseZap,
    title: 'Evidence assembles itself',
    body: 'Each new dispute triggers retrieval across payment records, delivery confirmation, authentication tokens, order history, and support threads — correlated to the cardholder, transaction, and applicable network rule.',
    meta: 'Average ingestion time: under 3 minutes',
  },
  {
    number: '03',
    icon: Send,
    title: 'Submit with confidence',
    body: 'Every dossier receives an evidence-strength score and a reason-code-specific rebuttal. High-confidence cases submit automatically; edge cases route to your risk team for one-click approval.',
    meta: 'Full audit trail on every action',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            From dispute webhook to submitted representment, without the manual lift.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-full top-10 hidden h-px w-5 bg-ink-300 lg:block"
                />
              )}
              <div className="h-full rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-900 text-white">
                    <step.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-ink-400">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-600">{step.body}</p>
                <p className="mt-4 border-t border-ink-100 pt-3.5 text-xs font-medium text-ink-500">
                  {step.meta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
