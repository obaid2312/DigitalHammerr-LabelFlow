"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Navbar } from '@/components/Navbar';
import { apiRequest } from '@/lib/api';
import { EmailMetadata, GmailLabel } from '@/types';
import { 
  Loader, 
  TableSkeleton, 
  CardSkeleton,
  Skeleton
} from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import { 
  Mail, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Activity,
  Heart,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line,
  Legend
} from 'recharts';

import { useAuth } from '@/lib/authContext';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [emails, setEmails] = useState<EmailMetadata[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const emailsRes = await apiRequest('/api/gmail/emails?limit=100&activeOnly=true');
      setEmails(emailsRes.emails || []);

      const labelsRes = await apiRequest('/api/gmail/labels');
      setLabels(labelsRes.labels || []);

      // Get sync state details if available
      if (emailsRes.emails && emailsRes.emails.length > 0) {
        setLastSync(emailsRes.emails[0].createdAt || new Date().toISOString());
      } else {
        setLastSync(new Date().toISOString());
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiRequest('/api/gmail/emails', { method: 'POST', body: JSON.stringify({ limit: 20 }) });
      await fetchData(false);
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  // Compute stats on-the-fly from emails
  const totalEmails = emails.length;
  const totalLeads = emails.filter((e) => e.category === 'Leads' || (e.leadScore && e.leadScore > 50)).length;
  const avgLeadScore = totalLeads > 0 
    ? Math.round(emails.reduce((sum, e) => sum + (e.leadScore || 0), 0) / totalEmails) 
    : 0;

  // Sentiment Distribution
  const sentimentCounts = emails.reduce(
    (acc, email) => {
      const sent = email.sentiment || 'neutral';
      acc[sent] = (acc[sent] || 0) + 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 } as Record<string, number>
  );

  const sentimentData = [
    { name: 'Positive', value: sentimentCounts.positive, color: '#10b981' },
    { name: 'Neutral', value: sentimentCounts.neutral, color: '#64748b' },
    { name: 'Negative', value: sentimentCounts.negative, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Category Distribution
  const categoryCounts = emails.reduce((acc, email) => {
    const cat = email.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Label Activity Stats
  const activeLabels = labels.filter((l) => l.isActive);
  const labelEmailCounts = activeLabels.map((label) => {
    const count = emails.filter((email) => email.labels.includes(label.labelId)).length;
    return {
      name: label.labelName,
      count,
    };
  });

  // Email Date Trend (last 7 days)
  const getTrendData = () => {
    const dates: Record<string, number> = {};
    emails.forEach((email) => {
      if (!email.timestamp) return;
      const date = new Date(email.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dates[date] = (dates[date] || 0) + 1;
    });

    return Object.entries(dates)
      .map(([date, count]) => ({ date, count }))
      .reverse()
      .slice(-7);
  };

  const trendData = getTrendData();

  return (
    <DashboardLayout>
      <Navbar 
        title="Dashboard" 
        isSyncing={syncing} 
        onSync={handleSync} 
        lastSynced={lastSync}
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
            <TableSkeleton rows={4} />
          </div>
        ) : (
          <>
            {/* Analytics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Emails Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Synced Emails</p>
                  <h3 className="text-2xl font-extrabold text-slate-800">{totalEmails}</h3>
                </div>
              </div>

              {/* Identified Leads Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Urgent Leads</p>
                  <h3 className="text-2xl font-extrabold text-slate-800">{totalLeads}</h3>
                </div>
              </div>

              {/* Average Opportunity Score Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft flex items-center space-x-4">
                <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Lead Score</p>
                  <h3 className="text-2xl font-extrabold text-slate-800">{avgLeadScore}/100</h3>
                </div>
              </div>

              {/* Monitored Labels Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Labels</p>
                  <h3 className="text-2xl font-extrabold text-slate-800">{activeLabels.length}</h3>
                </div>
              </div>
            </div>

            {/* Empty State check */}
            {totalEmails === 0 ? (
              <EmptyState 
                icon={Mail}
                title="No Emails Synced Yet"
                description="Make sure to activate your desired Gmail labels so LabelFlow can sync and analyze incoming messages."
                actionLabel="Configure Labels"
                onAction={() => window.location.href = '/labels'}
              />
            ) : (
              <>
                {/* Visual Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sentiment Pie Chart */}
                  <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4 flex flex-col">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>Sentiment Distribution</span>
                      <Heart size={14} className="text-red-500" />
                    </h4>
                    <div className="h-56 w-full flex-1 min-h-[220px]">
                      {sentimentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sentimentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {sentimentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} emails`, 'Count']} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          Waiting for AI Sentiment Analysis...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auto-Categorization Bar Chart */}
                  <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4 flex flex-col">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>Email Classification</span>
                      <Activity size={14} className="text-slate-500" />
                    </h4>
                    <div className="h-56 w-full flex-1 min-h-[220px]">
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryData} layout="vertical" margin={{ left: -10, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} style={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip formatter={(value) => [`${value} emails`, 'Count']} />
                            <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          Waiting for AI Categorization...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Label Activity Bar Chart */}
                  <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4 flex flex-col">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>Label Activity</span>
                      <Tag size={14} className="text-slate-500" />
                    </h4>
                    <div className="h-56 w-full flex-1 min-h-[220px]">
                      {labelEmailCounts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={labelEmailCounts}>
                            <XAxis dataKey="name" style={{ fontSize: 9, fill: '#64748b' }} />
                            <YAxis style={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                            <Tooltip formatter={(value) => [`${value} emails`, 'Count']} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          Enable active labels to display counts.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Emails Section */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-soft overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">Recent Fetched Emails</h4>
                    <Link
                      href="/emails"
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-0.5 transition-colors"
                    >
                      <span>View All</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {emails.slice(0, 5).map((email) => {
                      const sentimentColors = {
                        positive: 'bg-green-50 text-green-700 border-green-100',
                        neutral: 'bg-slate-50 text-slate-700 border-slate-200',
                        negative: 'bg-red-50 text-red-700 border-red-100',
                      };

                      const emailActiveLabels = labels
                        .filter((l) => l.isActive && email.labels?.includes(l.labelId))
                        .map((l) => l.labelName);

                      return (
                        <Link
                          key={email.messageId}
                          href={`/email/${email.messageId}`}
                          className="block p-6 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xs font-bold text-slate-700 max-w-[180px] truncate">
                                {email.from.split('<')[0].trim() || email.from}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(email.timestamp).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {emailActiveLabels.map((lName) => (
                                <span
                                  key={lName}
                                  className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold rounded animate-fade-in"
                                >
                                  {lName}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center space-x-2">
                              {email.category && (
                                <span className="px-2 py-0.5 border border-slate-100 text-[10px] rounded-full font-bold bg-slate-900 text-white shadow-sm">
                                  {email.category}
                                </span>
                              )}
                              {email.sentiment && (
                                <span className={`px-2 py-0.5 border text-[10px] rounded-full font-bold capitalize ${
                                  sentimentColors[email.sentiment]
                                }`}>
                                  {email.sentiment}
                                </span>
                              )}
                            </div>
                          </div>

                          <h5 className="text-sm font-semibold text-slate-800 mb-1 leading-snug">
                            {email.subject}
                          </h5>
                          <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                            {email.aiSummary || email.snippet}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
export const dynamic = 'force-dynamic';
