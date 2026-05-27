"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  LayoutDashboard, 
  Tag, 
  Mail, 
  Sparkles, 
  Settings, 
  LogOut,
  Workflow
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Labels', href: '/labels', icon: Tag },
    { name: 'Emails', href: '/emails', icon: Mail },
    { name: 'AI Insights', href: '/insights', icon: Sparkles },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-100 bg-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-50 space-x-2">
        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
          <Workflow size={16} />
        </div>
        <span className="font-semibold text-slate-800 tracking-tight text-lg">LabelFlow</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      {user && (
        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl mb-3 border border-slate-100">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email}`}
              alt="Avatar"
              className="w-9 h-9 rounded-full bg-slate-200 border border-slate-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user.displayName || 'LabelFlow User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full py-2 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
