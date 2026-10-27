'use client';

import React, { useState } from 'react';
import { X, Calendar, Check, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface ConnectCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectCalendarModal({ isOpen, onClose }: ConnectCalendarModalProps) {
  const { showToast } = useApp();
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleNotifyMe = () => {
    setIsSubscribed(true);
    showToast('Early access requested', 'We will notify your workspace when OAuth sync is ready', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Calendar Integration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                Two-Way Calendar Sync
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Google Calendar & Microsoft Outlook
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Coming Soon
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Automatic meeting ingestion, bot auto-joining for Zoom & Google Meet, and calendar invites with pre-attached AI dossiers will be available in the upcoming v2.1 update.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Zero-storage OAuth 2.0 with granular read-only calendar scope.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Smart agenda extraction from meeting invite descriptions.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleNotifyMe}
              disabled={isSubscribed}
              className="px-4 py-1.5 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubscribed ? 'Added to Waitlist ✓' : 'Notify Me at Launch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
