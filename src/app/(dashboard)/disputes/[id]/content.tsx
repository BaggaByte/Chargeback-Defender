'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle,
  Send,
  User,
  Package,
  CreditCard,
  History,
  Sparkles,
  RefreshCw,
  Plus,
  FileCheck,
  CheckSquare,
  Square,
  Download,
  Eye,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  XCircle,
  Layers,
  MapPin,
  Laptop,
  Check,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisputeRecord, EvidenceItem, EvidenceCategory } from '@/lib/types';

interface DisputeDetailContentProps {
  dispute: DisputeRecord;
  order: any;
  evidenceList: EvidenceItem[];
}

export default function DisputeDetailContent({
  dispute: initialDispute,
  order: initialOrder,
  evidenceList: initialEvidenceList,
}: DisputeDetailContentProps) {
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeRecord>(initialDispute);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(
    dispute.evidenceList || initialEvidenceList || []
  );
  const [activeTab, setActiveTab] = useState<
    'ai_defense' | 'evidence_locker' | 'customer_360' | 'human_approval' | 'audit_trail'
  >('ai_defense');

  // AI Rebuttal Editor States
  const [rebuttalLetter, setRebuttalLetter] = useState(dispute.rebuttalLetter || '');
  const [rebuttalTone, setRebuttalTone] = useState<'firm' | 'concise' | 'detailed'>(
    dispute.rebuttalTone || 'firm'
  );
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingLetter, setIsSavingLetter] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Human Approval Checklist States
  const [checklist, setChecklist] = useState({
    verifiedDelivery: true,
    verifiedTerms: true,
    verifiedReasonCode: true,
    verifiedSessionIp: true,
  });
  const [approvalNotes, setApprovalNotes] = useState(dispute.approvalNotes || '');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isSimulatingVerdict, setIsSimulatingVerdict] = useState(false);

  // New Evidence Modal State
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvContent, setNewEvContent] = useState('');
  const [newEvType, setNewEvType] = useState<EvidenceCategory>('ORDER_DETAILS');
  const [newEvSource, setNewEvSource] = useState('Manual Upload');
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  // Dossier Preview Modal
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [now] = useState(() => Date.now());

  // Deadline calculation
  const deadlineDate = new Date(dispute.deadline);
  const hoursLeft = Math.max(0, Math.round((deadlineDate.getTime() - now) / (1000 * 3600)));
  const isUrgent = hoursLeft < 48 && dispute.status !== 'WON' && dispute.status !== 'LOST' && dispute.status !== 'SUBMITTED';

  // Toggle Evidence inclusion
  const toggleEvidenceInclusion = async (evidenceId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/disputes/${dispute.id}/evidence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceId,
          isIncludedInSubmission: !current,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceList((prev) =>
          prev.map((e) => (e.id === evidenceId ? { ...e, isIncludedInSubmission: !current } : e))
        );
      }
    } catch {}
  };

  // Add Evidence Handler
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvTitle || !newEvContent) return;
    setIsAddingEvidence(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newEvType,
          title: newEvTitle,
          content: newEvContent,
          sourceIntegration: newEvSource,
          confidenceScore: 92,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceList((prev) => [...prev, data.data]);
        setShowAddEvidenceModal(false);
        setNewEvTitle('');
        setNewEvContent('');
      }
    } catch {
    } finally {
      setIsAddingEvidence(false);
    }
  };

  // AI Rebuttal Generation
  const handleGenerateAIRebuttal = async (tone: 'firm' | 'concise' | 'detailed') => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-rebuttal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: dispute.id,
          tone,
          customInstructions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRebuttalLetter(data.data.rebuttalLetter);
        setRebuttalTone(tone);
        setDispute((prev) => ({
          ...prev,
          rebuttalLetter: data.data.rebuttalLetter,
          rebuttalTone: tone,
        }));
      }
    } catch {
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save manual letter edits
  const handleSaveLetter = async () => {
    setIsSavingLetter(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            rebuttalLetter,
            rebuttalTone,
          },
          auditInfo: {
            actorName: 'Operator User',
            actorRole: 'DISPUTE_ANALYST',
            action: 'REBUTTAL_LETTER_EDITED',
            details: 'Edited and saved dispute rebuttal narrative.',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 3000);
      }
    } catch {
    } finally {
      setIsSavingLetter(false);
    }
  };

  // Human Approval & Submit to Processor
  const handleApproveAndSubmit = async () => {
    const allChecked = Object.values(checklist).every(Boolean);
    if (!allChecked) {
      alert('Please complete all compliance verification checklist items prior to final submission.');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id}/approve-and-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: 'Elena Rostova (Risk Manager)',
          reviewerRole: 'RISK_MANAGER',
          approvalNotes,
          verifiedChecklist: Object.keys(checklist),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispute(data.data);
        setActiveTab('human_approval');
        router.refresh();
      }
    } catch {
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Simulate processor verdict
  const handleSimulateVerdict = async (outcome: 'WON' | 'LOST') => {
    setIsSimulatingVerdict(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id}/simulate-verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });
      const data = await res.json();
      if (data.success) {
        setDispute(data.data);
        router.refresh();
      }
    } catch {
    } finally {
      setIsSimulatingVerdict(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return <Badge variant="success">DISPUTE WON</Badge>;
      case 'LOST':
        return <Badge variant="danger">DISPUTE LOST</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="pending">PENDING HUMAN APPROVAL</Badge>;
      case 'SUBMITTED':
        return <Badge variant="submitted">TRANSMITTED TO PROCESSOR</Badge>;
      case 'EVIDENCE_COLLECTING':
        return <Badge variant="warning">EVIDENCE COLLECTING</Badge>;
      default:
        return <Badge variant="default">OPEN FOR REVIEW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/disputes" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Disputes</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold">{dispute.externalDisputeId}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDossierModal(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Dossier</span>
          </Button>
        </div>
      </div>

      {/* Hero Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {dispute.externalDisputeId}
              </h1>
              {getStatusBadge(dispute.status)}
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md uppercase">
                {dispute.processor}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                {dispute.cardBrand.toUpperCase()} •••• {dispute.cardLast4}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <span>Reason:</span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {dispute.reason}
                </span>
                <span className="text-slate-400 font-normal">(Code {dispute.reasonCode})</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Cardholder:</span>
                <strong className="text-slate-900">{dispute.cardholderName}</strong>
              </div>
              {dispute.customer?.email && (
                <div className="flex items-center gap-1 text-slate-500">
                  <span>({dispute.customer.email})</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            {/* Amount box */}
            <div className="text-right pr-4 border-r border-slate-200">
              <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
                Disputed Value
              </span>
              <span className="text-2xl font-bold text-slate-900">
                ${Number(dispute.amount).toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block">+${dispute.feeAmount} network fee</span>
            </div>

            {/* Deadline box */}
            <div className={`p-3 rounded-lg border text-left min-w-[150px] ${
              isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`} />
                <span className={isUrgent ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                  {hoursLeft > 0 ? `${hoursLeft} Hours Left` : 'Deadline Passed'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Due {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-200 mt-6 pt-3 overflow-x-auto">
          {[
            { id: 'ai_defense', label: 'AI Defense & Rebuttal', icon: Sparkles },
            { id: 'evidence_locker', label: `Evidence Locker (${evidenceList.length})`, icon: Layers },
            { id: 'customer_360', label: 'Customer 360 & Timeline', icon: User },
            { id: 'human_approval', label: 'Human Sign-Off & Submit', icon: CheckSquare },
            { id: 'audit_trail', label: 'Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT 1: AI Defense & Rebuttal */}
      {activeTab === 'ai_defense' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Rebuttal Letter Generator & Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Processor Rebuttal Letter</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formal legal response tailored to {dispute.processor.toUpperCase()} and {dispute.cardBrand.toUpperCase()} regulations.
                  </p>
                </div>

                {/* Tone Controls */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  {(['firm', 'concise', 'detailed'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => handleGenerateAIRebuttal(tone)}
                      disabled={isGeneratingAI}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                        rebuttalTone === tone
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Refinement Box */}
              <div className="flex items-center gap-2 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Custom AI prompt instructions (e.g. emphasize Visa CE 3.0 prior transactions, mention GPS signature...)"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-white border border-indigo-200 px-3 py-1.5 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleGenerateAIRebuttal(rebuttalTone)}
                  disabled={isGeneratingAI}
                  className="shrink-0 flex items-center gap-1 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAI ? 'Drafting...' : 'AI Rewrite'}</span>
                </Button>
              </div>

              {/* Textarea Editor */}
              <div className="relative">
                <textarea
                  rows={16}
                  value={rebuttalLetter}
                  onChange={(e) => setRebuttalLetter(e.target.value)}
                  className="w-full font-mono text-xs text-slate-800 bg-slate-50/50 p-4 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
                  placeholder="Drafting defense letter..."
                />
              </div>

              {/* Action save bar */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {saveSuccessNotice && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved changes
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveLetter}
                    disabled={isSavingLetter}
                    className="text-xs"
                  >
                    {isSavingLetter ? 'Saving...' : 'Save Rebuttal'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('human_approval')}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <span>Proceed to Sign-Off</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Col: AI Strength & Compelling Evidence Strategy */}
          <div className="space-y-6">
            {/* Strength Radar Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Defense Strength & Probability</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  High Win Potential
                </span>
              </h3>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-600">Evidence Completeness Score</span>
                    <span className="font-bold text-slate-900">{dispute.evidenceStrengthScore || 92}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${dispute.evidenceStrengthScore || 92}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-600">Estimated Win Probability</span>
                    <span className="font-bold text-emerald-600">{dispute.winProbability || 88}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${dispute.winProbability || 88}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Network Rule Match */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Applicable Compelling Evidence Rule
                </span>
                <p className="font-semibold text-slate-900">
                  {dispute.aiAnalysis?.applicableCompellingEvidenceRule ||
                    (dispute.cardBrand === 'visa' ? 'Visa Compelling Evidence 3.0 (CE 3.0)' : 'Mastercard CE 2.0 Standard')}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Liability shifts to the issuer when merchant proves 3DS OTP verification or delivery GPS signature matching cardholder records.
                </p>
              </div>

              {/* Identified Strengths */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-900 block">Identified Core Strengths</span>
                <div className="space-y-1.5">
                  {(dispute.aiAnalysis?.strengths || [
                    'Direct signature match on FedEx delivery record',
                    '3DS 2.2 authentication OTP validated on card network',
                    'Cardholder portal login and invoice download logged after delivery',
                  ]).map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Evidence Recommendations */}
              {dispute.aiAnalysis?.missingEvidenceRecommendations && dispute.aiAnalysis.missingEvidenceRecommendations.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recommended Enhancements</span>
                  </span>
                  <div className="space-y-2">
                    {dispute.aiAnalysis.missingEvidenceRecommendations.map((rec, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-md text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-amber-900">
                          <span>{rec.title}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                            {rec.impact} IMPACT
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800/80">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: Evidence Locker */}
      {activeTab === 'evidence_locker' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Compiled Evidence Locker</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage, audit, and toggle exhibits included in the final processor transmission package.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddEvidenceModal(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Evidence Item</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className={`bg-white border p-5 rounded-xl shadow-sm space-y-3 transition-all ${
                  item.isIncludedInSubmission
                    ? 'border-indigo-200 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{item.sourceIntegration}</span>
                  </div>

                  <button
                    onClick={() => toggleEvidenceInclusion(item.id, item.isIncludedInSubmission)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-indigo-600"
                  >
                    {item.isIncludedInSubmission ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{item.isIncludedInSubmission ? 'Included' : 'Excluded'}</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                    {item.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-600">{item.confidenceScore}% Confidence</span>
                    {item.fileSize && <span>• {item.fileSize}</span>}
                  </div>
                  {item.verifiedAt && (
                    <span className="text-[11px] text-slate-400">
                      Verified {new Date(item.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Customer 360 & Timeline */}
      {activeTab === 'customer_360' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Col: Customer Profile Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                  {(dispute.customer?.name || dispute.cardholderName).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {dispute.customer?.name || dispute.cardholderName}
                  </h3>
                  <p className="text-xs text-slate-500">{dispute.customer?.email || 'customer@example.com'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Lifetime Value</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    ${(dispute.customer?.lifetimeValue || dispute.amount).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Orders</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {dispute.customer?.totalOrdersCount || 1} Orders
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Past Disputes</span>
                  <span className="text-sm font-bold text-emerald-600 mt-0.5 block">
                    {dispute.customer?.previousDisputesWon || 0} Won / {dispute.customer?.previousDisputesCount || 0} Total
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Fraud Risk Index</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {dispute.customer?.fraudRiskScore || 12}/100 (Low)
                  </span>
                </div>
              </div>

              {dispute.customer?.address && (
                <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Verified Delivery Address
                  </span>
                  <p className="text-slate-600 pl-4">{dispute.customer.address}</p>
                </div>
              )}

              {/* Device & Session Telemetry */}
              <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" /> Authenticated Sessions Log
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(dispute.customer?.sessionLogs || []).map((sess) => (
                    <div key={sess.id} className="p-2 bg-slate-50 rounded text-[11px] space-y-0.5 border border-slate-100">
                      <div className="flex items-center justify-between text-slate-800 font-medium">
                        <span>{sess.action}</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(sess.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-500 font-mono text-[10px]">
                        IP: {sess.ipAddress} • {sess.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Right 2 Cols: Chronological Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Unified Evidence Timeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full chronological journey establishing authorized purchase, delivery, and post-fulfillment usage.
                </p>
              </div>

              <div className="relative pl-6 space-y-6 border-l-2 border-indigo-100 ml-3">
                {/* Event 1: Account Creation */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase">Step 1 • Account Setup</span>
                    <h4 className="text-xs font-bold text-slate-900">Account Created & Master Terms Accepted</h4>
                    <p className="text-xs text-slate-600">
                      Cardholder agreed to Terms of Service (v2025.1) with recorded IP and timestamp.
                    </p>
                  </div>
                </div>

                {/* Event 2: Order Placed & 3DS Verified */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase">Step 2 • Payment Authorization</span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Order Placed for ${Number(dispute.amount).toFixed(2)} (3DS 2.0 Authenticated)
                    </h4>
                    <p className="text-xs text-slate-600">
                      AVS Match: EXACT MATCH • CVC Match: EXACT MATCH • 3D-Secure liability shifted to issuing bank.
                    </p>
                  </div>
                </div>

                {/* Event 3: Fulfillment & Carrier Signature */}
                {dispute.order?.carrierStatus && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase">Step 3 • Physical Delivery</span>
                      <h4 className="text-xs font-bold text-slate-900">
                        {dispute.order.carrier || 'FedEx Express'} Delivered ({dispute.order.carrierStatus})
                      </h4>
                      <p className="text-xs text-slate-600">
                        Signed by &quot;{dispute.order.deliverySignature || 'M. Vance'}&quot;. GPS coordinates match billing address.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event 4: Post Delivery Engagement */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase">Step 4 • Active Utility</span>
                    <h4 className="text-xs font-bold text-slate-900">Post-Delivery Login & Invoice Download</h4>
                    <p className="text-xs text-slate-600">
                      Customer logged into portal from identical IP address and downloaded VAT invoice.
                    </p>
                  </div>
                </div>

                {/* Event 5: Chargeback Received */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-rose-600 ring-4 ring-rose-50" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-rose-600 uppercase">Step 5 • Chargeback Ingested</span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Dispute Filed via {dispute.processor.toUpperCase()}: &quot;{dispute.reason}&quot;
                    </h4>
                    <p className="text-xs text-slate-600">
                      Auto-ingested and matched to existing customer evidence profile.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 4: Human Sign-Off & Submission */}
      {activeTab === 'human_approval' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span>Enterprise Human Approval Gate</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Chargeback Defender strictly prohibits automated unverified submissions. A designated risk reviewer must confirm all four verification points.
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pre-Submission Compliance Checklist
              </h4>

              <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.verifiedDelivery}
                  onChange={(e) => setChecklist({ ...checklist, verifiedDelivery: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    1. Verified Proof of Fulfillment & Delivery
                  </span>
                  <span className="text-slate-500">
                    Carrier tracking scan or digital software provisioning logs match the cardholder&apos;s registered address and identity.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.verifiedTerms}
                  onChange={(e) => setChecklist({ ...checklist, verifiedTerms: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    2. Confirmed Terms & Refund Policy Agreement
                  </span>
                  <span className="text-slate-500">
                    Customer completed explicit click-wrap agreement with timestamped IP audit log.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.verifiedReasonCode}
                  onChange={(e) => setChecklist({ ...checklist, verifiedReasonCode: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    3. Specific Card Brand Reason Code Alignment
                  </span>
                  <span className="text-slate-500">
                    Rebuttal narrative directly refutes reason code &quot;{dispute.reasonCode}&quot; ({dispute.reason}) under {dispute.cardBrand.toUpperCase()} rules.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.verifiedSessionIp}
                  onChange={(e) => setChecklist({ ...checklist, verifiedSessionIp: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    4. Screened for Contradictory Evidence
                  </span>
                  <span className="text-slate-500">
                    No discrepancies detected between customer correspondence, carrier manifest, and gateway timestamps.
                  </span>
                </div>
              </label>
            </div>

            {/* Approval Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Reviewer Verification Notes</label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add audit notes regarding this submission approval..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Sign-Off Action Button */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Current Status</span>
                  <span className="text-xs text-slate-500">
                    {dispute.status === 'SUBMITTED' ? 'Dispute package transmitted to processor gateway' : 'Ready for human sign-off'}
                  </span>
                </div>
                {getStatusBadge(dispute.status)}
              </div>

              {dispute.status !== 'SUBMITTED' && dispute.status !== 'WON' && dispute.status !== 'LOST' ? (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={handleApproveAndSubmit}
                  disabled={isSubmittingApproval}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingApproval
                      ? 'Transmitting to Gateway...'
                      : `Approve & Submit Rebuttal to ${dispute.processor.toUpperCase()}`}
                  </span>
                </Button>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Approved by <strong>{dispute.approvedByUserName || 'Elena Rostova (Risk Manager)'}</strong> on{' '}
                      {dispute.approvedAt ? new Date(dispute.approvedAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>

                  {/* Simulator for processor outcome */}
                  <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      Processor Resolution Simulator (Demo & Testing)
                    </span>
                    <p className="text-xs text-slate-500">
                      Simulate acquiring bank final decision webhook to test balance recovery and audit log triggers.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSimulateVerdict('WON')}
                        disabled={isSimulatingVerdict || dispute.status === 'WON'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Simulate Won (+${Number(dispute.amount).toFixed(2)})</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleSimulateVerdict('LOST')}
                        disabled={isSimulatingVerdict || dispute.status === 'LOST'}
                        className="text-xs flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Simulate Lost</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 5: Audit Trail */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Timestamped record of all AI inferences, manual adjustments, approvals, and gateway events for dispute {dispute.externalDisputeId}.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              {
                time: dispute.createdAt,
                actor: 'Processor Webhook Ingestion',
                action: 'DISPUTE_INGESTED',
                details: `Received chargeback notice for $${Number(dispute.amount).toFixed(2)} from ${dispute.processor.toUpperCase()}`,
              },
              {
                time: dispute.updatedAt,
                actor: 'Chargeback Defender AI',
                action: 'AI_STRATEGY_GENERATED',
                details: `Evaluated evidence strength at ${dispute.evidenceStrengthScore || 92}% with ${dispute.cardBrand.toUpperCase()} CE rules.`,
              },
              ...(dispute.approvedAt
                ? [
                    {
                      time: dispute.approvedAt,
                      actor: dispute.approvedByUserName || 'Risk Manager',
                      action: 'HUMAN_APPROVAL_STAMPED',
                      details: `Approved submission: "${dispute.approvalNotes || 'All checks passed.'}"`,
                    },
                  ]
                : []),
              ...(dispute.resolvedAt
                ? [
                    {
                      time: dispute.resolvedAt,
                      actor: `${dispute.processor.toUpperCase()} Gateway Webhook`,
                      action: `DISPUTE_${dispute.status}_FINALIZED`,
                      details: `Case closed with status: ${dispute.status}`,
                    },
                  ]
                : []),
            ].map((log, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-bold text-slate-600">
                      {log.action}
                    </span>
                    <span>{log.actor}</span>
                  </div>
                  <p className="text-slate-600 pl-0.5">{log.details}</p>
                </div>
                <span className="text-slate-400 text-[11px] font-mono whitespace-nowrap">
                  {new Date(log.time).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Manual Evidence Exhibit</h3>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Exhibit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse Dispatch CCTV Log, Signed Delivery Note..."
                  value={newEvTitle}
                  onChange={(e) => setNewEvTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Evidence Category</label>
                  <select
                    value={newEvType}
                    onChange={(e) => setNewEvType(e.target.value as EvidenceCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="SHIPPING_PROOF">Shipping / Delivery Proof</option>
                    <option value="ORDER_DETAILS">Order & Invoicing Record</option>
                    <option value="CUSTOMER_COMMUNICATION">Customer Support Chat/Email</option>
                    <option value="TOS_AGREEMENT">Terms & Agreement Signature</option>
                    <option value="ACTIVITY_LOGS">IP / Device Telemetry Logs</option>
                    <option value="REFUND_POLICY">Refund & Cancellation Policy</option>
                    <option value="OTHER">Other Supplementary Exhibit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Source System</label>
                  <input
                    type="text"
                    value={newEvSource}
                    onChange={(e) => setNewEvSource(e.target.value)}
                    placeholder="e.g. FedEx, Zendesk, Stripe..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Detailed Evidence Statement / Transcript</label>
                <textarea
                  rows={4}
                  required
                  value={newEvContent}
                  onChange={(e) => setNewEvContent(e.target.value)}
                  placeholder="Describe the proof, tracking references, timestamps, or paste communication excerpts..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddEvidenceModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isAddingEvidence}
                >
                  {isAddingEvidence ? 'Saving...' : 'Add to Dossier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Dossier PDF / Print Preview Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 text-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold">Processor-Ready Evidence Dossier</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs"
                >
                  Print / Save as PDF
                </Button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Dossier Document Content */}
            <div className="p-8 border border-slate-300 rounded-lg bg-white space-y-6 font-serif text-xs leading-relaxed print:border-none print:p-0">
              <div className="border-b pb-4 space-y-1">
                <div className="flex justify-between font-sans">
                  <span className="font-bold text-sm text-slate-900">ACME SAAS CORP / CHARGEBACK DEFENDER</span>
                  <span className="text-slate-500">Case Ref: {dispute.externalDisputeId}</span>
                </div>
                <p className="font-sans text-[11px] text-slate-500">
                  Transmitted via {dispute.processor.toUpperCase()} Gateway to Card Network Dispute Resolution
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans text-xs bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Disputed Transaction</span>
                  <strong>Amount:</strong> ${Number(dispute.amount).toFixed(2)} {dispute.currency}<br />
                  <strong>Reason:</strong> {dispute.reason} (Code {dispute.reasonCode})<br />
                  <strong>Network:</strong> {dispute.cardBrand.toUpperCase()} ending in {dispute.cardLast4}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cardholder & Fulfillment</span>
                  <strong>Cardholder:</strong> {dispute.cardholderName}<br />
                  <strong>Delivery Ref:</strong> {dispute.order?.trackingNumber || 'FX-9821739812US'}<br />
                  <strong>Fulfillment Status:</strong> {dispute.order?.carrierStatus || 'DELIVERED'}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-sans font-bold text-sm text-slate-900 border-b pb-1">
                  I. Formal Statement of Representment
                </h4>
                <div className="whitespace-pre-wrap font-mono text-[11px] bg-slate-50/70 p-4 rounded border border-slate-200 leading-relaxed">
                  {rebuttalLetter}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-sans font-bold text-sm text-slate-900 border-b pb-1">
                  II. Attached Compelling Evidence Exhibits ({evidenceList.filter((e) => e.isIncludedInSubmission).length})
                </h4>
                <div className="space-y-2 font-sans">
                  {evidenceList
                    .filter((e) => e.isIncludedInSubmission)
                    .map((e, idx) => (
                      <div key={e.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>Exhibit {String.fromCharCode(65 + idx)}: {e.title}</span>
                          <span className="text-slate-500 font-normal text-[11px]">{e.type}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{e.content}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 font-sans text-[11px] text-slate-500 flex justify-between">
                <span>Verified by Merchant Risk Operations</span>
                <span>Signature Stamp: {dispute.approvedByUserName || 'Elena Rostova (Risk Manager)'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
