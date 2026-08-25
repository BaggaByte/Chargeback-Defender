'use client';

import React from 'react';
import { ShieldCheck, Lock, KeyRound, History, Globe2, UserCog } from 'lucide-react';

const certifications = ['SOC 2 Type II', 'PCI DSS Level 1', 'GDPR', 'CCPA', 'ISO 27001 (in progress)'];

const controls = [
  {
    icon: Lock,
    title: 'Encryption everywhere',
    body: 'AES-256 at rest with managed KMS keys, TLS 1.3 in transit. Cardholder data is tokenized — raw PAN never touches our systems.',
  },
  {
    icon: UserCog,
    title: 'Role-based access control',
    body: 'Granular roles for analysts, risk managers, and auditors. SSO with SAML and SCIM provisioning on Enterprise plans.',
  },
  {
    icon: History,
    title: 'Append-only audit logging',
    body: 'Every evidence retrieval, score, approval, and submission is cryptographically logged and exportable for acquirer review.',
  },
  {
    icon: KeyRound,
    title: 'Scoped, read-only connectors',
    body: 'Integrations use least-privilege OAuth scopes and are verified with HMAC signatures before any event is processed.',
  },
  {
    icon: Globe2,
    title: 'Data residency & retention',
    body: 'Choose US or EU processing regions, with configurable retention windows and automated PII redaction after case closure.',
  },
  {
    icon: ShieldCheck,
    title: 'Dedicated infrastructure',
    body: 'Logically isolated multi-tenancy with per-organization encryption contexts and continuous third-party penetration testing.',
  },
];

export function SecurityVault() {
  return (
    <section id="security" className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Security &amp; compliance
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Built to handle dispute data with the care it requires.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
            Payment evidence is sensitive by definition. The platform is designed so your team, your
            acquirer, and your auditors can each get exactly the access they need — and nothing
            more.
          </p>
        </div>

        {/* Certification badges */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          {certifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3.5 py-2 text-xs font-medium text-ink-700 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-brand-700" />
              {cert}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {controls.map((control) => (
            <div
              key={control.title}
              className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 ring-1 ring-inset ring-brand-100">
                <control.icon className="h-4.5 w-4.5 text-brand-700" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-ink-900">
                {control.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{control.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-ink-500">
          Security documentation, penetration test summaries, and a completed CAIQ are available
          under NDA during vendor review.
        </p>
      </div>
    </section>
  );
}
