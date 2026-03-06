'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const BETA_PASSWORD = 'IliadADS2026';
const STORAGE_KEY = 'brandbox_beta_auth';

export default function BetaGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setAuthorized(true);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === BETA_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  // Don't flash the gate during SSR/hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900" />
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-light.png"
            alt="Iliad Interactive"
            width={180}
            height={50}
            priority
            className="object-contain"
          />
        </div>

        {/* App Title */}
        <h1 className="text-4xl font-bold text-white font-headline mb-2">
          BrandBOX-Creator
        </h1>
        <p className="text-amber-400 font-semibold text-sm mb-1">
          AI Marketing Content Engine
        </p>
        <p className="text-slate-400 text-sm italic mb-10">
          &ldquo;From strategy to content in minutes.&rdquo;
        </p>

        {/* Password Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 text-left">
          <h2 className="text-lg font-bold text-gray-900 font-headline mb-5">
            Beta Access
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="beta-password" className="block text-sm font-medium text-gray-600 mb-1.5">
                Access Password
              </label>
              <input
                id="beta-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="••••••••••"
                autoFocus
                className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors
                  bg-gray-50 text-gray-900
                  placeholder:text-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'}`}
              />
              {error && (
                <p className="mt-1.5 text-sm text-red-500">
                  Invalid password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              🔓 Access BrandBOX
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            Powered by Iliad Interactive
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          &copy; 2026 Calton Group LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
