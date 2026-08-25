'use client';

import React from 'react';
import { XCircle, CheckCircle2, Layers, Zap, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ProblemSection() {
  return (
    <section id="platform" className="py-20 sm:py-28 bg-[#0e1320] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <span>OPERATIONAL BOTTLENECK</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Most chargebacks are lost due to fragmented evidence, not illegitimacy.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            When a dispute strikes, critical proof is scattered across your payment processor, e-commerce cart, courier portal, and support desk. Manual manual assembly takes hours and misses card scheme deadlines.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column 1: Manual Process */}
          <div className="rounded-xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-semibold text-white text-base">Traditional Manual Workflow</h3>
                <p className="text-xs text-slate-400 mt-0.5">Spreadsheet chasing, PDF stitching & copy-paste</p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono bg-red-950/60 border border-red-800/80 text-red-400 font-medium">
                ~32% Win Rate
              </span>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Siloed Data Retrieval:</strong>
                  <span className="text-slate-400">Risk analysts manually log into 4-6 different dashboards (Stripe, Shopify, FedEx, Zendesk) to gather receipts and tracking numbers.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Missed Scheme Deadlines:</strong>
                  <span className="text-slate-400">Card brand response windows (7 to 20 days) lapse while waiting for courier proof-of-delivery or customer support logs.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Generic Rebuttals:</strong>
                  <span className="text-slate-400">Static Word templates that fail to cite specific card brand rules (e.g., Visa CE 3.0, Mastercard Dispute Administration).</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">High Staff Overhead:</strong>
                  <span className="text-slate-400">Each dispute consumes 45–90 minutes of dedicated analyst time, making small-dollar disputes unprofitable to fight.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Chargeback Defender */}
          <div className="rounded-xl border border-blue-600/40 bg-[#0c1428] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-4">
              <div>
                <h3 className="font-semibold text-white text-base">Chargeback Defender Engine</h3>
                <p className="text-xs text-blue-300 mt-0.5">Automated multi-source evidence harvesting & legal rebuttal</p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-bold">
                87.4% Win Rate
              </span>
            </div>

            <div className="space-y-4 text-xs text-slate-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Autonomous API Ingestion:</strong>
                  <span className="text-slate-300">Webhooks trigger immediate background retrieval of orders, courier GPS signatures, AVS/CVV matching, and customer session logs.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Visa CE 3.0 & Mastercard Compliance:</strong>
                  <span className="text-slate-300">Algorithmic qualification matches qualifying prior transactions (device ID, IP, biometric) to mandate liability reversal.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Tailored Legal Rebuttal Generation:</strong>
                  <span className="text-slate-300">Generates precise, structured evidence dossiers with exact card network rule citations and chronological exhibit indices.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Configurable Human Oversight:</strong>
                  <span className="text-slate-300">Auto-submit high-confidence dossiers (&gt;85 score) or route edge cases to risk managers for single-click approval.</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
