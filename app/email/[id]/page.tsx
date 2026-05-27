"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Navbar } from '@/components/Navbar';
import { apiRequest } from '@/lib/api';
import { EmailMetadata, GmailLabel } from '@/types';
import { Loader, Skeleton } from '@/components/Loader';
import { 
  ArrowLeft, 
  Sparkles, 
  Tag, 
  AlertTriangle,
  Building2,
  User as UserIcon,
  Flag,
  Calendar,
  CheckSquare,
  Bookmark,
  Check,
  Plus,
  CornerUpLeft,
  Send
} from 'lucide-react';

export default function EmailDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const [emailId, setEmailId] = useState<string | null>(null);
  const [email, setEmail] = useState<EmailMetadata | null>(null);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [labelEditing, setLabelEditing] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);
  
  // Reply states
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [suggestingReply, setSuggestingReply] = useState(false);

  // Unwrap params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setEmailId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const fetchEmailDetails = async () => {
    if (!emailId) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/api/gmail/email/${emailId}`);
      setEmail(data.email || null);
    } catch (e) {
      console.error('Failed to load email details:', e);
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
    if (emailId) {
      fetchEmailDetails();
      fetchLabels();
    }
  }, [emailId]);

  const handleTriggerAI = async () => {
    if (!emailId) return;
    setAiAnalyzing(true);
    try {
      const res = await apiRequest('/api/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ emailId }),
      });
      // Fetch details again to load fresh analysis
      await fetchEmailDetails();
    } catch (e) {
      console.error('AI summary failed:', e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleToggleEmailLabel = async (labelId: string, isAssociated: boolean) => {
    if (!email || !emailId) return;
    setSavingLabels(true);
    try {
      const addLabelIds = isAssociated ? [] : [labelId];
      const removeLabelIds = isAssociated ? [labelId] : [];

      await apiRequest('/api/gmail/modify-labels', {
        method: 'POST',
        body: JSON.stringify({
          emailId,
          addLabelIds,
          removeLabelIds,
        }),
      });

      // Update local state
      setEmail((prev) => {
        if (!prev) return null;
        const updatedLabels = isAssociated
          ? prev.labels.filter((id) => id !== labelId)
          : [...prev.labels, labelId];
        return {
          ...prev,
          labels: updatedLabels,
        };
      });
    } catch (e) {
      console.error('Failed to modify labels:', e);
    } finally {
      setSavingLabels(false);
    }
  };

  const handleSuggestReply = async () => {
    setSuggestingReply(true);
    try {
      const res = await apiRequest('/api/gmail/reply', {
        method: 'POST',
        body: JSON.stringify({
          action: 'suggest',
          emailId,
        }),
      });
      if (res.suggestion) {
        setReplyText(res.suggestion);
      }
    } catch (e) {
      console.error('Failed to get reply suggestion:', e);
    } finally {
      setSuggestingReply(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !emailId) return;
    setSendingReply(true);
    setReplySuccess(false);
    try {
      await apiRequest('/api/gmail/reply', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send',
          emailId,
          replyBody: replyText,
        }),
      });
      setReplySuccess(true);
      setReplyText('');
      // Auto-hide success message after 4 seconds
      setTimeout(() => setReplySuccess(false), 4000);
    } catch (e) {
      console.error('Failed to send reply:', e);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading || !emailId) {
    return (
      <DashboardLayout>
        <Navbar title="Email Details" />
        <div className="p-8 space-y-6 max-w-5xl mx-auto">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!email) {
    return (
      <DashboardLayout>
        <Navbar title="Email Details" />
        <div className="p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Email Not Found</h3>
          <p className="text-sm text-slate-500 mb-6">The email requested could not be synced or does not exist.</p>
          <button
            onClick={() => router.push('/emails')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium shadow"
          >
            Back to Inbox
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const activeLabels = labels.filter((l) => l.isActive);

  // Map label IDs to their actual names
  const emailLabelNames = email.labels
    .map((id) => labels.find((l) => l.labelId === id)?.labelName || id)
    .filter((name) => name !== 'UNREAD'); // Skip unread badge to look cleaner

  return (
    <DashboardLayout>
      <Navbar title="Email Details" />

      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Navigation Link */}
        <Link
          href="/emails"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Emails</span>
        </Link>

        {/* Email Header */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] rounded-full font-bold shadow-sm">
              {email.category || 'Categorizing...'}
            </span>
            {emailLabelNames.map((name) => (
              <span
                key={name}
                className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded-full font-semibold"
              >
                {name}
              </span>
            ))}
            {email.sentiment && (
              <span className={`px-2.5 py-0.5 border text-[10px] rounded-full font-bold capitalize ${
                email.sentiment === 'positive' ? 'bg-green-50 text-green-700 border-green-100' :
                email.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-100' :
                'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                {email.sentiment}
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-950 leading-tight">
            {email.subject}
          </h2>

          <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-4 gap-2">
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-slate-750">From:</span> {email.from}
              </p>
              <p>
                <span className="font-semibold text-slate-750">To:</span> {email.to}
              </p>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0 text-[11px] text-slate-400">
              <Calendar size={12} />
              <span>{new Date(email.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dynamic AI Analysis Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* AI Summary Card */}
            <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                  <Sparkles size={16} className="text-slate-700" />
                  <span>Gemini Executive Insights</span>
                </h3>

                {!email.aiSummary && (
                  <button
                    onClick={handleTriggerAI}
                    disabled={aiAnalyzing}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-50 disabled:text-slate-400 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    <Sparkles size={12} className={aiAnalyzing ? 'animate-pulse' : ''} />
                    <span>{aiAnalyzing ? 'Analyzing...' : 'Generate Analysis'}</span>
                  </button>
                )}
              </div>

              {email.aiSummary ? (
                <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                  <p className="font-medium text-slate-800 text-sm leading-normal">
                    {email.aiSummary}
                  </p>

                  {/* Action Items */}
                  {email.aiExtraction?.actionItems && email.aiExtraction.actionItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                      <h4 className="font-bold text-slate-750 flex items-center space-x-1">
                        <CheckSquare size={13} />
                        <span>Action Items</span>
                      </h4>
                      <ul className="space-y-1.5 pl-1.5">
                        {email.aiExtraction.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Entities */}
                  {email.aiExtraction?.keyEntities && email.aiExtraction.keyEntities.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                      <h4 className="font-bold text-slate-750 flex items-center space-x-1">
                        <Bookmark size={13} />
                        <span>Key Entities Identified</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pl-1.5">
                        {email.aiExtraction.keyEntities.map((entity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[10px] text-slate-600 rounded"
                          >
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500 mb-2">No AI summaries have been calculated yet.</p>
                  <button
                    onClick={handleTriggerAI}
                    disabled={aiAnalyzing}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    <span>Analyze Email</span>
                  </button>
                </div>
              )}
            </div>

            {/* Email Message Content Body */}
            <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Message Content
              </h3>
              
              <div className="text-slate-750 text-xs leading-relaxed whitespace-pre-line overflow-x-auto max-h-[500px] font-sans selection:bg-slate-100">
                {email.body || email.snippet || '(No content available)'}
              </div>
            </div>

            {/* Send Reply Section */}
            <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                  <CornerUpLeft size={16} className="text-slate-700" />
                  <span>Send a Reply</span>
                </h3>

                <button
                  onClick={handleSuggestReply}
                  disabled={suggestingReply || sendingReply}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-450 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles size={12} className={suggestingReply ? 'animate-pulse' : ''} />
                  <span>{suggestingReply ? 'Drafting...' : 'Draft with Gemini'}</span>
                </button>
              </div>

              {replySuccess && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg flex items-center space-x-2 animate-fade-in">
                  <Check size={14} className="stroke-[2.5]" />
                  <span>Reply sent successfully!</span>
                </div>
              )}

              <div className="space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here, or click 'Draft with Gemini' to automatically generate a smart response..."
                  disabled={sendingReply}
                  rows={8}
                  className="w-full p-4 border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-transparent transition-all resize-y placeholder:text-slate-400"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    <Send size={12} />
                    <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Panels (Leads, Labels Management) */}
          <div className="space-y-8">
            {/* Lead Opportunity Extraction Panel */}
            {email.leadScore !== undefined && email.leadScore > 0 && (
              <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4">
                <h3 className="text-sm font-semibold text-slate-850 flex items-center space-x-1.5 border-b border-slate-50 pb-3">
                  <Plus size={16} className="text-blue-600" />
                  <span>Lead Intelligence</span>
                </h3>

                <div className="space-y-4 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Opportunity Score</span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold border border-blue-100 rounded-full text-[11px]">
                      {email.leadScore}/100
                    </span>
                  </div>

                  {email.aiExtraction?.company && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="shrink-0 flex items-center space-x-1">
                        <Building2 size={12} className="text-slate-400" />
                        <span>Company</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-right truncate">
                        {email.aiExtraction.company}
                      </span>
                    </div>
                  )}

                  {email.aiExtraction?.contactName && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="shrink-0 flex items-center space-x-1">
                        <UserIcon size={12} className="text-slate-400" />
                        <span>Contact</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-right truncate">
                        {email.aiExtraction.contactName}
                      </span>
                    </div>
                  )}

                  {email.aiExtraction?.urgency && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Flag size={12} className="text-slate-400" />
                        <span>Urgency</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold capitalize text-[10px] ${
                        email.aiExtraction.urgency === 'urgent' || email.aiExtraction.urgency === 'high'
                          ? 'bg-red-50 text-red-700'
                          : email.aiExtraction.urgency === 'medium'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {email.aiExtraction.urgency}
                      </span>
                    </div>
                  )}

                  {email.aiExtraction?.intent && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Extracted Intent</span>
                      <p className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[11px] leading-relaxed italic text-slate-700">
                        "{email.aiExtraction.intent}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Labels Management Panel */}
            <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                  <Tag size={16} className="text-slate-700" />
                  <span>Modify Labels</span>
                </h3>
                <button
                  onClick={() => setLabelEditing(!labelEditing)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {labelEditing ? 'Close' : 'Manage'}
                </button>
              </div>

              {labelEditing ? (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {activeLabels.map((label) => {
                    const isAssociated = email.labels.includes(label.labelId);
                    return (
                      <button
                        key={label.labelId}
                        onClick={() => handleToggleEmailLabel(label.labelId, isAssociated)}
                        disabled={savingLabels}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${
                          isAssociated
                            ? 'bg-blue-50/50 border-blue-200 text-blue-800'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        <span>{label.labelName}</span>
                        {isAssociated ? (
                          <Check size={14} className="text-blue-600 stroke-[2.5]" />
                        ) : (
                          <Plus size={14} className="text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                  {activeLabels.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      No active labels configured. Activate some in settings/labels first.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {emailLabelNames.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 border border-slate-200 text-[10px] text-slate-650 rounded-lg bg-slate-50/50 font-medium"
                    >
                      {name}
                    </span>
                  ))}
                  {emailLabelNames.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No labels associated.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export const dynamic = 'force-dynamic';
