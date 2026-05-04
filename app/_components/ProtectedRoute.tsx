'use client';

import { useAuth } from '../_lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isDemoMode } from '../_lib/demo';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setDemo(isDemoMode());
  }, []);

  useEffect(() => {
    if (!loading && !user && !isDemoMode()) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !demo) {
    return null; // Will redirect to sign-in
  }

  return <>{children}</>;
}