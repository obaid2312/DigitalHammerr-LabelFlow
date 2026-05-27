"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

function ErrorDetails() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'UnknownError';

  const errorMessages: Record<string, string> = {
    MissingAuthorizationCode: 'No authorization code was returned from Google.',
    EmailNotProvided: 'Could not retrieve your email address from Google.',
    OAuthExchangeFailed: 'Failed to exchange credentials with Google. Please try again.',
    LoginFailed: 'Could not log in to the secure dashboard with the returned token.',
    MissingToken: 'The authentication callback did not contain a valid token.',
    UnknownError: 'An unexpected authentication error occurred.',
  };

  const message = errorMessages[error] || errorMessages.UnknownError;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-soft p-8 max-w-md w-full">
      <div className="flex items-center justify-center w-12 h-12 bg-red-50 text-red-600 rounded-full mb-4 mx-auto border border-red-100">
        <AlertCircle size={24} />
      </div>
      
      <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Authentication Failed</h2>
      <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
        {message}
      </p>

      <div className="space-y-3">
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors duration-150"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Suspense fallback={
        <div className="bg-white border border-slate-200 rounded-xl shadow-soft p-8 max-w-md w-full text-center">
          <p className="text-sm text-slate-500">Loading error details...</p>
        </div>
      }>
        <ErrorDetails />
      </Suspense>
    </div>
  );
}
