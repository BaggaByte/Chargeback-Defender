'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  BarChart3,
  PlugZap,
  ScrollText,
  Settings,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronDown,
  Building2,
  UserCheck,
  Check,
  Plus,
  Radio,
  X,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem } from '@/lib/types';
import { mockNotifications } from '@/db/seed-data';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeOrg, setActiveOrg] = useState('Acme SaaS Corp');
  const [activeRole, setActiveRole] = useState<'SUPER_ADMIN' | 'RISK_MANAGER' | 'DISPUTE_ANALYST'>('RISK_MANAGER');
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      } catch {}
    };
    load();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const triggerSimulatedWebhook = async (type: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: type,
          payload: {
            customerName: 'Marcus Vance',
            customerEmail: 'marcus.vance@techcorp.io',
            amount: 720.0,
            reason: 'Fraudulent - Cardholder Unrecognized',
            processor: 'stripe',
            cardBrand: 'visa',
            cardLast4: '4291',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerAlert(data.message);
        setTimeout(() => setBannerAlert(null), 6000);
        fetchNotifications();
      }
    } catch {
    } finally {
      setIsSimulating(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/disputes', label: 'Disputes', icon: FileSpreadsheet },
    { href: '/customers', label: 'Evidence 360', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/integrations', label: 'Integrations', icon: PlugZap },
    { href: '/audit-logs', label: 'Audit Trail', icon: ScrollText },
    { href: '/team', label: 'Team & RBAC', icon: UserCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Banner Alert if webhook simulated */}
      {bannerAlert && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <Zap className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">{bannerAlert}</span>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="text-indigo-200 hover:text-white text-xs font-semibold p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header - Single row 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-base tracking-tight hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="whitespace-nowrap">Chargeback Defender</span>
            </Link>

            {/* Org Switcher */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[130px] truncate">{activeOrg}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showOrgMenu && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Organization
                  </div>
                  {['Acme SaaS Corp', 'Apex Global Retail', 'CloudScale Technologies'].map((org) => (
                    <button
                      key={org}
                      onClick={() => {
                        setActiveOrg(org);
                        setShowOrgMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md flex items-center justify-between"
                    >
                      <span>{org}</span>
                      {activeOrg === org && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navLinks.slice(0, 6).map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Notifications */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Webhook Ingest Action */}
            <button
              onClick={() => triggerSimulatedWebhook('CHARGEBACK_RECEIVED')}
              disabled={isSimulating}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors whitespace-nowrap"
              title="Simulate an incoming real-time chargeback webhook event"
            >
              <Radio className={`w-3 h-3 text-indigo-600 ${isSimulating ? 'animate-ping' : ''}`} />
              <span>Simulate Ingest</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Alerts & Deadlines
                      </h4>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No recent notifications.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <Link
                          key={notif.id}
                          href={notif.linkUrl || '/disputes'}
                          onClick={() => setShowNotifMenu(false)}
                          className={`block p-2.5 rounded-lg hover:bg-slate-50 transition-colors ${
                            !notif.read ? 'bg-indigo-50/40 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {notif.severity === 'critical' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : notif.severity === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-900 font-semibold truncate">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="max-w-[110px] truncate">
                  {activeRole === 'SUPER_ADMIN' ? 'Super Admin' : activeRole === 'RISK_MANAGER' ? 'Risk Lead' : 'Analyst'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulate RBAC Role
                  </div>
                  {[
                    { id: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full write, config & user admin' },
                    { id: 'RISK_MANAGER', name: 'Risk Manager', desc: 'Can sign-off & approve rebuttals' },
                    { id: 'DISPUTE_ANALYST', name: 'Dispute Analyst', desc: 'Can compile evidence & draft' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveRole(r.id as any);
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md block"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{r.name}</span>
                        {activeRole === r.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Secondary Subnav for Tablet/Mobile or overflow */}
        <div className="lg:hidden px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/70">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Chargeback Defender Enterprise</span>
            <span>•</span>
            <span>Visa CE 3.0 & Mastercard CE 2.0 Compliant</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/audit-logs" className="hover:text-slate-800 transition-colors">
              Audit Stream
            </Link>
            <Link href="/team" className="hover:text-slate-800 transition-colors">
              RBAC Policies
            </Link>
            <Link href="/integrations" className="hover:text-slate-800 transition-colors">
              Webhooks & APIs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
