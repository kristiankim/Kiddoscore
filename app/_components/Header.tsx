'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../_lib/auth';
import { isSupabaseConfigured } from '../_lib/storage';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const isDemo = !isSupabaseConfigured();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePinSubmit = () => {
    if (pin.length === 4) {
      setShowPinModal(false);
      setPin('');
      router.push('/parent');
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      if (value.length === 4) {
        setTimeout(handlePinSubmit, 100);
      }
    }
  };

  return (
    <>
      <header className="glass-header px-4 py-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">Sparkquest</h1>
            {mounted && isDemo && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                Demo Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {pathname === '/parent' ? (
              <button
                onClick={() => router.push('/')}
                className="btn-secondary text-sm"
              >
                ← Back to app
              </button>
            ) : user ? (
              <>
                <button
                  onClick={() => setShowPinModal(true)}
                  className="btn-secondary text-sm"
                >
                  Parent Dashboard
                </button>
                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                <button
                  onClick={() => signOut()}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="btn-primary text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Pin Modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={e => e.target === e.currentTarget && setShowPinModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-title"
        >
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 id="pin-title" className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Enter Parent PIN
            </h2>

            <div className="space-y-4">
              <div className="flex justify-center">
                <input
                  type="password"
                  value={pin}
                  onChange={e => handlePinChange(e.target.value)}
                  className="input text-center text-2xl tracking-widest w-32"
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && pin.length === 4) {
                      handlePinSubmit();
                    } else if (e.key === 'Escape') {
                      setShowPinModal(false);
                      setPin('');
                    }
                  }}
                />
              </div>

              <div className="text-sm text-gray-500 text-center">
                Enter any 4-digit PIN for demo
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPin('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4}
                  className="btn-primary"
                >
                  Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}