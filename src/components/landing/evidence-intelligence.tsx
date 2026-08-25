'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Award, Scale, HelpCircle, Layers } from 'lucide-react';

export function EvidenceIntelligence() {
  const [selectedScheme, setSelectedScheme] = useState<'visa' | 'mastercard' | 'amex'>('visa');

  const scoringWeights = [
    { name: 'Carrier Proof-of-Delivery & GPS Geostamp', points: '+30 pts', mandatory: true, status: 'Verified' },
    { name: 'Visa CE 3.0 Prior Undisputed Orders (2+ matched)', points: '+25 pts', mandatory: true, status: 'Verified' },
    { name: 'Full AVS (Street/Zip) & CVV2 Match', points: '+15 pts', mandatory: false, status: 'Verified' },
    { name: '3-D Secure 2.2 EMV Frictionless Token (ECI 05)', points: '+10 pts', mandatory: false, status: 'Verified' },
    { name: 'Checkout Clickwrap T&C Audit Timestamp', points: '+10 pts', mandatory: false, status: 'Verified' },
    { name: 'Zendesk / Intercom Communication Log', points: '+2 pts', mandatory: false, status: 'Verified' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#0b0f19] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>CARD NETWORK COMPLIANCE MATRIX</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Algorithmic scoring grounded in real scheme rules.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Every rebuttal is built according to official card brand operating regulations. If a dispute qualifies under Visa CE 3.0 or Mastercard rules, our engine automatically structures the dossier for mandatory liability reversal.
          </p>
        </div>

        {/* 2-Column Scheme Matrix & Score Breakdown */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Card Network Selector (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tab buttons */}
            <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-900 border border-slate-800">
              <button
                onClick={() => setSelectedScheme('visa')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  selectedScheme === 'visa' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Visa (CE 3.0)
              </button>
              <button
                onClick={() => setSelectedScheme('mastercard')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  selectedScheme === 'mastercard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mastercard
              </button>
              <button
                onClick={() => setSelectedScheme('amex')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  selectedScheme === 'amex' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Amex & Discover
              </button>
            </div>

            {/* Scheme Rule Details Card */}
            <div className="p-6 rounded-xl border border-slate-800 bg-[#0e1320] space-y-4">
              {selectedScheme === 'visa' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Visa Compelling Evidence 3.0</h3>
                    <span className="text-[11px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                      Rule 10.4 Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Under Visa CE 3.0 rules introduced globally, merchants can invalidate 10.4 (Fraud) disputes prior to pre-arbitration by submitting at least two qualifying prior undisputed transactions on the same card with matching IP, device fingerprint, or physical delivery coordinates.
                  </p>
                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Automated 120-day customer transaction ledger lookup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Device fingerprint and ASN matching engine</span>
                    </div>
                  </div>
                </>
              )}

              {selectedScheme === 'mastercard' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Mastercard Dispute Rules 4837/4853</h3>
                    <span className="text-[11px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                      Fraud & Service Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mastercard mandates clear itemized billing descriptors, merchant return policy acknowledgment at checkout, and carrier proof of delivery. Rebuttals cite exact Section 3.2.1 provisions.
                  </p>
                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Carrier signature extraction & SKU match verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Checkout clickwrap timestamp hash insertion</span>
                    </div>
                  </div>
                </>
              )}

              {selectedScheme === 'amex' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Amex Dispute Inquiries (F29/C08)</h3>
                    <span className="text-[11px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                      Direct Resolution
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    American Express dispute protocols favor direct merchant-cardholder communication records and verified billing address delivery confirmations to resolve cardmember inquiries before formal chargebacks.
                  </p>
                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Helpdesk interaction thread stitching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Automatic inquiry-to-rebuttal transformation</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Evidence Scoring Table (Right 7 Cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0e1320] p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  CASE STRENGTH CALCULATION
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Scoring Breakdown Model</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-emerald-400">92 / 100</span>
                <span className="text-[11px] text-slate-400 block font-mono">Strong Defense Rating</span>
              </div>
            </div>

            {/* Weights List */}
            <div className="space-y-2.5">
              {scoringWeights.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-slate-200 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-400 font-semibold">{item.points}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-slate-400">
              Cases scoring 80+ points have a historical bank reversal rate exceeding 88.5% across Stripe, Shopify, and Braintree.
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
