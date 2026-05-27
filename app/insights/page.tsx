"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Navbar } from '@/components/Navbar';
import { apiRequest } from '@/lib/api';
import { EmailMetadata } from '@/types';
import { Loader, CardSkeleton, Skeleton } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';
import { 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight,
  TrendingDown,
  Building,
  Flag,
  User as UserIcon,
  CheckCircle,
  Tag,
  AlertTriangle,
  Lightbulb
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
  CartesianGrid,
  Legend
} from 'recharts';

import { useAuth } from '@/lib/authContext';

export default function AIInsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const [emails, setEmails] = useState<EmailMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/gmail/emails?limit=100');
      setEmails(data.emails || []);
    } catch (e) {
      console.error('Failed to load insights data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchEmails();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

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

  if (loading) {
    return (
      <DashboardLayout>
        <Navbar title="AI Insights" />
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-60 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" />
          </div>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // 1. Leads Filtering
  const leads = emails
    .filter((e) => e.leadScore && e.leadScore > 0)
    .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

  const highPriorityLeadsCount = leads.filter((l) => l.leadScore && l.leadScore >= 70).length;

  // 2. Sentiment Analytics
  const sentimentCounts = emails.reduce(
    (acc, email) => {
      const sent = email.sentiment || 'neutral';
      acc[sent] = (acc[sent] || 0) + 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 } as Record<string, number>
  );

  const sentimentData = [
    { name: 'Positive Sentiment', value: sentimentCounts.positive, color: '#10b981' },
    { name: 'Neutral Sentiment', value: sentimentCounts.neutral, color: '#64748b' },
    { name: 'Negative Sentiment', value: sentimentCounts.negative, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // 3. Category Breakdown
  const categoryCounts = emails.reduce((acc, email) => {
    const cat = email.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 4. Time Series Trend Data
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
      .slice(-10); // Keep last 10 days
  };

  const trendData = getTrendData();

  // 5. Contacts List & Priority Scoring
  const getImportantContacts = () => {
    const contacts: Record<string, { name: string; emailStr: string; count: number; maxScore: number }> = {};
    emails.forEach((email) => {
      const parts = email.from.split('<');
      const name = parts[0].trim() || parts[1]?.replace('>', '').trim() || email.from;
      const emailStr = parts[1] ? parts[1].replace('>', '').trim() : email.from;

      if (!contacts[emailStr]) {
        contacts[emailStr] = { name, emailStr, count: 0, maxScore: 0 };
      }
      contacts[emailStr].count += 1;
      contacts[emailStr].maxScore = Math.max(contacts[emailStr].maxScore, email.leadScore || 0);
    });

    return Object.values(contacts)
      .sort((a, b) => b.count - a.count || b.maxScore - a.maxScore)
      .slice(0, 5); // Top 5
  };

  const importantContacts = getImportantContacts();

  return (
    <DashboardLayout>
      <Navbar title="AI Analytics & Insights" isSyncing={syncing} onSync={handleSync} />

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {emails.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No AI Data Available"
            description="You need to sync emails containing active labels so Gemini can run categorizations, sentiment tags, and lead metrics."
            actionLabel="Sync Emails"
            onAction={handleSync}
          />
        ) : (
          <>
            {/* Header Summary Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Insight Recommendation Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-soft text-white space-y-4">
                <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <Lightbulb size={14} className="text-yellow-400" />
                  <span>Workflow Strategy</span>
                </div>
                <h4 className="text-sm font-bold leading-snug">
                  {highPriorityLeadsCount > 0 
                    ? `You have ${highPriorityLeadsCount} high-priority inquiries requiring immediate action.`
                    : "Inbox health is solid. No urgent lead opportunities detected."}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gemini analyzes message intents on-the-fly. Leads scoring above 70 indicate high purchase or action intent.
                </p>
              </div>

              {/* Sentiment Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Sentiment</span>
                  <div className="flex items-baseline space-x-1.5">
                    <h4 className="text-xl font-bold text-slate-800">
                      {Math.round(((sentimentCounts.positive || 0) / emails.length) * 100)}% Positive
                    </h4>
                    <span className="text-xs text-green-600 font-semibold flex items-center">
                      <ArrowUpRight size={12} />
                      <span>optimal</span>
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Positive interactions build long term trust. Leverage positive feedback for marketing campaigns.
                </p>
              </div>

              {/* Volume Card */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volume Trend</span>
                  <div className="flex items-baseline space-x-1.5">
                    <h4 className="text-xl font-bold text-slate-800">
                      {emails.length} Analyzed
                    </h4>
                    <span className="text-xs text-slate-400">last 100 threads</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Monitoring inbox rates helps estimate response bandwidth and identify bottleneck hours.
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traffic Trend Line Chart */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Email Traffic History
                </h4>
                <div className="h-64 w-full min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" style={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis style={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sentiment Overview Chart */}
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Sentiment Distribution
                </h4>
                <div className="h-64 w-full min-h-[240px]">
                  {sentimentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} threads`, 'Count']} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No sentiment tags processed yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Lead Opportunities & Important Senders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leads Panel */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl shadow-soft overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Extracted Lead Opportunities
                  </h4>
                </div>

                <div className="divide-y divide-slate-50">
                  {leads.slice(0, 6).map((lead) => (
                    <Link
                      key={lead.messageId}
                      href={`/email/${lead.messageId}`}
                      className="block p-5 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center space-x-2">
                          <Building size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">
                            {lead.aiExtraction?.company || 'Unknown Company'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded font-bold shadow-sm">
                          Score: {lead.leadScore}
                        </span>
                      </div>

                      <h5 className="text-xs font-semibold text-slate-850 truncate mb-1">
                        {lead.subject}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed mb-2">
                        {lead.aiExtraction?.intent || lead.snippet}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <UserIcon size={10} />
                          <span>{lead.aiExtraction?.contactName || lead.from.split('<')[0]}</span>
                        </span>
                        
                        {lead.aiExtraction?.urgency && (
                          <span className={`px-1.5 py-0.5 rounded font-bold capitalize ${
                            lead.aiExtraction.urgency === 'urgent' || lead.aiExtraction.urgency === 'high'
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}>
                            {lead.aiExtraction.urgency} Urgency
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}

                  {leads.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No lead opportunities extracted yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Top Senders Panel */}
              <div className="bg-white border border-slate-100 rounded-xl shadow-soft overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Important Senders
                  </h4>
                </div>

                <div className="divide-y divide-slate-50">
                  {importantContacts.map((contact, index) => (
                    <div key={contact.emailStr} className="p-4 flex items-center space-x-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {contact.name.charAt(0) || '#'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-800 truncate">
                          {contact.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 truncate">
                          {contact.emailStr}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {contact.count} threads
                        </span>
                      </div>
                    </div>
                  ))}

                  {importantContacts.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No contacts monitored.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
export const dynamic = 'force-dynamic';
