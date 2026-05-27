"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Navbar } from '@/components/Navbar';
import { apiRequest } from '@/lib/api';
import { GmailLabel } from '@/types';
import { Loader, CardSkeleton } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import { Tag, Search, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/lib/authContext';

export default function LabelsPage() {
  const { user, loading: authLoading } = useAuth();
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [savingLabelId, setSavingLabelId] = useState<string | null>(null);

  const fetchLabels = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const url = refresh ? '/api/gmail/labels?refresh=true' : '/api/gmail/labels';
      const data = await apiRequest(url);
      setLabels(data.labels || []);
    } catch (e) {
      console.error('Failed to fetch labels:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchLabels();
    }
  }, [user, authLoading]);

  const handleToggleLabel = async (labelId: string, currentStatus: boolean) => {
    setSavingLabelId(labelId);
    try {
      await apiRequest('/api/gmail/labels', {
        method: 'POST',
        body: JSON.stringify({
          labelId,
          isActive: !currentStatus,
        }),
      });

      // Update local state
      setLabels((prev) =>
        prev.map((l) => (l.labelId === labelId ? { ...l, isActive: !currentStatus } : l))
      );
    } catch (e) {
      console.error('Failed to toggle label sync status:', e);
    } finally {
      setSavingLabelId(null);
    }
  };

  // Filter labels based on search query
  const filteredLabels = labels.filter((label) =>
    label.labelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemLabels = filteredLabels.filter((l) => l.type === 'system');
  const userLabels = filteredLabels.filter((l) => l.type === 'user');

  return (
    <DashboardLayout>
      <Navbar 
        title="Gmail Labels" 
        isSyncing={refreshing} 
        onSync={() => fetchLabels(true)} 
      />

      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Gmail labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:border-slate-350 focus:ring-1 focus:ring-slate-350 shadow-soft transition-all duration-150"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : labels.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No Labels Found"
            description="We couldn't load any labels from your Gmail account. Click Refresh above to retry authorization."
          />
        ) : (
          <div className="space-y-8">
            {/* Custom User Labels Section */}
            {userLabels.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span>Custom Created Labels</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full font-bold">
                      {userLabels.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Toggle switch to sync emails under these categories</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userLabels.map((label) => {
                    const isSaving = savingLabelId === label.labelId;
                    return (
                      <div
                        key={label.labelId}
                        className={`p-4 bg-white border rounded-xl flex items-center justify-between shadow-soft transition-all duration-200 ${
                          label.isActive 
                            ? 'border-slate-300 ring-1 ring-slate-100 bg-slate-50/20' 
                            : 'border-slate-200/70 hover:border-slate-250'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            label.isActive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'
                          }`}>
                            <Tag size={14} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-800 truncate">
                              {label.labelName}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Custom Gmail category
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleLabel(label.labelId, label.isActive)}
                          disabled={isSaving}
                          className={`focus:outline-none transition-opacity duration-150 cursor-pointer ${
                            isSaving ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'
                          }`}
                        >
                          {label.isActive ? (
                            <ToggleRight size={38} className="text-slate-900 stroke-[1.25]" />
                          ) : (
                            <ToggleLeft size={38} className="text-slate-350 stroke-[1.25]" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* System Labels Section */}
            {systemLabels.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span>System Labels</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full font-bold">
                      {systemLabels.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Default core labels provided by Google</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemLabels.map((label) => {
                    const isSaving = savingLabelId === label.labelId;
                    return (
                      <div
                        key={label.labelId}
                        className={`p-4 bg-white border rounded-xl flex items-center justify-between shadow-soft transition-all duration-200 ${
                          label.isActive 
                            ? 'border-slate-350 bg-slate-50/20' 
                            : 'border-slate-200/70 hover:border-slate-250'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            label.isActive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'
                          }`}>
                            <Tag size={14} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-800 truncate">
                              {label.labelName}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              System core category
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleLabel(label.labelId, label.isActive)}
                          disabled={isSaving}
                          className={`focus:outline-none transition-opacity duration-150 cursor-pointer ${
                            isSaving ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'
                          }`}
                        >
                          {label.isActive ? (
                            <ToggleRight size={38} className="text-slate-900 stroke-[1.25]" />
                          ) : (
                            <ToggleLeft size={38} className="text-slate-350 stroke-[1.25]" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export const dynamic = 'force-dynamic';
