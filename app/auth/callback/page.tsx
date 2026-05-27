"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Loader } from '@/components/Loader';

function CallbackHandler() {
  const { loginWithCustomToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      if (!token) {
        console.error('No custom auth token received.');
        router.push('/auth/error?error=MissingToken');
        return;
      }

      try {
        await loginWithCustomToken(token);
        // Successful login, go to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error logging in with custom token:', error);
        router.push('/auth/error?error=LoginFailed');
      }
    };

    handleAuth();
  }, [searchParams, loginWithCustomToken, router]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader size="lg" />
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Finalizing Sign-In</h2>
        <p className="text-sm text-slate-500 animate-pulse">Syncing Gmail permissions and secure tokens...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Suspense fallback={
        <div className="flex flex-col items-center space-y-4">
          <Loader size="lg" />
          <p className="text-sm text-slate-500">Loading auth parameters...</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
