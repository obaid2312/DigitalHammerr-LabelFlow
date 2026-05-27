"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SyncState } from '@/types';
import { Loader } from '@/components/Loader';
import { 
  Mail, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  ToggleLeft, 
  ToggleRight,
  Info,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [togglingWatch, setTogglingWatch] = useState(false);

  const fetchSyncConfig = async () => {
    if (!user) return;
    setLoadingConfig(true);
    try {
      const syncRef = doc(db, 'sync_state', user.uid);
      const snap = await getDoc(syncRef);
      if (snap.exists()) {
        setSyncState(snap.data() as SyncState);
      } else {
        setSyncState(null);
      }
    } catch (e) {
      console.error('Failed to load sync preferences:', e);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSyncConfig();
    }
  }, [user]);

  const handleToggleRealtime = async () => {
    if (!user) return;
    setTogglingWatch(true);
    const hasActiveWatch = !!(syncState?.watchExpiration);
    
    try {
      if (hasActiveWatch) {
        // Turn OFF realtime sync
        await apiRequest('/api/gmail/watch', { method: 'DELETE' });
      } else {
        // Turn ON realtime sync
        await apiRequest('/api/gmail/watch', { method: 'POST' });
      }
      // Reload config state
      await fetchSyncConfig();
    } catch (e) {
      console.error('Failed to toggle realtime settings:', e);
    } finally {
      setTogglingWatch(false);
    }
  };

  const hasActiveWatch = !!(syncState?.watchExpiration);

  return (
    <DashboardLayout>
      <Navbar title="Settings" />

      <div className="p-8 space-y-8 max-w-4xl mx-auto">
        {loadingConfig ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" />
          </div>
        ) : (
          <>
            {/* Connected Account Details */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-soft p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Gmail Connection
              </h3>
              
              {user && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50"
                    />
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-slate-800">
                        {user.displayName || 'Gmail User'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Connected as <span className="font-medium text-slate-700">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={signInWithGoogle}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Reconnect Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sync Configurations */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-soft p-6 space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Synchronization Settings
              </h3>

              <div className="flex items-start justify-between gap-6 border-b border-slate-50 pb-5">
                <div className="space-y-1 max-w-lg">
                  <h4 className="text-xs font-bold text-slate-800">Real-time Incremental Sync</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Uses Google Pub/Sub webhooks to instantly notify LabelFlow whenever matches occur under your active labels. Saves database reads and CPU.
                  </p>
                </div>

                <button
                  onClick={handleToggleRealtime}
                  disabled={togglingWatch}
                  className={`focus:outline-none transition-opacity duration-150 cursor-pointer shrink-0 ${
                    togglingWatch ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                >
                  {hasActiveWatch ? (
                    <ToggleRight size={38} className="text-slate-900 stroke-[1.25]" />
                  ) : (
                    <ToggleLeft size={38} className="text-slate-350 stroke-[1.25]" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">History Sync Metrics</h4>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg space-y-2 text-[11px] text-slate-600 leading-normal">
                  <div className="flex justify-between">
                    <span>Last Synced Event</span>
                    <span className="font-semibold text-slate-700">
                      {syncState?.lastSync ? new Date(syncState.lastSync).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gmail History Token</span>
                    <span className="font-mono text-slate-500 truncate max-w-[200px]">
                      {syncState?.historyId || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Webhook Expiration</span>
                    <span className="font-semibold text-slate-700">
                      {syncState?.watchExpiration 
                        ? new Date(syncState.watchExpiration).toLocaleString() 
                        : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Least Privilege Scopes check */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-soft p-6 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <ShieldCheck size={16} className="text-slate-700" />
                <span>Google OAuth Security & Scopes</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                LabelFlow adheres strictly to Google's API Least Privilege security policies. We only request capabilities required to display your emails and manage labels:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-650 pl-1">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span>gmail.readonly (Read message details)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span>gmail.modify (Modify message labels)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span>userinfo.email (Authenticate profile email)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span>userinfo.profile (Authenticate username & photo)</span>
                </div>
              </div>
            </div>

            {/* Delete Account / Log Out */}
            <div className="bg-red-50/20 border border-red-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">Disconnect Integration</h4>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Disconnects your Gmail token from LabelFlow's servers. Your credentials will be cleared securely, stopping active real-time updates.
                </p>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center space-x-1.5 px-4.5 py-2 border border-red-200 hover:border-red-300 text-red-650 hover:text-red-700 hover:bg-red-50/50 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
              >
                <LogOut size={13} />
                <span>Disconnect & Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
export const dynamic = 'force-dynamic';
