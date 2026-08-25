import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProblemSection } from '@/components/landing/problem-section';
import { EvidenceGraph } from '@/components/landing/evidence-graph';
import { EnginePipeline } from '@/components/landing/engine-pipeline';
import { EvidenceIntelligence } from '@/components/landing/evidence-intelligence';
import { AiHumanSplit } from '@/components/landing/ai-human-split';
import { InteractiveCaseWorkbench } from '@/components/landing/interactive-case-workbench';
import { RecoveryMetrics } from '@/components/landing/recovery-metrics';
import { RoiCalculator } from '@/components/landing/roi-calculator';
import { IntegrationsCore } from '@/components/landing/integrations-core';
import { SecurityVault } from '@/components/landing/security-vault';
import { PricingSection } from '@/components/landing/pricing-section';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Chargeback Defender — Autonomous Dispute Recovery for High-Volume Merchants',
  description:
    'Reclaim lost chargeback revenue automatically. Chargeback Defender correlates payment telemetry, carrier delivery proof, and customer sessions into win-ready rebuttal dossiers.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased selection:bg-blue-600/30 selection:text-white">
      {/* Institutional Top Bar */}
      <Navbar />

      {/* Hero Section with Live Product Dossier Preview */}
      <Hero />

      {/* Problem Comparison: Manual Bottleneck vs Autonomous Defender */}
      <ProblemSection />

      {/* 5-Source Evidence Architecture */}
      <EvidenceGraph />

      {/* 6-Stage Autonomous Engine Pipeline */}
      <EnginePipeline />

      {/* Card Network Rules (Visa CE 3.0, Mastercard, Amex) & Scoring */}
      <EvidenceIntelligence />

      {/* Risk Governance & Autopilot Modes */}
      <AiHumanSplit />

      {/* Interactive Case Inspector */}
      <InteractiveCaseWorkbench />

      {/* Recovery Metrics & Volume Numbers */}
      <RecoveryMetrics />

      {/* Financial ROI Calculator */}
      <RoiCalculator />

      {/* Connector Integrations Grid */}
      <IntegrationsCore />

      {/* Enterprise Security Architecture */}
      <SecurityVault />

      {/* Transparent Pricing Plans */}
      <PricingSection />

      {/* Direct Action Final CTA */}
      <FinalCta />

      {/* Clean Footer */}
      <Footer />
    </div>
  );
}
