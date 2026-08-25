'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'Evidence Engine', href: '#engine' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'ROI Model', href: '#roi-calculator' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800 shadow-sm'
          : 'bg-[#0b0f19] border-b border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Zone 1: Single Brand element */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-100 text-sm tracking-tight">
              Chargeback <span className="text-blue-400 font-medium">Defender</span>
            </span>
          </Link>

          {/* Zone 2: Navigation Links (Single row, single line labels) */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-md border border-slate-700/80 hover:border-slate-600 bg-slate-900/60 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-white px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <span>Open App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b0f19] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-2 border-b border-slate-800/60"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full text-center text-xs font-medium text-slate-300 py-2.5 rounded-md border border-slate-700 bg-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="w-full text-center text-xs font-semibold text-white py-2.5 rounded-md bg-blue-600"
            >
              Open App
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
