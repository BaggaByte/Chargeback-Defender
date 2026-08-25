'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  FileText,
  Clock,
  Lock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export function Hero() {
  const [activeTab, setActiveTab] = useState<'dossier' | 'rebuttal' | 'evidence'>('dossier');

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#0b0f19] border-b border-slate-800 overflow-hidden">
      {/* Structural container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium text-slate-200">Visa CE 3.0 & Mastercard Compliance Certified</span>
            <span className="text-slate-500">|</span>
            <span className="text-blue-400 font-medium">87.4% average win rate</span>
          </div>
        </div>

        {/* Hero Title and Value Proposition */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Autonomous dispute recovery for high-volume merchants.
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Reclaim lost chargeback revenue automatically. Chargeback Defender correlates payment telemetry, carrier delivery proof, and customer sessions into win-ready rebuttal dossiers.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#roi-calculator"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Calculate Revenue Recovery</span>
            </a>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Direct Stripe, Shopify & PayPal Sync
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Carrier GPS & Signature Proof
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              SOC 2 & PCI-DSS Level 1 Ready
            </span>
          </div>
        </div>

        {/* High-Fidelity Product UI Preview */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="rounded-xl border border-slate-800 bg-[#0e1320] shadow-2xl overflow-hidden">
            
            {/* Header bar of simulated app window */}
            <div className="bg-[#090d16] px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  dossier://cb-99421-vance.rebuttal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-medium">
                  Strength Score: 92/100 (Strong Case)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 border border-blue-800/80 text-blue-400">
                  Visa CE 3.0 Qualified
                </span>
              </div>
            </div>

            {/* Subnav inside UI */}
            <div className="bg-[#0b0f19] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dossier')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    activeTab === 'dossier'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Automated Dossier
                </button>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    activeTab === 'evidence'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Verified Exhibits (5)
                </button>
                <button
                  onClick={() => setActiveTab('rebuttal')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    activeTab === 'rebuttal'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Formal Rebuttal PDF
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>SLA Deadline: 18h 40m remaining</span>
              </div>
            </div>

            {/* UI Content Body */}
            <div className="p-5 sm:p-6 space-y-6">
              {activeTab === 'dossier' && (
                <div className="space-y-5">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Dispute Amount
                      </span>
                      <span className="text-base font-semibold text-white font-mono">$489.00 USD</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Reason Code
                      </span>
                      <span className="text-base font-semibold text-white">10.4 (Other Fraud)</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Cardholder
                      </span>
                      <span className="text-base font-semibold text-white">Marcus Vance</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Recommended Action
                      </span>
                      <span className="text-base font-semibold text-emerald-400">Submit Defense</span>
                    </div>
                  </div>

                  {/* Evidence Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">1. Prior Order History</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900">
                          +25 pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        2 undisputed transactions on same card in past 120 days matching billing address & IP device fingerprint.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">2. FedEx Carrier Proof</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900">
                          +30 pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Delivered to cardholder address. Signed by &quot;M. Vance&quot; with carrier GPS coordinates matching residential record.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">3. Authentication & AVS</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900">
                          +20 pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Full AVS Street/Zip match (Y/Y), CVV2 match (M), and 3-D Secure EMV 3DS frictionless authentication token.
                      </p>
                    </div>
                  </div>

                  {/* Submission Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400">
                      Generated via automated pipeline adhering to Visa Core Rules Sec 5.4.1.
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/"
                        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>Submit to Stripe Gateway</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold block">EXHIBIT_A_FEDEX_POD_773829104.PDF</span>
                      <span className="text-slate-400 text-[11px]">Carrier GPS: 37.7749° N, 122.4194° W • Signed: M. Vance</span>
                    </div>
                    <span className="text-emerald-400 text-[11px]">VERIFIED (SHA-256)</span>
                  </div>
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold block">EXHIBIT_B_STRIPE_3DS_AUTH_PAYLOAD.JSON</span>
                      <span className="text-slate-400 text-[11px]">ECI: 05 • DS_TRANS_ID: f48b2-99a1 • AVS: MATCH_FULL</span>
                    </div>
                    <span className="text-emerald-400 text-[11px]">VERIFIED (TOKEN)</span>
                  </div>
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold block">EXHIBIT_C_TERMS_CLICKWRAP_AUDIT.LOG</span>
                      <span className="text-slate-400 text-[11px]">IP: 198.51.100.42 • Accepted T&Cs v4.2 at checkout</span>
                    </div>
                    <span className="text-emerald-400 text-[11px]">VERIFIED (IMMUTABLE)</span>
                  </div>
                </div>
              )}

              {activeTab === 'rebuttal' && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
                  <div className="text-slate-400 border-b border-slate-800 pb-2">
                    FORMAL DISPUTE REPRESENTMENT MEMORANDUM • CASE ID: CB-99421
                  </div>
                  <p>
                    <strong>TO:</strong> Dispute Processing Division, Issuing Bank<br />
                    <strong>RE:</strong> Disputed Transaction ch_3Nk41q28 ($489.00 USD) • Reason Code 10.4
                  </p>
                  <p>
                    Merchant respectfully requests the immediate reversal of this chargeback pursuant to
                    <strong> Visa Compelling Evidence 3.0 (CE 3.0) standards</strong>. As documented in attached Exhibit A,
                    the goods were physically delivered to the cardholder&apos;s verified billing address and acknowledged by signature.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Quantitative Pillars */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-800 pt-10">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">$4.2M+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Chargeback Volume Recovered</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">87.4%</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Average Win Rate Across Gateways</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">&lt; 2.5 min</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Automated Evidence Ingestion</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Card Network Rule Compliance</div>
          </div>
        </div>

      </div>
    </section>
  );
}
