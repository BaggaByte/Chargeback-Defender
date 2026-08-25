import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { LogoStrip } from '@/components/landing/logo-strip';
import { ProblemSection } from '@/components/landing/problem-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PlatformSection } from '@/components/landing/platform-section';
import { Outcomes } from '@/components/landing/outcomes';
import { IntegrationsCore } from '@/components/landing/integrations-core';
import { RoiCalculator } from '@/components/landing/roi-calculator';
import { SecurityVault } from '@/components/landing/security-vault';
import { PricingSection } from '@/components/landing/pricing-section';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Chargeback Defender — Payment Dispute Recovery for High-Volume Merchants',
  description:
    'Chargeback Defender compiles payment records, delivery confirmation, and customer history into network-compliant dispute representments — automatically, before your response window closes.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900 antialiased selection:bg-brand-100 selection:text-brand-900">
      <Navbar />
      <main>
        {/* Value proposition with live product preview */}
        <Hero />

        {/* Customer credibility markers */}
        <LogoStrip />

        {/* The operational cost of manual dispute handling */}
        <ProblemSection />

        {/* Connect → Correlate → Submit */}
        <HowItWorks />

        {/* Evidence engine, rule intelligence, controls */}
        <PlatformSection />

        {/* Measured outcomes and customer quote */}
        <Outcomes />

        {/* Connector coverage by category */}
        <IntegrationsCore />

        {/* Interactive recovery model */}
        <RoiCalculator />

        {/* Certifications and security controls */}
        <SecurityVault />

        {/* Plans and billing options */}
        <PricingSection />

        {/* Closing conversion moment */}
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
