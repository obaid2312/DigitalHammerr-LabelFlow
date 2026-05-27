"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { 
  Sparkles, 
  Mail, 
  Workflow, 
  ArrowRight, 
  Activity, 
  Filter, 
  Heart, 
  PieChart, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { user, signInWithGoogle, loading } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-100 bg-white/70 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
            <Workflow size={16} />
          </div>
          <span className="font-semibold text-slate-800 tracking-tight text-lg">LabelFlow</span>
        </div>

        <div>
          {loading ? (
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors duration-150"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Mail size={14} className="text-slate-500" />
              <span>Connect Gmail</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-3xl"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 text-slate-800 rounded-full border border-slate-200 text-xs font-semibold">
            <Sparkles size={12} className="text-slate-600 animate-pulse" />
            <span>AI-Powered Workspace Analytics</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Bring AI Intelligence <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
              To Your Gmail Labels
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Connect your Gmail, select your critical workflow labels, and let LabelFlow parse summaries, extract leads, score urgency, and deliver smart analytics.
          </p>

          <div className="flex items-center justify-center space-x-4 pt-4">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="w-4 h-4 bg-white rounded-full p-0.5"
                />
                <span>Sign in with Google</span>
              </button>
            )}
            <a
              href="#features"
              className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium shadow-sm transition-all duration-200"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Demo Interface Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' as const }}
          className="mt-16 w-full max-w-4xl bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <span className="text-[11px] text-slate-400 pl-2">labelflow.app/dashboard</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-left">
            <div className="col-span-1 border-r border-slate-100 pr-4 space-y-4">
              <div className="space-y-1">
                <div className="h-4 bg-slate-100 rounded w-16" />
                <div className="h-3 bg-slate-50 rounded w-24 animate-pulse-slow" />
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-slate-900 text-white rounded-lg flex items-center px-3 space-x-2 text-xs font-semibold">
                  <Mail size={12} />
                  <span>Recent Emails</span>
                </div>
                <div className="h-8 hover:bg-slate-50 rounded-lg flex items-center px-3 space-x-2 text-xs text-slate-600">
                  <Sparkles size={12} />
                  <span>AI Extraction</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="h-4 bg-slate-200 rounded w-28" />
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full font-bold">New Lead</span>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-slate-100 rounded w-5/6" />
                <div className="h-4 bg-slate-50 rounded w-full" />
                <div className="h-4 bg-slate-50 rounded w-4/5" />
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-800 text-xs font-semibold">
                  <Sparkles size={12} className="text-slate-600" />
                  <span>Gemini Executive Summary</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  "Sender requests a quotation for the Enterprise Tier. They have a budget of $20k/yr and would like a call this Wednesday."
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white border-y border-slate-100 py-24">
        <div className="max-w-6xl w-full mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              Built for Modern Productive Workflows
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Why browse endless feeds of unorganized emails? Filter automatically with Gmail labels, then let Gemini AI provide structured, actionable data.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4 hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <Filter size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Label Matching</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect and sync specific custom or system Gmail labels. Zero overhead, zero clutter.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4 hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Gemini Intelligence</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Auto-generate action items, extract key entities, detect sentiment, and categorize incoming threads.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4 hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <Activity size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Realtime Pub/Sub Sync</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get instant notifications and incremental synchronization using Google Cloud Pub/Sub subscriptions.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-slate-500 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs">
              <Workflow size={10} />
            </div>
            <span className="font-semibold text-slate-800 tracking-tight">LabelFlow</span>
          </div>

          <p>© 2026 LabelFlow. Built with Next.js, Firebase & Gemini AI.</p>

          <div className="flex items-center space-x-1">
            <span>Made with</span>
            <Heart size={10} className="text-red-500 fill-red-500" />
            <span>for productivity creators.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
