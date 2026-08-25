'use client';

import React from 'react';
import { Shield, Lock, FileCheck2, UserCheck, KeyRound, Server } from 'lucide-react';

export function SecurityVault() {
  const securityPillars = [
    {
      title: 'Field-Level AES-256 Encryption',
      category: 'DATA ENCRYPTION',
      icon: <Lock className="w-5 h-5 text-blue-400" />,
      description:
        'All cardholder data, transaction tokens, and evidence attachments are encrypted at rest with dedicated KMS hardware security modules.',
    },
    {
      title: 'Granular Role-Based Access Control',
      category: 'GOVERNANCE & PERMISSIONS',
      icon: <UserCheck className="w-5 h-5 text-indigo-400" />,
      description:
        'Strict separation of duties. Risk managers review and sign off on submissions while external auditors have read-only compliance access.',
    },
    {
      title: 'Immutable Cryptographic Audit Trail',
      category: 'COMPLIANCE AUDIT',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />,
      description:
        'Every evidence retrieval, scoring calculation, and gateway representment is recorded in an append-only log with SHA-256 signatures.',
    },
    {
      title: 'Zero-Trust Webhook Verification',
      category: 'GATEWAY SECURITY',
      icon: <KeyRound className="w-5 h-5 text-amber-400" />,
      description:
        'All incoming dispute events from Stripe, PayPal, and Shopify are verified with mandatory HMAC-SHA256 signature handshakes before ingestion.',
    },
    {
      title: 'Multi-Tenant Logical Isolation',
      category: 'INFRASTRUCTURE ISOLATION',
      icon: <Server className="w-5 h-5 text-cyan-400" />,
      description:
        'Strict database schema tenancy guarantees complete isolation of customer transactions, evidence vaults, and organizational policies.',
    },
    {
      title: 'Automated PII Redaction & Retention',
      category: 'PRIVACY & RETENTION',
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      description:
        'Configurable data retention policies automatically redact cardholder PII after dispute settlement deadlines pass.',
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 bg-[#0e1320] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>ENTERPRISE SECURITY & COMPLIANCE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Institutional-grade security from day one.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Built for regulated financial environments. We process sensitive customer and payment records with end-to-end encryption, strict role-based governance, and immutable audit ledgers.
          </p>
        </div>

        {/* 6 Security Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {securityPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  {pillar.icon}
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {pillar.category}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{pillar.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-normal">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
