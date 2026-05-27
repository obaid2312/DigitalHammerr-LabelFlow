"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Navbar } from '@/components/Navbar';
import { apiRequest } from '@/lib/api';
import { EmailMetadata, GmailLabel } from '@/types';
import { Loader, TableSkeleton } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import { 
  Search, 
  Mail, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Eye
} from 'lucide-react';

const CATEGORIES = ['Leads', 'Finance', 'Personal', 'Work', 'Support', 'Marketing', 'Spam-like'];
const SENTIMENTS = ['positive', 'neutral', 'negative'];

import { useAuth } from '@/lib/authContext';

export default function EmailsPage() {
  const { user, loading: authLoading } = useAuth();
  const [emails, setEmails] = useState<EmailMetadata[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');

  // Debounce search input to avoid double fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      let url = '/api/gmail/emails?limit=100';
      if (selectedLabel) url += `&labelId=${selectedLabel}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedSentiment) url += `&sentiment=${selectedSentiment}`;
      if (debouncedSearch) url += `&q=${encodeURIComponent(debouncedSearch)}`;

      const data = await apiRequest(url);
      setEmails(data.emails || []);
    } catch (e) {
      console.error('Failed to fetch emails:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    try {
      const data = await apiRequest('/api/gmail/labels');
      setLabels(data.labels || []);
    } catch (e) {
      console.error('Failed to fetch labels:', e);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchLabels();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEmails();
    }
  }, [selectedLabel, selectedCategory, selectedSentiment, debouncedSearch, user, authLoading]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiRequest('/api/gmail/emails', { method: 'POST', body: JSON.stringify({ limit: 20 }) });
      await fetchEmails();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedLabel('');
    setSelectedCategory('');
    setSelectedSentiment('');
    setSearchQuery('');
  };

  const activeLabels = labels.filter((l) => l.isActive);

  return (
    <DashboardLayout>
      <Navbar title="Emails Browse" isSyncing={syncing} onSync={handleSync} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Filters Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <Filter size={14} className="text-slate-500" />
            <span>Search & Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Query */}
            <div className="relative col-span-1 md:col-span-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-350 transition-all"
              />
            </div>

            {/* Label Filter */}
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:bg-white focus:border-slate-350 cursor-pointer"
            >
              <option value="">All Syncing Labels</option>
              {activeLabels.map((l) => (
                <option key={l.labelId} value={l.labelId}>
                  {l.labelName}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:bg-white focus:border-slate-350 cursor-pointer"
            >
              <option value="">All AI Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Sentiment Filter */}
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:bg-white focus:border-slate-350 cursor-pointer"
            >
              <option value="">All Sentiments</option>
              {SENTIMENTS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {(selectedLabel || selectedCategory || selectedSentiment || searchQuery) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <span className="text-[11px] text-slate-400">
                Showing {emails.length} filtered threads
              </span>
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Emails List / Table */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : emails.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No Matching Emails"
            description="We couldn't find any emails fitting your query. Try adjusting your filters or sync your inbox."
            actionLabel="Sync Inbox Now"
            onAction={handleSync}
          />
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-6">Sender</th>
                    <th className="py-3 px-4">Subject & Snippet</th>
                    <th className="py-3 px-4">AI Category</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {emails.map((email) => {
                    const sentimentColors: Record<string, string> = {
                      positive: 'bg-green-50 text-green-700 border-green-100',
                      neutral: 'bg-slate-50 text-slate-700 border-slate-200',
                      negative: 'bg-red-50 text-red-700 border-red-100',
                    };

                    const fromName = email.from.split('<')[0].trim() || email.from;

                    return (
                      <tr key={email.messageId} className="hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                        <td className="py-4.5 px-6 font-semibold text-slate-800 max-w-[150px] truncate">
                          {fromName}
                        </td>
                        <td className="py-4.5 px-4 max-w-sm">
                          <div className="font-semibold text-slate-850 mb-0.5 truncate">
                            {email.subject}
                          </div>
                          <div className="text-slate-450 text-[11px] truncate">
                            {email.aiSummary || email.snippet}
                          </div>
                        </td>
                        <td className="py-4.5 px-4">
                          {email.category ? (
                            <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] rounded-full font-bold shadow-sm">
                              {email.category}
                            </span>
                          ) : (
                            <span className="text-slate-350 italic">analyzing...</span>
                          )}
                        </td>
                        <td className="py-4.5 px-4">
                          {email.sentiment ? (
                            <span className={`px-2.5 py-0.5 border text-[10px] rounded-full font-bold capitalize ${
                              sentimentColors[email.sentiment]
                            }`}>
                              {email.sentiment}
                            </span>
                          ) : (
                            <span className="text-slate-350 italic">analyzing...</span>
                          )}
                        </td>
                        <td className="py-4.5 px-4 text-slate-450 text-[11px]">
                          {new Date(email.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <Link
                            href={`/email/${email.messageId}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 hover:text-slate-800 rounded-lg shadow-sm transition-all"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination simulation */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] text-slate-400">
                Showing {emails.length} of {emails.length} items
              </span>
              <div className="flex space-x-1">
                <button className="p-1.5 border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                <button className="p-1.5 border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export const dynamic = 'force-dynamic';
