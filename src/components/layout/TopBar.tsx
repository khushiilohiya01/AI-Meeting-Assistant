'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Sparkles,
  X,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { currentLoggedInUser } from '@/data/participants';
import { Avatar } from '@/components/ui/Avatar';
import { navItems } from './Sidebar';
import { cn } from '@/lib/utils';

export function TopBar({ onOpenNewMeeting }: { onOpenNewMeeting?: () => void }) {
  const pathname = usePathname();
  const {
    setIsSearchOpen,
    isMobileNavOpen,
    setIsMobileNavOpen,
    reports,
    tasks,
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumb title
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/meetings') return 'Meetings';
    if (pathname.startsWith('/meetings/')) return 'Meeting Details';
    if (pathname === '/reports') return 'AI Reports';
    if (pathname.startsWith('/reports/')) return 'Intelligence Report';
    if (pathname === '/tasks') return 'Tasks';
    if (pathname === '/deadlines') return 'Deadlines';
    if (pathname === '/calendar') return 'Calendar';
    return 'Meeting Intelligence';
  };

  return (
    <>
      <header className="h-16 px-4 md:px-8 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              {getPageTitle()}
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-600">
              /
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-500">
              Live Workspace
            </span>
          </div>
        </div>

        {/* Center / Right: Global Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md justify-end md:justify-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-sm hidden sm:flex items-center justify-between px-3 py-1.5 rounded-full text-xs text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800/80 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search meetings, transcripts, tasks...</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Schedule Button */}
          {onOpenNewMeeting && (
            <button
              onClick={onOpenNewMeeting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Meeting</span>
            </button>
          )}

          {/* Notifications Popover */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-950" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <span>Recent Intelligence Updates</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">
                    All caught up
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Q3 Enterprise Strategy report ready
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        3 decisions & 4 action items extracted
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-start gap-2.5 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Contrast audit task completed
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Elena finished WCAG verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link
                    href="/reports"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all reports &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Monogram / Workspace Member indicator */}
          <div
            title="Public Workspace Access (Alex Vance)"
            className="flex items-center gap-2 pl-2 border-l border-slate-200/60 dark:border-slate-800/60"
          >
            <Avatar participant={currentLoggedInUser} size="sm" />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-none">
                {currentLoggedInUser.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Public Access
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-white dark:bg-slate-900 h-full p-4 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Vesper AI
                </span>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Open Workspace
              </p>
              <p className="text-[11px] mt-0.5">
                Full access enabled without sign-up.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
