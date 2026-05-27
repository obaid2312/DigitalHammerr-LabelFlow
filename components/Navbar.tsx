"use client";

import React from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  title: string;
  isSyncing?: boolean;
  onSync?: () => void;
  lastSynced?: string | null;
}

export function Navbar({ title, isSyncing = false, onSync, lastSynced }: NavbarProps) {
  const formattedSyncTime = lastSynced
    ? new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{title}</h1>

      <div className="flex items-center space-x-4">
        {/* Connection status badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-medium">
          <CheckCircle size={12} className="stroke-[2.5]" />
          <span>Gmail Connected</span>
        </div>

        {/* Sync Button */}
        {onSync && (
          <div className="flex items-center space-x-2">
            {formattedSyncTime && !isSyncing && (
              <span className="text-[11px] text-slate-400">
                Synced at {formattedSyncTime}
              </span>
            )}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-sm transition-all duration-150 cursor-pointer ${
                isSyncing
                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-350'
              }`}
            >
              <RefreshCw
                size={12}
                className={isSyncing ? 'animate-spin text-slate-400' : 'text-slate-500'}
              />
              <span>{isSyncing ? 'Syncing...' : 'Sync Inbox'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
