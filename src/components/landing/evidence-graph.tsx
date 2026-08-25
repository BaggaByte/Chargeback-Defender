'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Truck,
  ShoppingBag,
  MessageSquare,
  Globe,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Database,
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  harvestedData: string[];
  rebuttalImpact: string;
  sampleProof: string;
}

export function EvidenceGraph() {
  const [selectedSource, setSelectedSource] = useState<string>('gateway');

  const sources: DataSource[] = [
    {
      id: 'gateway',
      name: 'Payment Processor & 3DS',
      category: 'PAYMENT INTEGRITY',
      icon: <CreditCard className="w-5 h-5 text-blue-400" />,
      harvestedData: [
        'AVS Address Verification (Street: Match, Zip: Match)',
        'Card Verification Value (CVV2 / CVC: Match)',
        '3D Secure 2.2 EMV Authentication (ECI: 05 / 02)',
        'Transaction Risk Score & Radar Assessment',
      ],
      rebuttalImpact: 'Establishes cardholder possession and authorization at moment of purchase.',
      sampleProof: 'ds_trans_id: "9942a-881c" • eci: "05" • avs_result_code: "Y"',
    },
    {
      id: 'courier',
      name: 'Carrier & Logistics (FedEx/UPS)',
      category: 'FULFILLMENT & DELIVERY',
      icon: <Truck className="w-5 h-5 text-emerald-400" />,
      harvestedData: [
        'Signed Proof-of-Delivery (POD) with name & signature bitmap',
        'Carrier GPS delivery geostamp (Lat/Long precision)',
        'Weight and parcel dimension verification matching invoice',
        'Delivery timestamp and driver confirmation scan',
      ],
      rebuttalImpact: 'Rebuts "Item Not Received" (Reason 13.1) and confirms physical drop at cardholder address.',
      sampleProof: 'tracking: "773829104" • lat: 37.7749 • lng: -122.4194 • signed_by: "M. VANCE"',
    },
    {
      id: 'store',
      name: 'E-Commerce Platform & Cart',
      category: 'ORDER & TERMS AUDIT',
      icon: <ShoppingBag className="w-5 h-5 text-indigo-400" />,
      harvestedData: [
        'Itemized invoice with SKU specifications and tax calculations',
        'Clickwrap checkout Terms & Conditions acceptance timestamp',
        'Customer billing and shipping address match',
        'Prior order purchase ledger on same account',
      ],
      rebuttalImpact: 'Proves explicit consent to merchant cancellation & refund policies.',
      sampleProof: 'terms_version: "v4.2" • accepted_at: "2026-08-20T14:22:10Z" • order_id: "#10429"',
    },
    {
      id: 'support',
      name: 'Customer Support & Helpdesk',
      category: 'COMMUNICATION HISTORY',
      icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
      harvestedData: [
        'Zendesk / Intercom email interaction logs',
        'Order dispatch notifications and confirmed open events',
        'Post-delivery onboarding and portal login confirmations',
        'Absence of prior cancellation or return requests before dispute',
      ],
      rebuttalImpact: 'Proves cardholder was actively utilizing product/service and never requested standard refund.',
      sampleProof: 'ticket_id: "#ZD-49210" • email_opened: true • last_login: "2026-08-24"',
    },
    {
      id: 'telemetry',
      name: 'Device & Session Telemetry',
      category: 'CYBERSECURITY & FINGERPRINT',
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      harvestedData: [
        'Customer IP address and ISP ASN match to shipping locality',
        'Hardware canvas fingerprint and browser user-agent string',
        'Session duration, page view depth, and checkout interaction telemetry',
        'Device recurring token matching prior undisputed transactions',
      ],
      rebuttalImpact: 'Fulfills Visa Compelling Evidence 3.0 (CE 3.0) device matching mandates for liability shift.',
      sampleProof: 'ip: "198.51.100.42" • device_hash: "sha256:8f9a2..." • ce3_qualified: true',
    },
  ];

  const current = sources.find((s) => s.id === selectedSource) || sources[0];

  return (
    <section id="engine" className="py-20 sm:py-28 bg-[#0b0f19] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>CROSS-SYSTEM EVIDENCE SYNTHESIS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            5 data sources correlated into one defense package.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Card issuing banks reject generic rebuttals. Chargeback Defender systematically harvests data from all 5 operational layers to construct airtight dossiers that satisfy issuing bank burden of proof.
          </p>
        </div>

        {/* Interactive Master-Detail Explorer */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Source Selectors (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            {sources.map((item) => {
              const isSelected = item.id === selectedSource;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedSource(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'bg-[#131b2e] border-blue-500 shadow-sm'
                      : 'bg-[#0e1320] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-900/60' : 'bg-slate-900'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                        {item.category}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                          Active Source
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white mt-1 block truncate">
                      {item.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspector Card (Right 7 Cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0e1320] p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  {current.icon}
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    {current.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{current.name}</h3>
                </div>
              </div>
            </div>

            {/* Harvested Data Points List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                Automated Evidence Ingested:
              </span>
              <div className="space-y-2">
                {current.harvestedData.map((data, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{data}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rebuttal Impact */}
            <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-900/50 space-y-1">
              <span className="text-[11px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
                Legal & Bank Representment Impact
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {current.rebuttalImpact}
              </p>
            </div>

            {/* Raw Ingestion Payload Preview */}
            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[11px] text-slate-400">INGESTION_PAYLOAD_SAMPLE:</span>
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
                <code>{current.sampleProof}</code>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
