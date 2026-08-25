'use client';

import React, { useState } from 'react';
import {
  PlugZap,
  CheckCircle2,
  RefreshCw,
  Zap,
  Radio,
  ExternalLink,
  ShieldAlert,
  Send,
  Code,
  Layers,
  Truck,
  MessageSquare,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockIntegrations } from '@/db/seed-data';
import { IntegrationRecord } from '@/lib/types';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>(mockIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Webhook Simulator States
  const [webhookEventType, setWebhookEventType] = useState<string>('CHARGEBACK_RECEIVED');
  const [webhookPayloadJson, setWebhookPayloadJson] = useState(
    JSON.stringify(
      {
        customerName: 'Marcus Vance',
        customerEmail: 'marcus.vance@techcorp.io',
        amount: 520.0,
        reason: 'Fraudulent - Cardholder Unrecognized',
        processor: 'stripe',
        cardBrand: 'visa',
        cardLast4: '4291',
      },
      null,
      2
    )
  );
  const [isFiringWebhook, setIsFiringWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any | null>(null);

  const filteredIntegrations = integrations.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: id, action: 'TOGGLE_STATUS' }),
      });
      const data = await res.json();
      if (data.success) {
        setIntegrations((prev) => prev.map((i) => (i.id === id ? data.data : i)));
      }
    } catch {}
  };

  const handleSyncNow = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: id, action: 'SYNC_NOW' }),
      });
      const data = await res.json();
      if (data.success) {
        setIntegrations((prev) => prev.map((i) => (i.id === id ? data.data : i)));
      }
    } catch {
    } finally {
      setTimeout(() => setSyncingId(null), 800);
    }
  };

  const handleFireWebhook = async () => {
    setIsFiringWebhook(true);
    setWebhookResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(webhookPayloadJson);
      } catch {
        alert('Invalid JSON payload');
        setIsFiringWebhook(false);
        return;
      }

      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: webhookEventType,
          payload: parsed,
        }),
      });
      const data = await res.json();
      setWebhookResult(data);
    } catch (err: any) {
      setWebhookResult({ error: err.message });
    } finally {
      setIsFiringWebhook(false);
    }
  };

  const loadWebhookTemplate = (type: string) => {
    setWebhookEventType(type);
    if (type === 'CHARGEBACK_RECEIVED') {
      setWebhookPayloadJson(
        JSON.stringify(
          {
            customerName: 'Marcus Vance',
            customerEmail: 'marcus.vance@techcorp.io',
            amount: 640.0,
            reason: 'Product not received',
            processor: 'stripe',
            cardBrand: 'visa',
            cardLast4: '4291',
          },
          null,
          2
        )
      );
    } else if (type === 'FEDEX_DELIVERY_PROOF') {
      setWebhookPayloadJson(
        JSON.stringify(
          {
            trackingNumber: 'FX-9821739812US',
            carrierStatus: 'DELIVERED',
            signedBy: 'M. Vance',
            gpsCoordinates: '44.0462° N, 123.0220° W',
          },
          null,
          2
        )
      );
    } else if (type === 'PRE_DISPUTE_ALERT') {
      setWebhookPayloadJson(
        JSON.stringify(
          {
            alertNetwork: 'Ethoca / Verifi CDRN',
            alertId: 'eth_alert_99014',
            amount: 180.0,
            cardLast4: '4291',
            actionRequired: 'Issue immediate refund within 24h to prevent chargeback',
          },
          null,
          2
        )
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations & Connectors</h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect acquiring gateways, order channels, shipping carriers, and pre-chargeback alert networks.
          </p>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: 'All Connectors' },
          { id: 'PAYMENT_PROCESSOR', label: 'Payment Processors' },
          { id: 'ECOMMERCE', label: 'E-Commerce' },
          { id: 'SHIPPING', label: 'Shipping & Carriers' },
          { id: 'CRM_SUPPORT', label: 'CRM & Support' },
          { id: 'ALERT_NETWORK', label: 'Dispute Alert Networks' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {item.category === 'SHIPPING' ? (
                      <Truck className="w-5 h-5" />
                    ) : item.category === 'CRM_SUPPORT' ? (
                      <MessageSquare className="w-5 h-5" />
                    ) : item.category === 'ALERT_NETWORK' ? (
                      <Zap className="w-5 h-5 text-amber-500" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.displayName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{item.apiKeyMasked || 'Webhook-only'}</p>
                  </div>
                </div>

                <Badge variant={item.status === 'connected' ? 'success' : 'outline'}>
                  {item.status === 'connected' ? 'Active' : 'Disabled'}
                </Badge>
              </div>

              <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Synced Records:</span>
                  <strong className="text-slate-900">{item.syncedDisputesCount}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Sync:</span>
                  <span className="text-slate-700">{item.lastSyncAt}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleStatus(item.id)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                {item.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSyncNow(item.id)}
                disabled={syncingId === item.id || item.status !== 'connected'}
                className="text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${syncingId === item.id ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Sync Now</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Webhook Simulator Console */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Live Webhook Simulator & Test Harness</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trigger real-time webhook payloads into Chargeback Defender&apos;s ingestion queue to test auto-triage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['CHARGEBACK_RECEIVED', 'FEDEX_DELIVERY_PROOF', 'PRE_DISPUTE_ALERT'] as const).map((t) => (
              <button
                key={t}
                onClick={() => loadWebhookTemplate(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  webhookEventType === t
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'CHARGEBACK_RECEIVED' ? '1. Ingest Dispute' : t === 'FEDEX_DELIVERY_PROOF' ? '2. Delivery Scan' : '3. Pre-Dispute Alert'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: JSON Payload Editor */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Webhook JSON Body</label>
            <textarea
              rows={8}
              value={webhookPayloadJson}
              onChange={(e) => setWebhookPayloadJson(e.target.value)}
              className="w-full bg-slate-950 font-mono text-xs text-indigo-200 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              size="md"
              variant="primary"
              onClick={handleFireWebhook}
              disabled={isFiringWebhook}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-indigo-500 hover:bg-indigo-600"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isFiringWebhook ? 'Sending Webhook...' : 'Transmit Simulated Webhook'}</span>
            </Button>
          </div>

          {/* Right: Response Inspector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Ingestion Response</label>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-h-[210px] font-mono text-xs text-emerald-400 overflow-x-auto">
              {webhookResult ? (
                <pre>{JSON.stringify(webhookResult, null, 2)}</pre>
              ) : (
                <span className="text-slate-500 italic">
                  Press &quot;Transmit Simulated Webhook&quot; to test real-time event pipeline...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
