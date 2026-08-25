'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  X,
  CreditCard,
  Truck,
  MessageSquare,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export function InteractiveCaseWorkbench() {
  const [activeTab, setActiveTab] = useState<'summary' | 'exhibits' | 'memo' | 'audit'>('summary');
  const [submitted, setSubmitted] = useState(false);

  const exhibits = [
    {
      id: 'ex-1',
      title: 'FedEx Proof of Delivery Receipt',
      category: 'CARRIER LOGISTICS',
      strength: '+30 pts',
      icon: <Truck className="w-4 h-4 text-emerald-400" />,
      hash: 'sha256:7f89b...32a1',
      detail: 'Signed by "M. Vance" at 1420 Market St, San Francisco, CA. GPS Lat 37.7749, Long -122.4194.',
    },
    {
      id: 'ex-2',
      title: 'Visa 3D Secure 2.2 Auth Payload',
      category: 'AUTHENTICATION',
      strength: '+20 pts',
      icon: <CreditCard className="w-4 h-4 text-blue-400" />,
      hash: 'token:eci_05_auth_9921',
      detail: 'ECI 05 (Frictionless Authenticated), AVS Street & Zip Match (Y/Y), CVV2 Match (M).',
    },
    {
      id: 'ex-3',
      title: 'Itemized Order Invoice & Receipt',
      category: 'ORDER AUDIT',
      strength: '+15 pts',
      icon: <ShoppingBag className="w-4 h-4 text-indigo-400" />,
      hash: 'inv_88421_synced',
      detail: 'Itemized SKU: Annual Pro Subscription ($380.00). Billed to Marcus Vance.',
    },
    {
      id: 'ex-4',
      title: 'Checkout Terms of Service Clickwrap Log',
      category: 'LEGAL CONSENT',
      strength: '+15 pts',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      hash: 'log_ip_198.51.100.42',
      detail: 'Explicit affirmative checkbox accepting Terms & Cancellation Policy at checkout timestamp.',
    },
    {
      id: 'ex-5',
      title: 'Zendesk Ticket Interaction Thread',
      category: 'COMMUNICATION',
      strength: '+12 pts',
      icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
      hash: 'zd_ticket_49210',
      detail: 'Customer opened onboarding email and logged into application 4 hours prior to dispute filing.',
    },
  ];

  return (
    <section id="workbench" className="py-20 sm:py-28 bg-[#0b0f19] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <span>LIVE PRODUCT WORKBENCH</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Inspect a live defense dossier.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            See how Chargeback Defender automatically packages raw evidence, calculates case strength, and generates court-ready legal rebuttals.
          </p>
        </div>

        {/* The Workbench UI Container */}
        <div className="mt-12 rounded-xl border border-slate-800 bg-[#0e1320] shadow-2xl overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-[#090d16] p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-900/60 border border-blue-700/80 text-blue-400 flex items-center justify-center font-bold text-xs">
                CB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Dispute #CB-88421</span>
                  <span className="text-xs font-mono text-slate-400">• $380.00 USD</span>
                </div>
                <span className="text-xs text-slate-400">Cardholder: Marcus Vance (Visa Ending in 4219)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold">
                Strength: 92/100 (Strong Case)
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Reason 10.4 (Fraud)
              </span>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="bg-[#0b0f19] px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  activeTab === 'summary' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Case Overview
              </button>
              <button
                onClick={() => setActiveTab('exhibits')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  activeTab === 'exhibits' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verified Exhibits (5)
              </button>
              <button
                onClick={() => setActiveTab('memo')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  activeTab === 'memo' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Legal Rebuttal Memo
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  activeTab === 'audit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cryptographic Audit Log
              </button>
            </div>

            <div className="text-slate-400 text-[11px] font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>SLA Response Due: 18h 32m</span>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="p-5 sm:p-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block font-mono uppercase text-[10px]">TRANSACTION ID</span>
                    <span className="text-white font-mono font-medium">ch_3N82b991z0a</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono uppercase text-[10px]">GATEWAY / PROCESSOR</span>
                    <span className="text-white font-medium">Stripe Payments (US)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono uppercase text-[10px]">QUALIFICATION</span>
                    <span className="text-blue-400 font-medium">Visa CE 3.0 Qualified</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono uppercase text-[10px]">ESTIMATED WIN PROBABILITY</span>
                    <span className="text-emerald-400 font-bold font-mono">89.4%</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-1">Defense Strategy Assessment:</strong>
                  The cardholder claimed the $380.00 transaction was unauthorized (Reason Code 10.4). However, our automated engine successfully extracted 2 prior undisputed orders on the same card, carrier proof of delivery signed by the cardholder, and verified 3-D Secure EMV authentication. This satisfies Visa Compelling Evidence 3.0 rules and entitles the merchant to a mandatory liability reversal.
                </div>
              </div>
            )}

            {activeTab === 'exhibits' && (
              <div className="space-y-3">
                {exhibits.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-slate-800 shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{item.detail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-emerald-400 font-bold">{item.strength}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {item.hash}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'memo' && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
                <div className="text-slate-400 border-b border-slate-800 pb-2 flex justify-between">
                  <span>DISPUTE REBUTTAL MEMORANDUM • REF: CB-88421</span>
                  <span>VISA CORE RULES SEC. 5.4.1</span>
                </div>
                <p>
                  <strong>TO:</strong> Dispute Processing Department, Issuing Bank<br />
                  <strong>FROM:</strong> Risk & Payments Operations<br />
                  <strong>DATE:</strong> August 25, 2026<br />
                  <strong>SUBJECT:</strong> Representment of Chargeback ch_3N82b991z0a ($380.00 USD)
                </p>
                <p>
                  Merchant hereby submits formal compelling evidence refuting Reason Code 10.4 (Fraud - Card-Absent).
                  Under <strong>Visa Compelling Evidence 3.0 (CE 3.0)</strong>, liability is shifted to the issuer upon presentation of qualifying historical customer purchase records and delivery verification.
                </p>
                <p>
                  As detailed in Exhibits A through E, the cardholder successfully completed EMV 3-D Secure authentication (ECI 05), explicitly agreed to merchant terms, and received physical delivery signed by Marcus Vance.
                </p>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between text-slate-300 text-[11px]">
                  <span>[2026-08-25 09:12:01 UTC] Webhook received from Stripe (dispute.created)</span>
                  <span className="text-blue-400">INGESTED</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between text-slate-300 text-[11px]">
                  <span>[2026-08-25 09:12:03 UTC] Carrier POD #773829104 retrieved and verified</span>
                  <span className="text-emerald-400">SUCCESS</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between text-slate-300 text-[11px]">
                  <span>[2026-08-25 09:12:04 UTC] Visa CE 3.0 qualification evaluation: MATCH (2 prior orders)</span>
                  <span className="text-emerald-400">QUALIFIED</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between text-slate-300 text-[11px]">
                  <span>[2026-08-25 09:12:05 UTC] Case strength scored: 92/100. Dossier compiled.</span>
                  <span className="text-cyan-400">READY</span>
                </div>
              </div>
            )}

            {/* Bottom Action bar */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {submitted ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Dossier submitted to Stripe Gateway. Issuing bank confirmation pending.
                  </span>
                ) : (
                  <span>Ready for representment transmission. Zero manual data entry needed.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={submitted}
                  className={`px-4 py-2 rounded text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    submitted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitted ? 'Submitted' : 'Submit Representment'}</span>
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Open in Full App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
