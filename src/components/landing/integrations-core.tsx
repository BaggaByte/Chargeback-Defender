'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ShoppingBag,
  Truck,
  MessageSquare,
  Plug,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export function IntegrationsCore() {
  const integrations = [
    {
      name: 'Stripe Payments',
      category: 'Payment Processor',
      data: 'Dispute lifecycle webhooks, Radar risk metrics, 3DS authentication tokens',
      status: 'Native Sync',
      icon: <CreditCard className="w-5 h-5 text-blue-400" />,
    },
    {
      name: 'Shopify Payments',
      category: 'E-Commerce Platform',
      data: 'Itemized invoices, SKU taxonomy, checkout clickwrap timestamp',
      status: 'Native Sync',
      icon: <ShoppingBag className="w-5 h-5 text-emerald-400" />,
    },
    {
      name: 'PayPal & Braintree',
      category: 'Payment Processor',
      data: 'Seller protection proof, buyer transaction ledger, IPN dispute events',
      status: 'Native Sync',
      icon: <CreditCard className="w-5 h-5 text-indigo-400" />,
    },
    {
      name: 'FedEx Web Services',
      category: 'Carrier Logistics',
      data: 'Carrier signature capture, GPS delivery geostamp, parcel weight match',
      status: 'Live API',
      icon: <Truck className="w-5 h-5 text-amber-400" />,
    },
    {
      name: 'UPS Track & Trace',
      category: 'Carrier Logistics',
      data: 'Proof-of-delivery receipts, delivery timestamp, driver confirmation',
      status: 'Live API',
      icon: <Truck className="w-5 h-5 text-amber-400" />,
    },
    {
      name: 'Zendesk & Intercom',
      category: 'Customer Support',
      data: 'Support tickets, order confirmation emails, refund inquiry history',
      status: 'Event Streams',
      icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
    },
  ];

  return (
    <section id="integrations" className="py-20 sm:py-28 bg-[#0b0f19] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Plug className="w-3.5 h-3.5 text-blue-400" />
            <span>COMMERCE ECOSYSTEM CONNECTORS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Connects to your entire commerce and logistics stack.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Plug-and-play integrations with zero custom engineering. One-click OAuth authorization and webhook listeners synchronize evidence in real-time.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-800 bg-[#0e1320] space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  {item.icon}
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{item.name}</h3>
                <span className="text-xs font-mono text-slate-400">{item.category}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1 border-t border-slate-800/80">
                {item.data}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
