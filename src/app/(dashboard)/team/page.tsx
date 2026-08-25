'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Check,
  X,
  Mail,
  Lock,
  User,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'RISK_MANAGER' | 'DISPUTE_ANALYST' | 'AUDITOR';
  status: 'active' | 'invited';
  lastActive: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'tm-1',
      name: 'Elena Rostova',
      email: 'elena.rostova@acme.com',
      role: 'RISK_MANAGER',
      status: 'active',
      lastActive: 'Just now',
    },
    {
      id: 'tm-2',
      name: 'David Miller',
      email: 'david.miller@acme.com',
      role: 'DISPUTE_ANALYST',
      status: 'active',
      lastActive: '2 hours ago',
    },
    {
      id: 'tm-3',
      name: 'Sophia Chen',
      email: 'sophia.chen@acme.com',
      role: 'SUPER_ADMIN',
      status: 'active',
      lastActive: 'Yesterday',
    },
    {
      id: 'tm-4',
      name: 'KPMG External Auditor',
      email: 'compliance-auditor@kpmg-audit.com',
      role: 'AUDITOR',
      status: 'active',
      lastActive: '3 days ago',
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'SUPER_ADMIN' | 'RISK_MANAGER' | 'DISPUTE_ANALYST' | 'AUDITOR'>('DISPUTE_ANALYST');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setMembers((prev) => [
      ...prev,
      {
        id: `tm-${Date.now()}`,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        lastActive: 'Invitation Pending',
      },
    ]);

    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
  };

  const permissionsMatrix = [
    { permission: 'View Disputes & Evidence 360', admin: true, manager: true, analyst: true, auditor: true },
    { permission: 'Auto-Triage & AI Rebuttal Drafting', admin: true, manager: true, analyst: true, auditor: false },
    { permission: 'Edit Rebuttal Letters & Exhibits', admin: true, manager: true, analyst: true, auditor: false },
    { permission: 'Human Approval & Processor Transmission', admin: true, manager: true, analyst: false, auditor: false },
    { permission: 'Manage Payment & Shipping Integrations', admin: true, manager: false, analyst: false, auditor: false },
    { permission: 'Access Full Compliance Audit Logs', admin: true, manager: true, analyst: true, auditor: true },
    { permission: 'Manage Team RBAC & Billing Settings', admin: true, manager: false, analyst: false, auditor: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team & Role-Based Access Control</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce segregation of duties: Only certified Risk Managers & Super Admins can stamp sign-off submissions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Organization Members ({members.length})</h2>
          <p className="text-xs text-slate-500">Users with authenticated access to Acme SaaS Corp</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Name & Email</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Active</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{member.name}</div>
                    <span className="text-[11px] text-slate-500">{member.email}</span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                      {member.status === 'active' ? 'Active' : 'Invited'}
                    </Badge>
                  </td>

                  <td className="px-6 py-4 text-slate-500">{member.lastActive}</td>

                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-700 font-medium">
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Granular Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Enterprise RBAC Permission Matrix</h2>
          <p className="text-xs text-slate-500">Explicit segregation of permissions across organizational roles</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Permission / Capability</th>
                <th className="px-4 py-3 text-center">Super Admin</th>
                <th className="px-4 py-3 text-center">Risk Manager</th>
                <th className="px-4 py-3 text-center">Dispute Analyst</th>
                <th className="px-4 py-3 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((item) => (
                <tr key={item.permission} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.permission}</td>
                  <td className="px-4 py-3 text-center">
                    {item.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.analyst ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.auditor ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jordan.hayes@acme.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Role & Authority</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="DISPUTE_ANALYST">Dispute Analyst (Compile & Draft)</option>
                  <option value="RISK_MANAGER">Risk Manager (Sign-Off & Approve Submissions)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                  <option value="AUDITOR">Auditor (Read-Only & Compliance)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
