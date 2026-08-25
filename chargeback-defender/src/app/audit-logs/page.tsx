'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Laptop,
  CheckCircle,
  FileText,
  Lock,
  ArrowRight,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockAuditLogs } from '@/db/seed-data';
import { AuditLogRecord } from '@/lib/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/audit-logs');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          setLogs(data.data);
        }
      } catch {}
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (selectedEntityType !== 'ALL' && log.entityType !== selectedEntityType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only ledger of all AI inferences, evidence attachments, human sign-offs, and gateway interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SOC 2 Report</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action type, or entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Entity Types</option>
            <option value="DISPUTE">Disputes</option>
            <option value="EVIDENCE">Evidence</option>
            <option value="INTEGRATION">Integrations & Webhooks</option>
            <option value="USER">User / RBAC</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor & Role</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{log.userRole}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-slate-700 line-clamp-1 max-w-md">{log.details}</p>
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {log.ipAddress}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-indigo-600 font-semibold hover:text-indigo-800">
                        View
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Audit Record Inspector</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Action</span>
                  <span className="font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Entity Type</span>
                  <span className="font-semibold text-slate-800">{selectedLog.entityType} ({selectedLog.entityId})</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Actor</span>
                <span className="font-semibold text-slate-900">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Event Description</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-mono">
                  {selectedLog.details}
                </p>
              </div>

              <div className="flex justify-between text-slate-400 text-[11px] font-mono pt-2 border-t border-slate-100">
                <span>IP: {selectedLog.ipAddress}</span>
                <span>{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
