'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-lg border-b border-ink-200 shadow-[0_1px_2px_rgb(15_23_42/0.04)]'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Brand */}
          <Link href="/landing" className="flex items-center gap-2.5 shrink-0 focus:outline-none">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-900 text-white">
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink-900">
              Chargeback Defender
            </span>
          </Link>

          {/* Primary nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-md px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              Sign in
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink-800"
            >
              Request a demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-ink-200 bg-white px-6 pb-6 pt-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-ink-100 py-3 text-sm font-medium text-ink-700"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Request a demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
