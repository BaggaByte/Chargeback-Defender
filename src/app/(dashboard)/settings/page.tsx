'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Zap,
  Key,
  Bell,
  Clock,
  Check,
  Building2,
  Copy,
  RefreshCw,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme SaaS Corp');
  const [timezone, setTimezone] = useState('America/New_York (EST)');
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(true);
  const [autoPilotThreshold, setAutoPilotThreshold] = useState(85);
  const [defaultTone, setDefaultTone] = useState<'firm' | 'concise' | 'detailed'>('firm');
  const [slaWarningHours, setSlaWarningHours] = useState(48);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // RocketRide Cluster & Pipeline State
  const [clusterStatus, setClusterStatus] = useState<'ready' | 'in_process_fallback' | 'unreachable' | null>(null);
  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [isTestingCluster, setIsTestingCluster] = useState(false);
  const [isDeployingPipeline, setIsDeployingPipeline] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);

  const handleTestCluster = async () => {
    setIsTestingCluster(true);
    try {
      const res = await fetch('/api/rocketride/status');
      const data = await res.json();
      if (data.success) {
        setClusterInfo(data.data);
        setClusterStatus(data.data.status);
      } else {
        setClusterStatus('unreachable');
      }
    } catch {
      setClusterStatus('unreachable');
    } finally {
      setIsTestingCluster(false);
    }
  };

  const handleDeployPipeline = async () => {
    setIsDeployingPipeline(true);
    try {
      const res = await fetch('/api/rocketride/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineName: 'dispute-analyzer' }),
      });
      const data = await res.json();
      if (data.success) {
        setDeployResult(data.data);
      } else {
        setDeployResult({ status: 'failed', message: data.error });
      }
    } catch (err: any) {
      setDeployResult({ status: 'failed', message: err.message });
    } finally {
      setIsDeployingPipeline(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated evidence harvesting, Visa CE 3.0 rules, defense tone, and API webhook secrets.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Organization Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Organization Profile & Currency</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Company Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Operational Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI & Dispute Autopilot Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>AI Evidence & Autopilot Defense Rules</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer border border-slate-200">
              <input
                type="checkbox"
                checked={autoPilotEnabled}
                onChange={(e) => setAutoPilotEnabled(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">
                  Enable Automated Evidence Harvesting & AI Dossier Assembly
                </span>
                <span className="text-slate-500">
                  Immediately upon webhook arrival, fetch carrier delivery signatures, 3DS logs, and user session telemetry without manual intervention.
                </span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Default Rebuttal Tone</label>
                <select
                  value={defaultTone}
                  onChange={(e) => setDefaultTone(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="firm">Firm Legal (Card Brand Rule Compliance)</option>
                  <option value="concise">Concise Transactional (Fast Review)</option>
                  <option value="detailed">Detailed Evidence-Heavy (High-Value)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Deadline Warning Threshold</label>
                <select
                  value={slaWarningHours}
                  onChange={(e) => setSlaWarningHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value={24}>24 Hours Before Expiration</option>
                  <option value={48}>48 Hours Before Expiration (Recommended)</option>
                  <option value={72}>72 Hours Before Expiration</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RocketRide AI Engine & Marketplace Cluster */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>RocketRide AI Engine & Marketplace Cluster</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your portable `.pipe` pipeline deployment, remote cluster connectivity, and anti-hallucination execution mode.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestCluster}
                disabled={isTestingCluster}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingCluster ? 'animate-spin' : ''}`} />
                <span>{isTestingCluster ? 'Probing Cluster...' : 'Test Connectivity'}</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeployPipeline}
                disabled={isDeployingPipeline}
                className="text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              >
                <Play className={`w-3.5 h-3.5 ${isDeployingPipeline ? 'animate-spin' : ''}`} />
                <span>{isDeployingPipeline ? 'Staging...' : 'Deploy Pipeline'}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Cluster Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    clusterStatus === 'ready'
                      ? 'bg-emerald-500'
                      : clusterStatus === 'in_process_fallback'
                      ? 'bg-amber-500'
                      : clusterStatus === 'unreachable'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-slate-900 text-xs capitalize">
                  {clusterStatus ? clusterStatus.replace(/_/g, ' ') : 'Ready (Verified Mode)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Registered Pipeline
              </span>
              <span className="font-mono text-xs font-semibold text-slate-900 block truncate">
                dispute-analyzer.pipe (v2.1.0)
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Cluster Endpoint
              </span>
              <span className="font-mono text-[11px] text-slate-600 block truncate">
                {clusterInfo?.endpoint || 'https://api.rocketride.ai:443'}
              </span>
            </div>
          </div>

          {/* Test results banner */}
          {clusterInfo && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-indigo-950">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cluster Probe Succeeded</span>
                </span>
                {clusterInfo.latencyMs !== undefined && (
                  <span className="text-[10px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Latency: {clusterInfo.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-900/80">
                Mode: <strong>{clusterInfo.configured ? 'Live Remote Engine' : 'Deterministic In-Process Engine'}</strong> • Supported Stages:{' '}
                {clusterInfo.capabilities?.slice(0, 5).join(', ')} (+{Math.max(0, (clusterInfo.capabilities?.length || 0) - 5)} more)
              </p>
            </div>
          )}

          {/* Deploy results banner */}
          {deployResult && (
            <div
              className={`p-3 rounded-lg border text-xs space-y-1 ${
                deployResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  {deployResult.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>
                    {deployResult.status === 'success' ? 'Pipeline Staged & Activated' : 'Deployment Failed'}
                  </span>
                </span>
                {deployResult.deploymentId && (
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200">
                    ID: {deployResult.deploymentId}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90">{deployResult.message}</p>
            </div>
          )}
        </div>

        {/* API Keys & Webhooks */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Developer API Keys & Webhook Endpoints</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Production Webhook Endpoint</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://api.chargebackdefender.io/v1/webhooks/incoming_events"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700 text-[11px]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('https://api.chargebackdefender.io/v1/webhooks/incoming_events')}
                  className="shrink-0 flex items-center gap-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Live API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="cbd_live_99481029841029841a098bc"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700 text-[11px]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('cbd_live_99481029841029841a098bc')}
                  className="shrink-0 flex items-center gap-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1 text-xs">
              <Check className="w-4 h-4" /> Settings updated successfully
            </span>
          ) : (
            <span />
          )}

          <Button type="submit" variant="primary" size="md" className="text-xs font-semibold">
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
