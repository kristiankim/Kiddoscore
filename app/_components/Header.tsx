'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../_lib/auth';

export function Header() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

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
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center">
            <svg width="186" height="23" viewBox="0 0 186 23" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
              <path d="M10.384 17.462C6.6 17.462 2.552 16.34 0.44 14.712L2.42 11.302C4.246 12.754 7.656 13.81 10.67 13.81C12.892 13.81 14.3 13.282 14.3 12.468C14.3 11.786 13.288 11.368 10.89 11.104L7.986 10.774C3.014 10.246 0.88 8.86 0.88 6.066C0.88 2.678 4.708 0.763999 10.318 0.763999C13.64 0.763999 16.764 1.556 18.7 2.81L17.094 6.11C15.378 4.966 12.782 4.24 10.362 4.262C8.118 4.284 6.468 4.812 6.446 5.648C6.446 6.242 7.326 6.616 9.35 6.814L12.276 7.122C17.6 7.672 19.888 9.124 19.888 11.984C19.91 15.24 16.17 17.462 10.384 17.462ZM21.2042 21.62V5.648H25.6922L26.3742 8.574H26.3962C27.2762 6.572 29.7182 5.274 32.5782 5.274C36.6262 5.274 39.2662 7.672 39.2662 11.324C39.2662 14.976 36.6262 17.352 32.5782 17.352C29.7402 17.352 27.3202 16.076 26.4402 14.096H26.4182V21.62H21.2042ZM30.1362 13.898C32.5122 13.898 34.0522 12.886 34.0522 11.324C34.0522 9.762 32.5122 8.728 30.1362 8.728C27.7822 8.728 26.2202 9.762 26.2202 11.324C26.2202 12.886 27.7822 13.898 30.1362 13.898ZM45.6053 17.352C41.9973 17.352 39.8853 16.208 39.8853 14.228C39.8853 11.962 42.6353 10.422 47.3433 9.982L51.6773 9.586C52.1613 9.542 52.4473 9.366 52.4473 9.146C52.4473 8.596 51.1933 8.178 49.2793 8.178C46.5293 8.178 43.4493 9.058 41.2933 10.444L39.9293 7.738C42.1293 6.242 45.6933 5.274 49.2793 5.274C54.2733 5.274 57.5733 6.858 57.5733 9.652V17H53.0633L52.3593 14.536H52.3373C51.2153 16.274 48.7293 17.352 45.6053 17.352ZM47.4533 14.272C50.4013 14.272 52.3593 13.326 52.3593 11.94V11.896L47.6953 12.314C46.0013 12.446 45.0993 12.776 45.0993 13.37C45.0993 13.942 45.9133 14.272 47.4533 14.272ZM68.9356 5.274C71.4656 5.274 73.2036 7.232 73.3796 10.268L68.6276 11.192C68.5396 9.498 67.7916 8.42 66.7136 8.42C65.2396 8.42 64.3596 9.784 64.3596 11.94V17H59.1456V5.648H63.4796L64.1836 8.266H64.2056C65.0416 6.418 66.8896 5.274 68.9356 5.274ZM74.464 17V0.587999H79.678V9.014H79.7L84.1 5.648H90.546L84.804 9.96L90.656 17H84.694L81.152 12.512L79.678 13.612V17H74.464ZM114.468 9.124C114.468 13.766 110.552 17 104.546 17.484V17.77C104.546 18.606 105.25 19.09 106.416 19.09C107.78 19.09 109.342 18.628 110.574 17.682L111.828 20.014C110.266 21.29 108.022 22.06 105.712 22.06C102.72 22.06 100.916 20.674 100.916 18.32V17.44C95.1301 16.868 91.3901 13.678 91.3901 9.124C91.3901 4.064 96.0101 0.697999 102.918 0.697999C109.848 0.697999 114.468 4.064 114.468 9.124ZM97.1321 9.124C97.1321 11.742 99.4641 13.502 102.918 13.502C106.372 13.502 108.726 11.742 108.726 9.124C108.726 6.506 106.372 4.746 102.918 4.746C99.4641 4.746 97.1321 6.506 97.1321 9.124ZM121.734 17.374C118.126 17.374 115.838 15.35 115.86 12.072L115.882 5.648H121.052V11.522C121.052 13.326 122.174 14.404 124.11 14.404C126.31 14.404 127.652 13.128 127.652 10.972V5.648H132.844V17H128.356L127.806 14.25H127.784C126.728 16.142 124.572 17.374 121.734 17.374ZM144.058 17.352C138.206 17.352 134.246 14.998 134.246 11.302C134.246 7.76 137.92 5.274 143.178 5.274C148.348 5.274 151.758 7.672 151.758 11.324C151.758 11.654 151.714 12.138 151.604 12.512H139.724C140.318 13.832 142.298 14.36 144.432 14.36C146.676 14.36 148.942 13.876 150.108 13.216L151.538 15.68C149.998 16.67 147.094 17.352 144.058 17.352ZM139.636 10.29H146.522C146.456 8.992 144.96 8.112 143.134 8.112C141.264 8.112 139.834 9.014 139.636 10.29ZM161.408 17.352C158.152 17.352 154.654 16.626 152.74 15.548L154.104 12.908C155.644 13.854 158.504 14.558 161.078 14.558C163.542 14.558 164.642 14.206 164.642 13.678C164.642 13.216 163.828 12.974 162.266 12.864L159.45 12.644C155.622 12.38 153.664 11.456 153.664 9.388C153.664 6.55 156.898 5.274 161.364 5.274C163.762 5.274 166.138 5.78 168.14 6.77L166.908 9.168C165.5 8.442 163.344 7.892 161.298 7.892C159.472 7.892 158.064 8.178 158.064 8.75C158.064 9.19 158.746 9.366 160.11 9.476L162.926 9.718C167.084 10.026 169.174 10.994 169.174 13.26C169.174 16.098 165.852 17.352 161.408 17.352ZM178.624 17.352C174.928 17.352 172.662 15.68 172.662 12.952L172.64 8.816H169.472V5.648H172.64V2.612L177.832 1.688V5.648H184.762V8.816H177.832V11.786C177.832 13.15 178.536 13.854 180.12 13.854C181.66 13.854 182.804 13.304 184.036 12.182L185.136 15.108C183.376 16.692 181.418 17.352 178.624 17.352Z" fill="#D35800"/>
            </svg>
          </div>
          
          {pathname === '/parent' ? (
            <button
              onClick={() => router.push('/')}
              className="btn-secondary text-sm"
            >
              ← Back to app
            </button>
          ) : user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPinModal(true)}
                className="btn-secondary text-sm"
              >
                Manage
              </button>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/auth/signin')}
                className="btn-secondary text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="btn-primary text-sm"
              >
                Sign Up
              </button>
            </div>
          )}
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