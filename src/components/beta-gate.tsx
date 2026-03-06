'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Lock } from 'lucide-react';

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

  const logoSrc = theme === 'dark' ? '/logo-light.png' : '/logo-dark.png';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-light.png"
            alt="Iliad Interactive"
            width={280}
            height={70}
            priority
            className="object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-headline">
              BrandBOX-Creator
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Beta Access Required
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="beta-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Code
              </label>
              <input
                id="beta-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Enter beta access code"
                autoFocus
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              />
              {error && (
                <p className="mt-1.5 text-sm text-red-500">
                  Invalid access code. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Enter Beta
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            Contact your administrator for access.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          &copy; 2026 Iliad Interactive Marketing Group
        </p>
      </div>
    </div>
  );
}
