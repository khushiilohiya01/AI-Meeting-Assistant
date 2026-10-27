'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  FileText,
  CheckSquare,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Command,
  Unlock,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Meetings', href: '/meetings', icon: Video },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Deadlines', href: '/deadlines', icon: Clock },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    theme,
    toggleTheme,
    setIsSearchOpen,
  } = useApp();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 z-30 transition-all duration-200 select-none border-r border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl',
        isSidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 transition-opacity hover:opacity-80',
            isSidebarCollapsed && 'justify-center w-full'
          )}
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Vesper
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  AI
                </span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Meeting Intelligence
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Quick Search Trigger */}
      <div className="px-3 pt-1 pb-3">
        <button
          onClick={() => setIsSearchOpen(true)}
          title="Search anything (Cmd+K)"
          className={cn(
            'w-full flex items-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg py-2 px-2.5 transition-colors group',
            isSidebarCollapsed
              ? 'justify-center'
              : 'justify-between bg-slate-50/80 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-850'
          )}
        >
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5" />
            {!isSidebarCollapsed && <span>Search...</span>}
          </div>
          {!isSidebarCollapsed && (
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isSidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50/60 dark:hover:bg-slate-900/40',
                isSidebarCollapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              />
              {!isSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Public Workspace Badge (No sign-in required notice) */}
      {!isSidebarCollapsed && (
        <div className="mx-3 mb-3 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Unlock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="font-medium text-slate-700 dark:text-slate-300 block">
              Open Access
            </span>
            <span>No login required. Free to explore all modules.</span>
          </div>
        </div>
      )}

      {/* Footer Controls: Theme Toggle & Collapse */}
      <div className="p-3 pb-5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            isSidebarCollapsed && 'w-full justify-center'
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
          {!isSidebarCollapsed && (
            <span className="text-xs">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {!isSidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            title="Collapse sidebar"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          title="Expand sidebar"
          className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </aside>
  );
}
