'use client';

import { AuthForm } from '../../_components/AuthForm';
import { useAuth } from '../../_lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { disableDemoMode, enableDemoMode, isDemoMode } from '../../_lib/demo';

export default function SignInPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSuccess = () => {
    if (isDemoMode()) {
      disableDemoMode();
      window.location.href = '/';
      return;
    }
    router.push('/');
  };

  const handleDemo = () => {
    enableDemoMode();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Sparkquest account
          </p>
        </div>

        <AuthForm mode="signin" onSuccess={handleSuccess} />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs uppercase tracking-wider text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleDemo}
            className="btn-secondary w-full"
          >
            See a demo
          </button>
          <p className="text-xs text-center text-gray-500">
            Try Sparkquest with sample data — no account needed.
          </p>
        </div>
      </div>
    </div>
  );
}
