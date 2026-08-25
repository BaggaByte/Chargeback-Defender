'use client';

import React from 'react';
import { CreditCard, ShoppingBag, Truck, LifeBuoy } from 'lucide-react';

const categories = [
  {
    icon: CreditCard,
    title: 'Payment processors',
    items: ['Stripe', 'PayPal', 'Braintree', 'Adyen'],
    note: 'Dispute webhooks, auth records, Radar signals',
  },
  {
    icon: ShoppingBag,
    title: 'Commerce platforms',
    items: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento'],
    note: 'Orders, terms acceptance, subscription usage',
  },
  {
    icon: Truck,
    title: 'Carriers & logistics',
    items: ['FedEx', 'UPS', 'USPS', 'DHL'],
    note: 'Proof of delivery, signatures, GPS coordinates',
  },
  {
    icon: LifeBuoy,
    title: 'Support desks',
    items: ['Zendesk', 'Intercom', 'Salesforce', 'Gorgias'],
    note: 'Tickets, refund history, buyer correspondence',
  },
];

export function IntegrationsCore() {
  return (
    <section id="integrations" className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Integrations
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Connected to the systems where your evidence already lives.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              Read-only connectors sync automatically. A custom REST or webhook integration is
              available on Enterprise for internal systems and ERPs.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 ring-1 ring-inset ring-brand-100">
                  <cat.icon className="h-4.5 w-4.5 text-brand-700" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-ink-900">{cat.title}</h3>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {cat.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-sm font-medium text-ink-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-500">{cat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
