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
